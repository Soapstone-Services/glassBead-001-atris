import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { vectorStore } from '@/app/lib/supabase/client';

const TEMPLATE = `Answer the following question based on the provided context:

Context: {context}

Question: {question}

Answer: `;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    });

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    
    const documentChain = await createStuffDocumentsChain({
      llm: model,
      prompt,
    });

    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain,
      retriever: vectorStore.asRetriever(),
    });

    const response = await retrievalChain.invoke({
      input: query,
    });

    return NextResponse.json({ result: response.answer });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
