import * as dotenv from 'dotenv';
import * as path from 'path';
import { Effect, Console } from "effect";
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { AudiusAPI } from "../app/ai_sdk/tools/audius/audiusAPI";
import type { Track, User, Playlist } from "../app/ai_sdk/tools/audiusTypes";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or key is missing in environment variables');
}

const createSupabaseClient = Effect.try({
  try: () => createClient(supabaseUrl, supabaseKey),
  catch: (error) => new Error(`Failed to create Supabase client: ${error instanceof Error ? error.message : String(error)}`)
});

const logSupabaseError = (error: unknown) => Effect.gen(function* (_) {
  if (error instanceof Error) {
    yield* _(Console.error('Error creating Supabase client:', error.message));
  } else {
    yield* _(Console.error('Unknown error creating Supabase client:', String(error)));
  }
  yield* _(Console.error('SUPABASE_URL:', supabaseUrl));
  yield* _(Console.error('SUPABASE_PRIVATE_KEY:', supabaseKey ? '[REDACTED]' : 'undefined'));
});

const createClientWithErrorHandling = createSupabaseClient
  .pipe(
    Effect.catchAll((error) => 
      Effect.gen(function* (_) {
        yield* _(logSupabaseError(error));
        return yield* _(Effect.fail(error));
      })
    ),
    Effect.orDie
  );

const ingestAudiusData = Effect.gen(function* (_) {
  const client = yield* _(createClientWithErrorHandling);
  
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: "audius_documents",
    queryName: "match_audius_documents",
  });

  const audiusApiKey = process.env.AUDIUS_API_KEY;
  const audiusApiSecret = process.env.AUDIUS_API_SECRET;

  if (!audiusApiKey || !audiusApiSecret) {
    throw new Error('Audius API key or secret is missing in environment variables');
  }

  const audiusAPI = new AudiusAPI(audiusApiKey, audiusApiSecret);

  // Ingest tracks
  const trackResults = yield* _(Effect.promise(() => audiusAPI._call("track popular")));
  const tracks: Track[] = JSON.parse(trackResults).data || [];

  const trackDocuments = tracks.map(track => ({
    pageContent: `Track: ${track.title} by ${track.user.name}. Genre: ${track.genre}. Plays: ${track.playCount}. Favorites: ${track.favoriteCount}. Reposts: ${track.repostCount}.`,
    metadata: { id: track.id, type: 'track', permalink: track.permalink }
  }));

  yield* _(Effect.promise(() => vectorStore.addDocuments(trackDocuments)));
  yield* _(Console.log(`Ingested ${trackDocuments.length} Audius tracks.`));

  // Ingest users (artists)
  const userResults = yield* _(Effect.promise(() => audiusAPI._call("user popular")));
  const users: User[] = JSON.parse(userResults).data || [];

  const userDocuments = users.map(user => ({
    pageContent: `Artist: ${user.name}. Followers: ${user.followerCount}. Tracks: ${user.trackCount}. Albums: ${user.albumCount}.`,
    metadata: { id: user.id, type: 'user', handle: user.handle }
  }));

  yield* _(Effect.promise(() => vectorStore.addDocuments(userDocuments)));
  yield* _(Console.log(`Ingested ${userDocuments.length} Audius users.`));

  // Ingest playlists
  const playlistResults = yield* _(Effect.promise(() => audiusAPI._call("playlist popular")));
  const playlists: Playlist[] = JSON.parse(playlistResults).data || [];

  const playlistDocuments = playlists.map(playlist => ({
    pageContent: `Playlist: ${playlist.playlistName} by ${playlist.user.name}. Tracks: ${playlist.trackCount}. Total Plays: ${playlist.totalPlayCount}. Favorites: ${playlist.favoriteCount}. Reposts: ${playlist.repostCount}.`,
    metadata: { 
      id: playlist.id, 
      type: 'playlist',
      isAlbum: playlist.isAlbum,
      permalink: playlist.permalink
    }
  }));

  yield* _(Effect.promise(() => vectorStore.addDocuments(playlistDocuments)));
  yield* _(Console.log(`Ingested ${playlistDocuments.length} Audius playlists.`));

  yield* _(Console.log('SUPABASE_URL:', process.env.SUPABASE_URL));
  yield* _(Console.log('SUPABASE_PRIVATE_KEY:', process.env.SUPABASE_PRIVATE_KEY ? '[REDACTED]' : 'undefined'));
  yield* _(Console.log('AUDIUS_API_KEY:', process.env.AUDIUS_API_KEY ? '[REDACTED]' : 'undefined'));
  yield* _(Console.log('AUDIUS_API_SECRET:', process.env.AUDIUS_API_SECRET ? '[REDACTED]' : 'undefined'));

  return { client, vectorStore };
});

// Run the program
Effect.runPromise(ingestAudiusData).catch((error) => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});