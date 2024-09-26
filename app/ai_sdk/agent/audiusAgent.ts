"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { createStreamableValue } from "ai/rsc";
import { Tool } from "@langchain/core/tools";
import { sdk } from "@audius/sdk";
import { Effect, pipe } from "effect";

// Define AudiusAPI as a LangChain Tool
// https://js.langchain.com/v0.2/docs/concepts/#tools
class AudiusAPITool extends Tool {
  name = "AudiusAPI";
  description = "Useful for querying information about tracks, artists, and playlists on the Audius platform.";
  
  private audiusSdk: ReturnType<typeof sdk>;
  
  constructor(private apiKey: string, private apiSecret: string) {
    super();
    this.audiusSdk = sdk({ apiKey, apiSecret });
  }

  async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);
      const { action, params } = parsedInput;

      switch (action) {
        case "search_tracks":
          return await this.searchTracks(params.query);
        case "get_track":
          return await this.getTrack(params.trackId);
        case "search_artists":
          return await this.searchArtists(params.query);
        case "get_artist":
          return await this.getArtist(params.artistId);
        case "search_playlists":
          return await this.searchPlaylists(params.query);
        case "get_playlist":
          return await this.getPlaylist(params.playlistId);
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      console.error('Error in AudiusAPITool:', error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async searchTracks(query: string): Promise<string> {
    const response = await this.audiusSdk.tracks.searchTracks({ query });
    return JSON.stringify(response.data?.slice(0, 5) || []);
  }

  private async getTrack(trackId: number): Promise<string> {
    const response = await this.audiusSdk.tracks.getTrack({ trackId: trackId.toString() });
    return JSON.stringify(response.data || {});
  }

  private async searchArtists(query: string): Promise<string> {
    const response = await this.audiusSdk.users.searchUsers({ query });
    return JSON.stringify(response.data?.slice(0, 5) || []);
  }

  private async getArtist(userId: number): Promise<string> {
    const response = await this.audiusSdk.users.getUser({ id: userId.toString() });
    return JSON.stringify(response.data || {});
  }

  private async searchPlaylists(query: string): Promise<string> {
    const response = await this.audiusSdk.playlists.searchPlaylists({ query });
    return JSON.stringify(response.data?.slice(0, 5) || []);
  }

  private async getPlaylist(playlistId: number): Promise<string> {
    const response = await this.audiusSdk.playlists.getPlaylist({ playlistId: playlistId.toString() });
    return JSON.stringify(response.data || {});
  }
}

// Define a custom error type
class AudiusAgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudiusAgentError";
  }
}

export function runAudiusAgent(input: string) {
  return Effect.gen(function* (_) {
    const stream = createStreamableValue();

    const apiKey = yield* _(Effect.try(() => {
      if (!process.env.AUDIUS_API_KEY) {
        throw new AudiusAgentError("AUDIUS_API_KEY is not set");
      }
      return process.env.AUDIUS_API_KEY;
    }));

    const apiSecret = yield* _(Effect.try(() => {
      if (!process.env.AUDIUS_API_SECRET) {
        throw new AudiusAgentError("AUDIUS_API_SECRET is not set");
      }
      return process.env.AUDIUS_API_SECRET;
    }));

    const audiusAPI = new AudiusAPITool(apiKey, apiSecret);

    const llm = new ChatOpenAI({
      model: "gpt-4-0613",
      temperature: 0,
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
      You are an assistant specialized in the Audius music platform.
      Use the Audius API to answer questions about tracks, artists, and playlists.
      Always use the appropriate API call for the user's request.
      
      Available actions:
      - search_tracks: Search for tracks by name
      - get_track: Get details of a specific track
      - search_artists: Search for artists by name
      - get_artist: Get details of a specific artist
      - search_playlists: Search for playlists by name
      - get_playlist: Get details of a specific playlist
      
      When searching, return up to 5 results.
      When getting details, return all available information.
      
      Human: {input}
      Assistant: Certainly! I'll use the Audius API to help you with that request.
    `);

    const agent = createToolCallingAgent({
      llm,
      tools: [audiusAPI],
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools: [audiusAPI],
    });

    yield* _(Effect.tryPromise(async () => {
      const streamingEvents = await agentExecutor.streamEvents({ input }, { version: "v2" });
      for await (const event of streamingEvents) {
        stream.update(JSON.parse(JSON.stringify(event, null, 2)));
      }
      stream.done();
    }));

    return stream;
  }).pipe(
    Effect.catchAll((error) => {
      console.error('Error in runAudiusAgent:', error);
      const stream = createStreamableValue();
      stream.update({ error: error instanceof AudiusAgentError ? error.message : 'An error occurred while processing your request.' });
      stream.done();
      return Effect.succeed(stream);
    })
  );
}

// Usage
export async function handleAudiusAgent(input: string) {
  const result = await Effect.runPromise(runAudiusAgent(input));
  return result;
}