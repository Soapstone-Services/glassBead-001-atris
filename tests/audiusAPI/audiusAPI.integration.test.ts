// Import and configure dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import necessary modules and classes
import { AudiusAPI } from '../../app/ai_sdk/tools/audiusAPI';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Utility function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Describe the test suite for AudiusAPI integration tests
describe('AudiusAPI - Integration Tests', () => {
  let audiusAPI: AudiusAPI;
  let agent: AgentExecutor;

  // Set up the test environment before running any tests
  beforeAll(async () => {
    console.log('Starting AudiusAPI initialization');
    // Initialize the AudiusAPI with a test app name
    audiusAPI = new AudiusAPI('TestApp');
    try {
      // Initialize the API
      await audiusAPI.initialize();
      console.log('AudiusAPI initialized successfully');
    } catch (error) {
      console.error('Error during AudiusAPI initialization:', error);
      throw error;
    }
  
    console.log('Creating LangChain agent');
    // Create a ChatOpenAI instance with OpenAI API key
    const llm = new ChatOpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY });
    // Define the chat prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "You are an AI assistant that helps find songs and artists on Audius."],
      ["human", "{input}"],
      ["human", "Agent scratchpad: {agent_scratchpad}"]
    ]);
    // Create an OpenAI functions agent
    const agentInstance = await createOpenAIFunctionsAgent({
      llm,
      tools: [audiusAPI],
      prompt
    });

    // Create an AgentExecutor from the agent instance
    agent = AgentExecutor.fromAgentAndTools({
      agent: agentInstance,
      tools: [audiusAPI],
      maxIterations: 3,
      verbose: true
    });
    console.log('LangChain agent created successfully');
  });

  // Test case for searching tracks
  test('should search for tracks and return valid results', async () => {
    // Invoke the agent with a query to find an electronic song
    const result = await agent.invoke({ input: 'Find an electronic song on Audius' });
    console.log('Track search result:', JSON.stringify(result, null, 2));
    // Assert that the output is truthy and a string
    expect(result.output).toBeTruthy();
    expect(typeof result.output).toBe('string');
  }, 60000); // Set timeout to 60 seconds
  
  // Test case for searching users/artists
  test('should search for users and return valid results', async () => {
    // Invoke the agent with a query to find a popular artist
    const result = await agent.invoke({ input: 'Find a popular artist on Audius' });
    console.log('Artist search result:', JSON.stringify(result, null, 2));
    // Assert that the output is truthy and a string
    expect(result.output).toBeTruthy();
    expect(typeof result.output).toBe('string');
  }, 60000); // Set timeout to 60 seconds

  // Placeholder for additional test cases
});