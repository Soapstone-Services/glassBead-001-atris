import { retryWithBackoff } from './audiusUtils';
import fetch from 'node-fetch';
import { Tool } from "langchain/tools";
import { z } from 'zod';
import { TrackSearchParameters, Track, SearchResponse, User, Playlist } from './audiusTypes';
import { AudiusAPIError, AudiusAPIInitializationError, AudiusAPISearchError } from './audiusErrors';

const logger = {
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error),
  info: (message: string) => console.log(`[INFO] ${message}`),
};

const TrackSearchParamsSchema = z.object({
  query: z.string().min(1),
  only_downloadable: z.boolean().optional(),
  tags: z.string().optional(),
  genre: z.string().optional(),
  user_id: z.number().int().positive().optional(),
});

type ValidatedTrackSearchParams = z.infer<typeof TrackSearchParamsSchema>;

/**
 * AudiusAPI class for interacting with the Audius API.
 * This class extends the Langchain Tool for integration with Langchain workflows.
 */
export class AudiusAPI extends Tool {
  name = "AudiusAPI";
  description = "Search for tracks, users, and playlists on Audius";
  private host: string | null = null;
  private appName: string;
  private readonly DISCOVERY_PROVIDER = 'https://api.audius.co';

  /**
   * Creates an instance of AudiusAPI.
   * @param {string} [appName] - The name of the app using this API. If not provided, falls back to environment variable or default value.
   */
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
      const response = await retryWithBackoff(() => fetch(this.DISCOVERY_PROVIDER), 3, 1000);
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
    const host = await this.getHost();
    const url = new URL(`${host}/v1/tracks/search`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    try {
      const response = await retryWithBackoff(() => fetch(url.toString()));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('Error searching tracks:', error);
      throw new AudiusAPISearchError('Failed to search tracks');
    }
  }

  /**
   * Searches for users on Audius.
   * @param {Omit<ValidatedTrackSearchParams, 'only_downloadable'>} params - The search parameters.
   * @returns {Promise<SearchResponse<User>>} The search results.
   */
  async searchUsers(params: Omit<ValidatedTrackSearchParams, 'only_downloadable'>): Promise<SearchResponse<User>> {
    return this.search('users', params);
  }

  /**
   * Searches for playlists on Audius.
   * @param {Omit<ValidatedTrackSearchParams, 'only_downloadable'>} params - The search parameters.
   * @returns {Promise<SearchResponse<Playlist>>} The search results.
   */
  async searchPlaylists(params: Omit<ValidatedTrackSearchParams, 'only_downloadable'>): Promise<SearchResponse<Playlist>> {
    return this.search('playlists', params);
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