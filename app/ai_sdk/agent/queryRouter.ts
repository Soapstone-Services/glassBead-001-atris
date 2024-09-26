import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function routeQuery(input: string): Promise<"audius" | "general"> {
  // Initialize the language model
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo", // Using a smaller model for efficiency
    temperature: 0, // Set to 0 for deterministic output
  });

  // Define the prompt template for query classification
  const prompt = ChatPromptTemplate.fromTemplate(`
    You are a query classifier for a chatbot that can answer questions about the Audius music platform and general topics.
    Your task is to determine if the following query is specifically about Audius and its API, or if it's a general question.
    
    Query: {input}
    
    Respond with either "audius" if the query is specifically about Audius or its API, or "general" for any other type of question.
    Only respond with one of these two words.
  `);

  // Create a chain by combining the prompt and the language model
  const chain = prompt.pipe(llm);

  // Invoke the chain with the input query
  const response = await chain.invoke({ input });

  // Extract the content from the response, handling different possible formats
  const content = typeof response.content === 'string' 
    ? response.content 
    : 'text' in response.content[0] 
      ? response.content[0].text 
      : '';
  
  // Normalize the result
  const result = content.toLowerCase().trim();

  // Return the result if it's valid, otherwise default to "general"
  if (result === "audius" || result === "general") {
    return result;
  } else {
    console.warn(`Unexpected router response: ${result}. Defaulting to "general".`);
    return "general";
  }
}
