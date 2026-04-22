import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!pineconeApiKey || !pineconeIndexName) {
  console.warn('Pinecone configuration missing. Knowledge base features might not work.');
}

export const pinecone = new Pinecone({
  apiKey: pineconeApiKey || '',
});

export const openai = new OpenAI({
  apiKey: openaiApiKey || '',
});

export const getIndex = (namespace = '') => {
  return pinecone.index(pineconeIndexName || '').namespace(namespace);
};

export async function createEmbedding(text: string) {
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is missing');
  }
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
    dimensions: 768,
  });

  return response.data[0].embedding;
}
