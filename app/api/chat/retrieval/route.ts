import { createAudiusVectorStore } from '@/app/lib/vectorstore/vectorstore';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AudiusAPI } from '../../../ai_sdk/tools/audius/audiusAPI';
import { Effect } from 'effect';
import { createClient } from '@supabase/supabase-js';
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import axios from 'axios';

const MAX_CONTEXT_LENGTH = 4000;
const MAX_AUDIUS_DATA_LENGTH = 2000;

const audiusAPI = new AudiusAPI(process.env.AUDIUS_API_KEY!, process.env.AUDIUS_API_SECRET!);

export const runtime = 'nodejs';

const CONDENSE_TEMPLATE = `Given the following conversation about Audius music platform and a follow up question, rephrase the follow up question to be a standalone question about Audius.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const ANSWER_TEMPLATE = `You are an Audius AI assistant. Answer based on:
Context: {context}
Chat history: {chat_history}
Audius data: {audiusData}
Question: {question}
If Audius data is available, use it as the primary source for your answer. For questions about specific tracks, users, or playlists, the Audius data should be considered the most accurate and up-to-date information. If Audius data is not available or not relevant to the question, use the context and web search results. Answer concisely and directly. If you don't have the exact information, say so.`;

const combineDocumentsFn = (docs: any) => {
  return docs.map((doc: any) => doc.pageContent).join('\n\n');
};

export async function POST(req: Request) {
  if (!process.env.PUBLIC_SUPABASE_URL || !process.env.SUPABASE_PRIVATE_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  const body = await req.json();
  const messages = body.messages ?? [];
  const question = messages[messages.length - 1].content;
  const history = messages.slice(0, -1);

  const supabaseClient = createClient(
    process.env.PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_PRIVATE_KEY
  );

  console.log("PUBLIC_SUPABASE_URL:", process.env.PUBLIC_SUPABASE_URL);
  console.log("SUPABASE_PRIVATE_KEY:", process.env.SUPABASE_PRIVATE_KEY ? "Set" : "Not set");
  console.log("Supabase Client:", supabaseClient ? "Created" : "Not created");

  const vectorStore = await createAudiusVectorStore(supabaseClient);

  const embeddings = new OpenAIEmbeddings();

  const relevantDocs = await vectorStore.similaritySearch(question, 2); // Reduced from 3 to 2

  let context = combineDocumentsFn(relevantDocs).slice(0, MAX_CONTEXT_LENGTH);

  const llm = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
  });

  async function determineQuestionType(question: string): Promise<'general' | 'specific'> {
    const response = await llm.invoke([
      { role: "system", content: "You are a helpful assistant that determines question types." },
      { role: "user", content: `Determine if this is a general question about Audius or specific about tracks, users, or playlists. Answer "general" or "specific": ${question}` }
    ]);

    if (typeof response.content === 'string') {
      return response.content.trim().toLowerCase() as 'general' | 'specific';
    } else if (Array.isArray(response.content)) {
      const textContent = response.content.find(item => 'text' in item);
      if (textContent && 'text' in textContent) {
        return textContent.text.trim().toLowerCase() as 'general' | 'specific';
      }
    }
    throw new Error('Unexpected response format from LLM');
  }

  const questionType = await determineQuestionType(question);

  const standaloneQuestionChain = RunnableSequence.from([
    PromptTemplate.fromTemplate(CONDENSE_TEMPLATE),
    llm,
    new StringOutputParser(),
  ]);

  const standaloneQuestion = await standaloneQuestionChain.invoke({
    question,
    chat_history: history.map((m: any) => m.content).join('\n'),
  });

  let audiusData = await fetchAudiusData(standaloneQuestion);
  let audiusInfo = "";
  if (audiusData) {
    audiusInfo = `The track "${audiusData.title}" by ${audiusData.artist} has ${audiusData.playCount} plays on Audius.`;
  } else {
    audiusInfo = "No specific Audius track information found.";
  }

  if (questionType === 'general') {
    const webSearchResults = await performWebSearch(question);
    context = `${context}\n\nWeb search results: ${webSearchResults}`.slice(0, MAX_CONTEXT_LENGTH);
  }

  const answerChain = RunnableSequence.from([
    PromptTemplate.fromTemplate(ANSWER_TEMPLATE),
    llm,
    new StringOutputParser(),
  ]);

  const stream = await answerChain.stream({
    context,
    question: standaloneQuestion,
    chat_history: history.map((m: any) => m.content).join('\n').slice(-500), // Reduced chat history length
    audiusData: audiusInfo,
  });

  const { readable, writable } = new TransformStream();
  stream.pipeTo(writable);

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function fetchAudiusData(query: string) {
  console.log("Fetching Audius data for query:", query);
  const apiKey = process.env.AUDIUS_API_KEY!;
  const apiSecret = process.env.AUDIUS_API_SECRET!;
  const audius = new AudiusAPI(apiKey, apiSecret);

  try {
    // Extract track name and artist from the query
    const match = query.match(/(?:"([^"]+)"|(\S+))\s+by\s+(\S+)/i);
    if (!match) {
      return null;
    }

    const trackName = match[1] || match[2];
    const artistName = match[3];

    const tracksEffect = audius.searchTracks(`${trackName} ${artistName}`, { limit: 5 });
    const tracks = await Effect.runPromise(tracksEffect);

    const specificTrack = tracks.find(track => 
      track.title.toLowerCase().includes(trackName.toLowerCase()) &&
      track.user.name.toLowerCase().includes(artistName.toLowerCase())
    );

    if (specificTrack) {
      console.log("Specific track details fetched:", specificTrack);
      return {
        title: specificTrack.title,
        artist: specificTrack.user.name,
        playCount: specificTrack.playCount,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching Audius data:", error);
    return null;
  }
}

async function performWebSearch(query: string): Promise<string> {
  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.TAVILY_API_KEY,
      query: query,
      search_depth: "basic",
      max_results: 3
    });

    const results = response.data.results;
    let formattedResults = '';

    results.forEach((result: any, index: number) => {
      formattedResults += `${index + 1}. ${result.title}\n${result.content}\n\n`;
    });

    return formattedResults.trim() || `No relevant web search results found for "${query}".`;
  } catch (error) {
    console.error('Error performing web search:', error);
    return `Error performing web search for "${query}".`;
  }
}
