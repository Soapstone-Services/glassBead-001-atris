import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

if (!process.env.PUBLIC_SUPABASE_URL) {
  console.error("Missing PUBLIC_SUPABASE_URL environment variable");
  throw new Error("Missing PUBLIC_SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_PRIVATE_KEY) {
  console.error("Missing SUPABASE_PRIVATE_KEY environment variable");
  throw new Error("Missing SUPABASE_PRIVATE_KEY environment variable");
}

console.log("PUBLIC_SUPABASE_URL:", process.env.PUBLIC_SUPABASE_URL);
console.log("SUPABASE_PRIVATE_KEY:", process.env.SUPABASE_PRIVATE_KEY ? "Set" : "Not set");

export const supabaseClient = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_PRIVATE_KEY
);

export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: "documents",
  queryName: "match_documents",
});