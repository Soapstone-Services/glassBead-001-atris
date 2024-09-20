"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { createStreamableValue } from "ai/rsc";
import { AudiusAPI } from '../tools/audiusAPI';

export async function runAudiusAgent(input: string) {
    const stream = createStreamableValue();
  
    (async () => {
      try {
        const audiusAPI = new AudiusAPI('AudiusAgent');
        await audiusAPI.initialize();
  
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