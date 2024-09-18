import { AudiusAPI } from '../app/ai_sdk/tools/audiusAPI';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AudiusAPI', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(() => {
    // Create a new instance before each test
    audiusAPI = new AudiusAPI();
    
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize correctly', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['https://example.audius.co']),
    } as any);

    await expect(audiusAPI.initialize()).resolves.not.toThrow();
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch).toHaveBeenCalledWith('https://api.audius.co');
  });

  test('should search tracks successfully', async () => {
    const mockSearchResult = {
      data: [{ id: '1', title: 'Test Track' }],
      total: 1,
    };

    mockedFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(['https://example.audius.co']),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResult),
      } as any);

    await audiusAPI.initialize();
    const result = await audiusAPI.searchTracks({ query: 'electronic music' });
    expect(result).toEqual(mockSearchResult);
    expect(mockedFetch).toHaveBeenCalledTimes(2); // Once for initialize, once for search
  });

  test('should handle API errors', async () => {
    mockedFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(['https://example.audius.co']),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

    await audiusAPI.initialize();
    await expect(audiusAPI.searchTracks({ query: 'electronic music' })).rejects.toThrow('Audius API request failed: HTTP 500');
  });

  // Add more tests for other methods and scenarios...
});