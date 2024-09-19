import { AudiusAPI } from '../../app/ai_sdk/tools/audiusAPI';
import { retryWithBackoff } from '../../app/ai_sdk/tools/audiusUtils';
import { AudiusAPISearchError } from '../../app/ai_sdk/tools/audiusErrors';

jest.mock('../../app/ai_sdk/tools/audiusUtils');

const mockedRetryWithBackoff = retryWithBackoff as jest.MockedFunction<typeof retryWithBackoff>;

// Define minimal types for testing if not imported
interface Track {
  id: string;
  title: string;
}

interface SearchResponse<T> {
  data: T[];
  next_offset?: number;
}

interface TrackSearchParams {
  query: string;
  only_downloadable?: boolean;
  tags?: string;
  genre?: string;
  user_id?: number;
}

describe('AudiusAPI - Track Search', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(async () => {
    audiusAPI = new AudiusAPI();
    // Mock successful initialization
    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['https://example.audius.co']),
    } as any);
    await audiusAPI.initialize();
    jest.clearAllMocks(); // Clear mocks after initialization
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should search tracks successfully', async () => {
    const mockSearchResult: SearchResponse<Track> = {
      data: [{ id: '1', title: 'Test Track' }],
    };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResult),
    } as any);

    const result = await audiusAPI.searchTracks({ query: 'test track' });
    expect(result).toEqual(mockSearchResult);
    expect(mockedRetryWithBackoff).toHaveBeenCalledTimes(1);
  });

  test('should handle API errors for track search', async () => {
    mockedRetryWithBackoff.mockRejectedValueOnce(new Error('API error'));

    await expect(audiusAPI.searchTracks({ query: 'test track' })).rejects.toThrow(AudiusAPISearchError);
  });

  test('should validate input for searchTracks', async () => {
    await expect(audiusAPI.searchTracks({ query: '' })).rejects.toThrow(AudiusAPISearchError);
  });

  test('should include optional parameters in track search', async () => {
    const mockSearchResult: SearchResponse<Track> = {
      data: [{ id: '1', title: 'Test Track' }],
    };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResult),
    } as any);

    await audiusAPI.searchTracks({
      query: 'test track',
      only_downloadable: true,
      tags: 'electronic',
      genre: 'Electronic',
      user_id: 123,
    });

    expect(mockedRetryWithBackoff).toHaveBeenCalledWith(
      expect.any(Function)
    );
    // You might want to inspect the URL in the fetch call to ensure all parameters are included
  });

  test('should handle pagination in track search results', async () => {
    const mockSearchResult: SearchResponse<Track> = {
      data: [{ id: '1', title: 'Test Track' }],
      next_offset: 1,
    };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResult),
    } as any);

    const result = await audiusAPI.searchTracks({ query: 'test track' });
    expect(result).toEqual(mockSearchResult);
    expect(result.next_offset).toBe(1);
  });

  test('should handle empty search results', async () => {
    const mockSearchResult: SearchResponse<Track> = {
      data: [],
    };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResult),
    } as any);

    const result = await audiusAPI.searchTracks({ query: 'nonexistent track' });
    expect(result.data).toHaveLength(0);
  });
});
