import { AudiusAPI } from '../../app/ai_sdk/tools/audiusAPI';
import { retryWithBackoff } from '../../app/ai_sdk/tools/audiusUtils';
import { SearchResponse, Track } from '../../app/ai_sdk/tools/audiusTypes';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { Response } from 'node-fetch';
import { ChatPromptTemplate } from '@langchain/core/prompts';

jest.mock('../../app/ai_sdk/tools/audiusUtils');
jest.mock('@langchain/openai');
jest.mock('langchain/agents');

const mockedRetryWithBackoff = retryWithBackoff as jest.MockedFunction<typeof retryWithBackoff>;
const mockedChatOpenAI = ChatOpenAI as jest.MockedClass<typeof ChatOpenAI>;
const mockedAgentExecutor = AgentExecutor as jest.MockedClass<typeof AgentExecutor>;

describe('AudiusAPI - Langchain Integration', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(async () => {
    audiusAPI = new AudiusAPI('TestApp');
    // Mock successful initialization
    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['https://example.audius.co']),
    } as Response);
    await audiusAPI.initialize();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should integrate with Langchain agent', async () => {
    const mockTrackSearchResult: SearchResponse<Track> = {
        data: [{
          id: '1',
          title: 'Test Track',
          user: {
            id: '1',
            name: 'Test Artist',
            handle: 'testartist'
          },
          duration: 180,
          genre: 'Electronic',
          artwork: { '150x150': 'https://example.com/artwork.jpg' },
          description: 'A test electronic track',
          mood: 'Energetic',
          release_date: '2023-01-01',
          repost_count: 10,
          favorite_count: 20,
          play_count: 100,
          permalink: '/test-track',
          tags: ['electronic', 'test'],
          downloadable: true
        } as unknown as Track],
      };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTrackSearchResult),
    } as Response);

    const mockCall = jest.fn().mockResolvedValue({
      output: 'The track "Test Track" by Test Artist is an Electronic song that is 3 minutes long.'
    });

    mockedAgentExecutor.fromAgentAndTools = jest.fn().mockResolvedValue({
        call: mockCall,
      } as unknown as AgentExecutor);

    const mockLLM = new mockedChatOpenAI();
    const prompt = ChatPromptTemplate.fromMessages([
      ["human", "Find a song on Audius based on this request: {input}"]
    ]);
    const mockAgent = await createOpenAIFunctionsAgent({
      llm: mockLLM,
      tools: [audiusAPI],
      prompt: prompt
    });

    const agent = await AgentExecutor.fromAgentAndTools({
      agent: mockAgent,
      tools: [audiusAPI],
    });

    const result = await agent.call({ input: 'Find me an electronic song on Audius' });

    expect(createOpenAIFunctionsAgent).toHaveBeenCalledWith({
        llm: mockLLM,
        tools: [audiusAPI],
        prompt: prompt
      });
      expect(mockedAgentExecutor.fromAgentAndTools).toHaveBeenCalledWith({
        agent: mockAgent,
        tools: [audiusAPI],
      });
    expect(mockCall).toHaveBeenCalledWith({ input: 'Find me an electronic song on Audius' });
    expect(result.output).toContain('Test Track');
    expect(result.output).toContain('Test Artist');
    expect(result.output).toContain('Electronic');
    expect(result.output).toContain('3 minutes');
  });

  test('should handle errors in Langchain integration', async () => {
    mockedRetryWithBackoff.mockRejectedValueOnce(new Error('API error'));

    const mockCall = jest.fn().mockRejectedValue(new Error('Failed to search for tracks'));

    mockedAgentExecutor.fromAgentAndTools = jest.fn().mockResolvedValue({
        call: mockCall,
      } as unknown as AgentExecutor);

    const mockLLM = new mockedChatOpenAI();
    const prompt = ChatPromptTemplate.fromMessages([
      ["human", "Find a song on Audius based on this request: {input}"]
    ]);
    const mockAgent = await createOpenAIFunctionsAgent({
      llm: mockLLM,
      tools: [audiusAPI],
      prompt: prompt
    });

    const agent = await AgentExecutor.fromAgentAndTools({
      agent: mockAgent,
      tools: [audiusAPI],
    });

    await expect(agent.call({ input: 'Find me an electronic song on Audius' })).rejects.toThrow('Failed to search for tracks');
  });
});