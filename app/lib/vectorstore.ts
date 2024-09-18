import type { Document } from "@langchain/core/documents";
import { vectorStore } from './supabase/client';

const document1: Document = {
  pageContent: "The powerhouse of the cell is the mitochondria",
  metadata: { source: "https://example.com" },
};

const document2: Document = {
  pageContent: "Buildings are made out of brick",
  metadata: { source: "https://example.com" },
};

const document3: Document = {
  pageContent: "Mitochondria are made out of lipids",
  metadata: { source: "https://example.com" },
};

const document4: Document = {
  pageContent: "The 2024 Olympics are in Paris",
  metadata: { source: "https://example.com" },
};

const documents = [document1, document2, document3, document4];

async function addDocumentsToVectorStore() {
  await vectorStore.addDocuments(documents, { ids: ["1", "2", "3", "4"] });
}

addDocumentsToVectorStore();