import { 
  TrackSearchParamsSchema, 
  UserSearchParamsSchema, 
  PlaylistSearchParamsSchema,
  TrackSearchParameters,
  UserSearchParameters,
  PlaylistSearchParameters
} from './audiusSchemas';
import { retryWithBackoff } from './audiusUtils';
import fetch from 'node-fetch';
import { Tool } from "langchain/tools";
import { z } from 'zod';
import { Track, SearchResponse, User, Playlist } from './audiusTypes';
import { AudiusAPIError, AudiusAPIInitializationError, AudiusAPISearchError } from './audiusErrors';

const logger = {
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error),
  info: (message: string) => console.log(`[INFO] ${message}`),
};

export class AudiusAPI extends Tool {
  name = "AudiusAPI";
  description = "Search for tracks, users, and playlists on Audius";
  private host: string | null = null;
  private appName: string;

  private static readonly DISCOVERY_PROVIDER = 'https://api.audius.co';

  constructor(appName?: string) {
    super();
    this.appName = appName || process.env.AUDIUS_APP_NAME || 'AudiusAPITool';
  }

  /**
   * Initializes the API by fetching and storing the host URL.
   * @throws {AudiusAPIInitializationError} If initialization fails.
   */
  async initialize() {
    try {
      const response = await retryWithBackoff(() => fetch(AudiusAPI.DISCOVERY_PROVIDER), 3, 1000);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid API response format');
      }
      this.host = data[0];
      logger.info(`AudiusAPI initialized with host: ${this.host}`);
    } catch (error) {
      logger.error('Error initializing AudiusAPI:', error);
      throw new AudiusAPIInitializationError('AudiusAPI initialization failed');
    }
  }

  /**
   * Gets the API host, initializing if necessary.
   * @returns {Promise<string>} The API host URL.
   */
  private async getHost(): Promise<string> {
    if (!this.host) {
      await this.initialize();
    }
    return this.host!;
  }

  /**
   * Searches for tracks on Audius.
   * @param {TrackSearchParameters} params - The search parameters.
   * @returns {Promise<SearchResponse<Track>>} The search results.
   * @throws {AudiusAPISearchError} If the search fails.
   */
  async searchTracks(params: TrackSearchParameters): Promise<SearchResponse<Track>> {
    try {
      const validatedParams = TrackSearchParamsSchema.parse(params);
      return this.search('tracks', validatedParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AudiusAPISearchError(`Invalid input for track search: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Searches for users on Audius.
   * @param {Omit<ValidatedTrackSearchParams, 'only_downloadable'>} params - The search parameters.
   * @returns {Promise<SearchResponse<User>>} The search results.
   */
  async searchUsers(params: UserSearchParameters): Promise<SearchResponse<User>> {
    try {
      const validatedParams = UserSearchParamsSchema.parse(params);
      return this.search('users', validatedParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AudiusAPISearchError(`Invalid input for user search: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Searches for playlists on Audius.
   * @param {Omit<ValidatedTrackSearchParams, 'only_downloadable'>} params - The search parameters.
   * @returns {Promise<SearchResponse<Playlist>>} The search results.
   */
  async searchPlaylists(params: PlaylistSearchParameters): Promise<SearchResponse<Playlist>> {
    try {
      const validatedParams = PlaylistSearchParamsSchema.parse(params);
      return this.search('playlists', validatedParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AudiusAPISearchError(`Invalid input for playlist search: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generic search method used by searchUsers and searchPlaylists.
   * @param {string} endpoint - The API endpoint to search ('users' or 'playlists').
   * @param {Record<string, any>} params - The search parameters.
   * @returns {Promise<SearchResponse<T>>} The search results.
   * @throws {AudiusAPISearchError} If the search fails.
   */
  private async search<T>(endpoint: string, params: Record<string, any>): Promise<SearchResponse<T>> {
    const host = await this.getHost();
    const url = new URL(`${host}/v1/${endpoint}/search`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    url.searchParams.append('app_name', this.appName);

    try {
      const response = await retryWithBackoff(() => fetch(url.toString()));
      if (!response.ok) {
        throw new AudiusAPISearchError(`Audius API request failed: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      logger.error(`Error in AudiusAPI ${endpoint} search:`, error);
      throw new AudiusAPISearchError(`Failed to search Audius ${endpoint}`);
    }
  }

  /**
   * Implements the _call method required by Langchain's Tool class.
   * This method is called when the tool is used in a Langchain chain.
   * @param {string} arg - The search query.
   * @returns {Promise<string>} The search results as a JSON string.
   */
  async _call(arg: string): Promise<string> {
    const params = TrackSearchParamsSchema.parse({ query: arg });
    const result = await this.searchTracks(params);
    return JSON.stringify(result);
  }
}