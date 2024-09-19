import { AudiusAPI } from '../../app/ai_sdk/tools/audiusAPI';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

describe('AudiusAPI - Integration Tests', () => {
  let audiusAPI: AudiusAPI;
  let agent: AgentExecutor;

  beforeAll(async () => {
    audiusAPI = new AudiusAPI('TestApp');
    await audiusAPI.initialize();

    const llm = new ChatOpenAI({ temperature: 0 });
    const prompt = ChatPromptTemplate.fromMessages([
      ["human", "Find a song on Audius based on this request: {input}"]
    ]);
    const agentInstance = await createOpenAIFunctionsAgent({
      llm,
      tools: [audiusAPI],
      prompt
    });

    agent = await AgentExecutor.fromAgentAndTools({
      agent: agentInstance,
      tools: [audiusAPI],
    });
  });

  test('should search for tracks and return valid results', async () => {
    const result = await agent.call({ input: 'Find an electronic song on Audius' });
    expect(result.output).toContain('electronic');
    // Add more specific assertions based on the expected structure of the result
  });

  test('should search for users and return valid results', async () => {
    const result = await agent.call({ input: 'Find a popular artist on Audius' });
    expect(result.output).toContain('artist');
    // Add more specific assertions based on the expected structure of the result
  });

  // Add more test cases for different scenarios
});
