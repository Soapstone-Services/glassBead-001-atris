import { AudiusAPIBase } from "./base/AudiusAPIBase";
import { AudiusTracksAPI } from "./tracks/AudiusTracksAPI";
import { AudiusUsersAPI } from "./users/AudiusUsersAPI";
import { AudiusPlaylistsAPI } from "./playlists/AudiusPlaylistsAPI";
import { sdk, Track, User, Playlist, GetTrendingTracksRequest } from '@audius/sdk';
import { Effect } from 'effect';

let audiusSdk: any;

if (typeof window === 'undefined') {
  const { sdk } = require('@audius/sdk');
  audiusSdk = sdk;
}

// AudiusAPI class extends AudiusAPIBase to implement Audius-specific functionality
export class AudiusAPI extends AudiusAPIBase {
  name = "Audius API";
  description = "Search for users, tracks, and playlists on Audius";

  // Private instances for specific API functionalities
  private tracksAPI: AudiusTracksAPI;
  private usersAPI: AudiusUsersAPI;
  private playlistsAPI: AudiusPlaylistsAPI;

  constructor(apiKey: string, apiSecret: string) {
    console.log('Initializing AudiusAPI with:', { apiKey: apiKey ? 'Set' : 'Not set', apiSecret: apiSecret ? 'Set' : 'Not set' });
    super(apiKey, apiSecret);
    // Initialize the Audius SDK with provided credentials
    this.audiusSdk = sdk({
      apiKey,
      apiSecret,
    });
    console.log('Audius SDK initialized');
    // Initialize specific API instances
    this.tracksAPI = new AudiusTracksAPI(apiKey, apiSecret);
    this.usersAPI = new AudiusUsersAPI(apiKey, apiSecret);
    this.playlistsAPI = new AudiusPlaylistsAPI(apiKey, apiSecret);
    console.log('API instances initialized');
  }

  /**
   * Routes the query to the appropriate API based on the content.
   * @param {string} arg - The query string to process.
   * @returns {Promise<string>} A promise that resolves to the API response.
   * @throws {Error} If an error occurs during API call.
   */
  async _call(arg: string): Promise<string> {
    try {
      if (arg.toLowerCase().includes("user")) {
        return await this.usersAPI._call(arg);
      } else if (arg.toLowerCase().includes("track")) {
        return await this.tracksAPI._call(arg);
      } else if (arg.toLowerCase().includes("playlist")) {
        return await this.playlistsAPI._call(arg);
      } else {
        throw new Error("Invalid query type. Please ask about users, tracks, or playlists on Audius.");
      }
    } catch (error) {
      console.error('Error in AudiusAPI._call:', error);
      if (error instanceof Error) {
        return JSON.stringify({ error: error.message });
      }
      return JSON.stringify({ error: "An unknown error occurred while processing your request." });
    }
  }

  // Method to search for tracks using the Audius SDK
  // Returns an Effect that represents the asynchronous operation
  searchTracks(query: string, options?: { limit?: number }): Effect.Effect<Track[], Error> {
    // Use Effect.tryPromise to handle the asynchronous SDK call
    return Effect.tryPromise(() => 
      this.audiusSdk.tracks.searchTracks({ 
        query
      })
    ).pipe(
      // Map the result to extract the data or return an empty array if undefined
      Effect.map(result => result.data || []),
      // Map any errors to a new Error with a descriptive message
      Effect.mapError(error => new Error(`Error searching tracks: ${error}`))
    );
  }

  // Method to search for users
  searchUsers(query: string, options?: { limit?: number }): Effect.Effect<User[], Error> {
    return Effect.tryPromise(() => 
      this.audiusSdk.users.searchUsers({ 
        query
      })
    ).pipe(
      Effect.map(result => result.data || []),
      Effect.mapError(error => new Error(`Error searching users: ${error}`))
    );
  }

  // Method to search for playlists
  searchPlaylists(query: string, options?: { limit?: number }): Effect.Effect<Playlist[], Error> {
    return Effect.tryPromise(() => 
      this.audiusSdk.playlists.searchPlaylists({ 
        query
      })
    ).pipe(
      Effect.map(result => result.data || []),
      Effect.mapError(error => new Error(`Error searching playlists: ${error}`))
    );
  }
  
  // Method to get track attributes
  getTrackAttribute(trackName: string, artistName: string, attribute: keyof Track): Effect.Effect<unknown, Error> {
    return Effect.flatMap(
      this.searchTracks(`${trackName} ${artistName}`, { limit: 1 }),
      tracks => {
        const track = tracks[0];
        if (track && attribute in track) {
          return Effect.succeed(track[attribute]);
        }
        return Effect.fail(new Error(`Track "${trackName}" by ${artistName}" not found or ${attribute} unavailable`));
      }
    );
  }


  // Method to get user attributes
  getUserAttribute(userName: string, attribute: keyof User): Effect.Effect<unknown, Error> {
    return Effect.flatMap(
      this.searchUsers(userName, { limit: 1 }),
      users => {
        const user = users[0];
        if (user && attribute in user) {
          return Effect.succeed(user[attribute]);
        }
        return Effect.fail(new Error(`User "${userName}" not found or ${attribute} unavailable`));
      }
    );
  }

  // Method to get playlist attributes
  getPlaylistAttribute(playlistName: string, attribute: keyof Playlist): Effect.Effect<unknown, Error> {
    return Effect.flatMap(
      this.searchPlaylists(playlistName, { limit: 1 }),
      playlists => {
        const playlist = playlists[0];
        if (playlist && attribute in playlist) {
          return Effect.succeed(playlist[attribute]);
        }
        return Effect.fail(new Error(`Playlist "${playlistName}" not found or ${attribute} unavailable`));
      }
    );
  }

  // Method to get track details
  getTrack(trackId: string): Effect.Effect<Track, Error> {
    return Effect.tryPromise(() => 
      this.audiusSdk.tracks.getTrack({
        trackId
      })
    ).pipe(
      Effect.map(result => {
        if (!result.data) {
          throw new Error(`Track with ID ${trackId} not found`);
        }
        return result.data;
      }),
      Effect.mapError(error => new Error(`Error fetching track details: ${error}`))
    );
  }

  // Method to get track information
  getTrackInfo(trackId: string): Effect.Effect<Track, Error> {
    return Effect.tryPromise(() => 
      this.audiusSdk.tracks.getTrack({
        trackId
      })
    ).pipe(
      Effect.map(result => {
        if (!result.data) {
          throw new Error(`Track with ID ${trackId} not found`);
        }
        return result.data;
      }),
      Effect.mapError(error => new Error(`Error fetching track info: ${error}`))
    );
  }

  // Add this new method to get trending tracks
  getTrendingTracks(options?: { time?: GetTrendingTracksRequest['time']; genre?: string; }): Effect.Effect<Track[], Error> {
    return Effect.tryPromise(() => 
      this.audiusSdk.tracks.getTrendingTracks({
        time: options?.time || 'week',
        genre: options?.genre
      })
    ).pipe(
      Effect.map(result => result.data || []),
      Effect.mapError(error => new Error(`Error fetching trending tracks: ${error}`))
    );
  }
}