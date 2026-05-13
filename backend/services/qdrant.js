import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';

const client = new QdrantClient({ url: 'http://localhost:6333' });
const COLLECTION = 'resumes';
const VECTOR_SIZE = 768;

// Always clears and recreates — single resume tool, each upload replaces previous.
export async function ensureCollection() {
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION);
  if (exists) await client.deleteCollection(COLLECTION);
  await client.createCollection(COLLECTION, {
    vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
  });
}

export async function upsertChunks(chunks, embeddings, metadata = {}) {
  const points = chunks.map((text, i) => ({
    id: uuidv4(),
    vector: embeddings[i],
    payload: { text, chunkIndex: i, ...metadata },
  }));
  await client.upsert(COLLECTION, { points });
}

export async function searchChunks(queryEmbedding, topK = 8) {
  const results = await client.search(COLLECTION, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true,
  });
  return results.map(r => r.payload.text);
}

export async function collectionExists() {
  const collections = await client.getCollections();
  return collections.collections.some(c => c.name === COLLECTION);
}
