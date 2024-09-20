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
      logger.info(`Initializing AudiusAPI with discovery provider: ${AudiusAPI.DISCOVERY_PROVIDER}`);
      const response = await retryWithBackoff(() => fetch(AudiusAPI.DISCOVERY_PROVIDER), 3, 1000);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      logger.info(`Received response from discovery provider: ${JSON.stringify(data)}`);
      if (typeof data === 'object' && Array.isArray(data.data)) {
        this.host = data.data[0];
      } else if (Array.isArray(data)) {
        this.host = data[0];
      } else {
        throw new Error(`Invalid API response format: ${JSON.stringify(data)}`);
      }
      logger.info(`AudiusAPI initialized with host: ${this.host}`);
    } catch (error) {
      logger.error('Error initializing AudiusAPI:', error);
      if (error instanceof Error) {
        throw new AudiusAPIInitializationError(`AudiusAPI initialization failed: ${error.message}`);
      } else {
        throw new AudiusAPIInitializationError('AudiusAPI initialization failed: Unknown error');
      }
    }
  }

  /**
   * Gets the API host, initializing if necessary.
   * @returns {Promise<string>} The API host URL.
   */
  private async getHost(): Promise<string> {
    if (!this.host || !this.validateHost(this.host)) {
      await this.initialize();
    }
    if (!this.host || !this.validateHost(this.host)) {
      throw new AudiusAPIInitializationError('Failed to obtain a valid host');
    }
    return this.host;
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
      logger.info(`Sending request to Audius API: ${url.toString()}`);
      const response = await retryWithBackoff(() => fetch(url.toString()));
      if (!response.ok) {
        throw new AudiusAPISearchError(`Audius API request failed: HTTP ${response.status}`);
      }
      const data = await response.json();
      logger.info(`Received response from Audius API for ${endpoint} search`);
      return data;
    } catch (error) {
      logger.error(`Error in AudiusAPI ${endpoint} search:`, error);
      if (error instanceof AudiusAPISearchError) {
        throw error;
      }
      throw new AudiusAPISearchError(`Failed to search Audius ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Implements the _call method required by Langchain's Tool class.
   * This method is called when the tool is used in a Langchain chain.
   * @param {string} arg - The search query.
   * @returns {Promise<string>} The search results as a JSON string.
   */
  async _call(arg: string): Promise<string> {
    try {
      console.log(`AudiusAPI _call received argument: ${arg}`);
      
      // Extract the track name and artist name from the query
      const match = arg.match(/How many plays does (.*?) by (.*?) have on Audius\??$/i);
      let trackName = match ? match[1]?.trim() : '';
      let artistName = match ? match[2]?.trim() : '';
  
      if (!trackName && !artistName) {
        const fallbackMatch = arg.match(/(.*?) by (.*)/i);
        trackName = fallbackMatch ? fallbackMatch[1]?.trim() : arg.trim();
        artistName = fallbackMatch ? fallbackMatch[2]?.trim() : '';
      }
  
      // Remove any trailing period from the artist name
      artistName = artistName.replace(/\.$/, '');
  
      console.log(`AudiusAPI _call: Parsed track name "${trackName}" and artist name "${artistName}"`);
  
      if (!trackName) {
        return `I'm sorry, but I couldn't extract a valid track name from the query. Please provide a track name.`;
      }
  
      const params = TrackSearchParamsSchema.parse({ query: `${trackName} ${artistName}`.trim() });
      console.log(`AudiusAPI _call: Searching with params ${JSON.stringify(params)}`);
      
      const result = await this.searchTracks(params);
      console.log(`AudiusAPI _call: Search result ${JSON.stringify(result)}`);
  
      if (!result.data || result.data.length === 0) {
        return `I couldn't find any tracks matching "${trackName}"${artistName ? ` by ${artistName}` : ''} on Audius.`;
      }
  
      const normalizeString = (str: string) => str ? str.toLowerCase().replace(/[^\w\s]/g, '').trim() : '';
      const trackNameNormalized = normalizeString(trackName);
      const artistNameNormalized = normalizeString(artistName);
  
      const track = result.data.find(t => {
        const titleNormalized = normalizeString(t.title);
        const artistNormalized = normalizeString(t.user.name);
        return titleNormalized.includes(trackNameNormalized) && 
               (artistNameNormalized === '' || artistNormalized.includes(artistNameNormalized));
      });
  
      if (!track) {
        console.log(`AudiusAPI _call: Exact track match not found`);
        const closestMatch = result.data[0];
        return `I couldn't find an exact match for "${trackName}"${artistName ? ` by ${artistName}` : ''} on Audius. However, the closest match I found is "${closestMatch.title}" by ${closestMatch.user.name}, which has ${closestMatch.play_count} plays.`;
      }
  
      console.log(`AudiusAPI _call: Found track ${JSON.stringify(track)}`);
      return `The track "${track.title}" by ${track.user.name} has ${track.play_count} plays on Audius.`;
    } catch (error) {
      console.error('Error in AudiusAPI _call:', error);
      return `An error occurred while searching for the track: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private validateHost(host: string): boolean {
    try {
      new URL(host);
      return true;
    } catch {
      return false;
    }
  }
}