import { AudiusAPI } from '../app/ai_sdk/tools/audiusAPI';
import { retryWithBackoff } from '../app/ai_sdk/tools/audiusUtils';
import fetch from 'node-fetch';
import { AudiusAPIInitializationError, AudiusAPISearchError } from '../app/ai_sdk/tools/audiusErrors';

// Mock node-fetch and retryWithBackoff
jest.mock('node-fetch');
jest.mock('../app/ai_sdk/tools/audiusUtils');

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockedRetryWithBackoff = retryWithBackoff as jest.MockedFunction<typeof retryWithBackoff>;

describe('AudiusAPI', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(() => {
    audiusAPI = new AudiusAPI();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize correctly', async () => {
    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['https://example.audius.co']),
    } as any);

    await expect(audiusAPI.initialize()).resolves.not.toThrow();
    expect(mockedRetryWithBackoff).toHaveBeenCalledTimes(1);
    expect(mockedRetryWithBackoff).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should search tracks successfully', async () => {
    const mockSearchResult = {
      data: [{ id: '1', title: 'Test Track' }],
      total: 1,
    };

    mockedRetryWithBackoff
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
    expect(mockedRetryWithBackoff).toHaveBeenCalledTimes(2); // Once for initialize, once for search
  });

  test('should handle API errors', async () => {
    mockedRetryWithBackoff
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(['https://example.audius.co']),
      } as any)
      .mockRejectedValueOnce(new Error('API error'));

    await audiusAPI.initialize();
    await expect(audiusAPI.searchTracks({ query: 'electronic music' })).rejects.toThrow(AudiusAPISearchError);
  });

  test('should handle initialization errors', async () => {
    mockedRetryWithBackoff.mockRejectedValueOnce(new Error('Initialization error'));

    await expect(audiusAPI.initialize()).rejects.toThrow(AudiusAPIInitializationError);
  });

  test('should validate input for searchTracks', async () => {
    await audiusAPI.initialize(); // Ensure initialized
    await expect(audiusAPI.searchTracks({ query: '' })).rejects.toThrow(AudiusAPISearchError);
  });

  // Add tests for searchUsers and searchPlaylists
  // ...

  test('should implement _call method for Langchain', async () => {
    const mockSearchResult = {
      data: [{ id: '1', title: 'Test Track' }],
      total: 1,
    };

    mockedRetryWithBackoff
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(['https://example.audius.co']),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResult),
      } as any);

    await audiusAPI.initialize();
    const result = await audiusAPI._call('test query');
    expect(JSON.parse(result)).toEqual(mockSearchResult);
  });
});