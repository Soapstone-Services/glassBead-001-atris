import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { AudiusAPI } from "../../ai_sdk/tools/audiusAPI";

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

export const runtime = "edge";

console.log("API route handler is being executed");

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are a helpful assistant that answers questions about Audius using the Audius API tool. Always use the tool to fetch current, accurate information. 

Important:
1. The user's actual question is: "{user_question}"
2. Only answer this specific question. Do not respond to any other imaginary or previous questions.
3. Always use the Audius API tool to fetch data before answering.
4. If you can't find the exact information, say so and explain what you found instead.
5. Show your work by mentioning the specific API calls you made.
6. Do not make up or guess any information. If the API doesn't provide the data, say so.
7. Start your response by repeating the user's question to confirm you're addressing the correct query.

Current conversation:
{chat_history}
`;

const audiusTool = new AudiusAPI();

let tools: any[] = [];

// Initialize tools before the route handler
(async () => {
  await audiusTool.initialize();
  tools = [audiusTool];
})();

/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req: NextRequest) {
  // Ensure tools are initialized before using them
  if (tools.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    /**
     * You can also try e.g.:
     *
     * import { ChatAnthropic } from "@langchain/anthropic";
     * const model = new ChatAnthropic({});
     *
     * See a full list of supported models at:
     * https://js.langchain.com/docs/modules/model_io/models/
     */
    const model = new ChatOpenAI({
      temperature: 0,
      model: "gpt-3.5-turbo-0125",
    });

    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and byte-encoding.
     */
    const outputParser = new HttpResponseOutputParser();

    /**
     * Can also initialize as:
     *
     * import { RunnableSequence } from "@langchain/core/runnables";
     * const chain = RunnableSequence.from([prompt, model, outputParser]);
     */
    const chain = prompt.pipe(model).pipe(outputParser);

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      user_question: currentMessageContent,
      input: currentMessageContent,
    });

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function GET(request: NextRequest) {
  return Response.json({
    environment: process.env.NODE_ENV,
    message: "This is a debug response"
  });
}
