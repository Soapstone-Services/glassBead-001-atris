import { AudiusAPI } from '../../ai_sdk/tools/audius/audiusAPI';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Track, User, Playlist } from '@audius/sdk';
import { Effect } from 'effect';

// Function to create a vector store for Audius data
async function createAudiusVectorStore(supabaseClient: SupabaseClient) {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  return new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });
}

export { createAudiusVectorStore };