import { AudiusAPI } from '../../app/ai_sdk/tools/audius/audiusAPI';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor } from 'langchain/agents';
import { createOpenAIFunctionsAgent } from 'langchain/agents';
import { SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';

describe('AudiusAPI - Langchain Integration', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(() => {
    audiusAPI = new AudiusAPI();
  });

  test('should work with LangChain agents', async () => {
    const model = new ChatOpenAI({ temperature: 0 });
    const tools = [audiusAPI];

    const prompt = new SystemMessage<ChatPromptTemplate>(
      "You are an AI assistant that helps users interact with the Audius music platform. " +
      "Answer the human's question as best you can using the tools available to you."
    );

    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt,
    });

    const executor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });

    const result = await executor.invoke({
      input: "Find a user named 'John' on Audius"
    });

    expect(result.output).toContain('John');
  }, 30000);
});