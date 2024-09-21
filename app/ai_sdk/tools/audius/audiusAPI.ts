import { Tool } from "langchain/tools";
import { sdk, AudiusSdk } from '@audius/sdk';

export class AudiusAPI extends Tool {
  name = "Audius API";
  description = "Search for users, tracks, and playlists on Audius";

  private audiusSdk: AudiusSdk;

  constructor(apiKey: string, apiSecret: string) {
    super();
    this.audiusSdk = sdk({
      apiKey,
      apiSecret,
    });
  }

  async _call(arg: string): Promise<string> {
    try {
      if (arg.toLowerCase().includes("user")) {
        const results = await this.audiusSdk.users.searchUsers({ query: arg });
        return JSON.stringify(results);
      } else if (arg.toLowerCase().includes("track")) {
        const results = await this.audiusSdk.tracks.searchTracks({ query: arg });
        return JSON.stringify(results);
      } else if (arg.toLowerCase().includes("playlist")) {
        const results = await this.audiusSdk.playlists.searchPlaylists({ query: arg });
        return JSON.stringify(results);
      } else {
        return "I'm sorry, I couldn't understand your query. Please try asking about users, tracks, or playlists on Audius.";
      }
    } catch (error) {
      console.error('Error in AudiusAPI._call:', error);
      return JSON.stringify({ error: "An error occurred while processing your request." });
    }
  }

  async getTrackPlayCount(trackName: string, artistName: string): Promise<number> {
    try {
      const results = await this.audiusSdk.tracks.searchTracks({ query: `${trackName} ${artistName}` });
      if (results.data && results.data.length > 0) {
        return Number(results.data[0].playCount);
      }
      throw new Error(`Track "${trackName}" by ${artistName} not found`);
    } catch (error) {
      console.error('Error in getTrackPlayCount:', error);
      throw error;
    }
  }
}