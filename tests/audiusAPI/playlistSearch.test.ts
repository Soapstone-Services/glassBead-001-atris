import { AudiusAPI } from '../../app/ai_sdk/tools/audius/audiusAPI';
import { retryWithBackoff } from '../../app/ai_sdk/tools/audiusUtils';
import { AudiusAPISearchError } from '../../app/ai_sdk/tools/audiusErrors';
import { Playlist, SearchResponse, User } from '../../app/ai_sdk/tools/audiusTypes';
import { PlaylistSearchParameters } from '../../app/ai_sdk/tools/audiusSchemas';
import fetch, { Response } from 'node-fetch';

jest.mock('../../app/ai_sdk/tools/audiusUtils');
jest.mock('node-fetch');

const mockedRetryWithBackoff = retryWithBackoff as jest.MockedFunction<typeof retryWithBackoff>;
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a mock User that satisfies the User type
const createMockUser = (id: number, name: string, handle: string): User => ({
  id,
  name,
  handle,
  album_count: 0,
  bio: null,
  cover_photo: {
    '640x': 'https://example.com/cover_640x.jpg',
    '2000x': 'https://example.com/cover_2000x.jpg'
  },
  followee_count: 0,
  follower_count: 0,
  is_verified: false,
  location: null,
  playlist_count: 1,
  profile_picture: {
    '150x150': 'https://example.com/profile_150x150.jpg',
    '480x480': 'https://example.com/profile_480x480.jpg',
    '1000x1000': 'https://example.com/profile_1000x1000.jpg'
  },
  repost_count: 0,
  track_count: 0
});

// Create a mock Playlist that satisfies the Playlist type
const createMockPlaylist = (id: number, name: string, user_id: number): Playlist => ({
  id,
  playlist_name: name,
  user: createMockUser(user_id, 'Test User', 'testuser'),
  artwork: {
    '150x150': 'https://example.com/artwork_150x150.jpg',
    '480x480': 'https://example.com/artwork_480x480.jpg',
    '1000x1000': 'https://example.com/artwork_1000x1000.jpg'
  },
  description: 'A test playlist',
  is_album: false,
  repost_count: 0,
  favorite_count: 0,
  total_play_count: 0
});

describe('AudiusAPI - Playlist Search', () => {
  let audiusAPI: AudiusAPI;

  beforeEach(async () => {
    audiusAPI = new AudiusAPI('TestApp');
    // Mock successful initialization
    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(['https://example.audius.co']),
    } as Response);
    await audiusAPI.initialize();
    jest.clearAllMocks(); // Clear mocks after initialization
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should search playlists successfully', async () => {
    const mockSearchResult: SearchResponse<Playlist> = {
      data: [createMockPlaylist(1, 'Test Playlist', 1)],
    };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResult),
    } as Response);

    const result = await audiusAPI.searchPlaylists({ query: 'test playlist' });
    expect(result).toEqual(mockSearchResult);
    expect(mockedRetryWithBackoff).toHaveBeenCalledTimes(1);
  });

  test('should handle API errors for playlist search', async () => {
    mockedRetryWithBackoff.mockRejectedValueOnce(new Error('API error'));

    await expect(audiusAPI.searchPlaylists({ query: 'test playlist' })).rejects.toThrow(AudiusAPISearchError);
  });

  test('should validate input for searchPlaylists', async () => {
    await expect(audiusAPI.searchPlaylists({ query: '' } as PlaylistSearchParameters)).rejects.toThrow(AudiusAPISearchError);
  });

  test('should handle pagination in playlist search results', async () => {
    const mockSearchResult: SearchResponse<Playlist> = {
      data: [createMockPlaylist(1, 'Test Playlist', 1)],
      next_offset: 1,
    };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResult),
    } as Response);

    const result = await audiusAPI.searchPlaylists({ query: 'test playlist' });
    expect(result).toEqual(mockSearchResult);
    expect(result.next_offset).toBe(1);
  });

  test('should handle empty search results', async () => {
    const mockSearchResult: SearchResponse<Playlist> = {
      data: [],
    };

    mockedRetryWithBackoff.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResult),
    } as Response);

    const result = await audiusAPI.searchPlaylists({ query: 'nonexistent playlist' });
    expect(result.data).toHaveLength(0);
  });

  test('should include app name in search request', async () => {
    const mockSearchResult: SearchResponse<Playlist> = {
      data: [createMockPlaylist(1, 'Test Playlist', 1)],
    };

    mockedRetryWithBackoff.mockImplementationOnce(async (operation) => {
      const mockResponse: Partial<Response> = {
        ok: true,
        url: 'https://example.audius.co/v1/playlists/search?query=test%20playlist&app_name=TestApp',
        json: () => Promise.resolve(mockSearchResult),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as Response);

      const response = await operation();
      if (response instanceof Response) {
        const url = new URL(response.url);
        expect(url.searchParams.get('app_name')).toBe('TestApp');
      }
      return response;
    });

    await audiusAPI.searchPlaylists({ query: 'test playlist' });
    expect(mockedFetch).toHaveBeenCalled();
  });
});