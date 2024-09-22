import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { AudiusAPI } from '../app/ai_sdk/tools/audius/audiusAPI';
import { Effect } from 'effect';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });


async function populateDocuments() {
	if (!process.env.PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error("Missing Supabase environment variables");
	}

	const supabaseClient = createClient(
		process.env.PUBLIC_SUPABASE_URL,
		process.env.SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		}
	);

	const embeddings = new OpenAIEmbeddings({
		model: "text-embedding-3-small",
	});

	const vectorStore = new SupabaseVectorStore(embeddings, {
		client: supabaseClient,
		tableName: "documents",
		queryName: "match_documents",
	});

	const audius = new AudiusAPI(process.env.AUDIUS_API_KEY!, process.env.AUDIUS_API_SECRET!);

	// Fetch some data from Audius
	const tracksEffect = audius.searchTracks("", { limit: 100 });

	// Run the Effect to get the actual tracks
	const tracks = await Effect.runPromise(tracksEffect);

	// Prepare documents
	const documents = tracks.map(track => ({
		pageContent: `${track.title} by ${track.user.name}. Genre: ${track.genre}. Plays: ${track.playCount}`,
		metadata: { id: track.id, type: 'track' }
	}));

	// Add documents to the vector store
	await vectorStore.addDocuments(documents);

	console.log(`Added ${documents.length} documents to the vector store.`);
}

populateDocuments().catch(console.error);