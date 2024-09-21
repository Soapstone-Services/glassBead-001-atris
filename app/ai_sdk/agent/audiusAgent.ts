"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { createStreamableValue } from "ai/rsc";
import { AudiusAPI } from '../tools/audius/audiusAPI';

export async function runAudiusAgent(input: string) {
    const stream = createStreamableValue();

    const apiKey = process.env.AUDIUS_API_KEY;
    const apiSecret = process.env.AUDIUS_API_SECRET;
  
    (async () => {
      try {
        const audiusAPI = new AudiusAPI(apiKey!, apiSecret!);
  
        const result = await audiusAPI._call(input);
        stream.update({ output: result });
        stream.done();
      } catch (error) {
        console.error('Error in runAudiusAgent:', error);
        stream.update({ error: 'An error occurred while processing your request.' });
        stream.done();
      }
    })();
  
    return stream;
  }