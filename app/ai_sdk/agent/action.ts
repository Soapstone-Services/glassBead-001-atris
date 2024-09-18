"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { createStreamableValue } from "ai/rsc";

// Define the main function to run the agent
export async function runAgent(input: string) {
  "use server";

  // Create a streamable value for real-time updates
  const stream = createStreamableValue();

  // Use an IIFE to handle asynchronous operations
  (async () => {
    // Define the tools the agent can use (in this case, just TavilySearchResults)
    const tools = [new TavilySearchResults({ maxResults: 1 })];

    // Pull a pre-defined prompt template from LangChain's prompt hub
    const prompt = await pull<ChatPromptTemplate>(
      "hwchase17/openai-tools-agent",
    );

    // Initialize the language model (ChatOpenAI)
    const llm = new ChatOpenAI({
      model: "gpt-4o-2024-05-13",
      temperature: 0,
    });

    // Create the agent using the LLM, tools, and prompt
    const agent = createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    // Create an executor for the agent
    const agentExecutor = new AgentExecutor({
      agent,
      tools,
    });

    // Start streaming events from the agent execution
    const streamingEvents = agentExecutor.streamEvents(
      {
        input,
      },
      {
        version: "v2",
      },
    );

    // Iterate through the streaming events and update the stream
    for await (const item of streamingEvents) {
      stream.update(JSON.parse(JSON.stringify(item, null, 2)));
    }

    // Mark the stream as complete
    stream.done();
  })();

  // Return the streamable value
  return { streamData: stream.value };
}
