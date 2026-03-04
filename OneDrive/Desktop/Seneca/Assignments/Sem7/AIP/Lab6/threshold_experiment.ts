import { loadDatabase, dotProduct, Product } from './utils';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

interface SearchResult {
    title: string;
    score: number;
}

async function getEmbedding(text: string) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0]!.embedding;
}

async function runExperiment() {
    const products: Product[] = await loadDatabase();

    console.log('--- GOOD MATCH EXPERIMENT ---');
    const goodQuery = "Nice smelling scent";
    const goodEmbedding = await getEmbedding(goodQuery);
    const goodResults: SearchResult[] = products
        .map((p: Product) => ({
            title: p.title,
            score: dotProduct(goodEmbedding, p.embedding!),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    console.log(`Query: "${goodQuery}"`);
    goodResults.forEach((r: SearchResult, i: number) => console.log(`${i + 1}. [Score: ${r.score.toFixed(4)}] ${r.title}`));

    console.log('\n--- BAD MATCH EXPERIMENT ---');
    const badQuery = "A textbook on quantum physics";
    const badEmbedding = await getEmbedding(badQuery);
    const badResults: SearchResult[] = products
        .map((p: Product) => ({
            title: p.title,
            score: dotProduct(badEmbedding, p.embedding!),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    console.log(`Query: "${badQuery}"`);
    badResults.forEach((r: SearchResult, i: number) => console.log(`${i + 1}. [Score: ${r.score.toFixed(4)}] ${r.title}`));

    console.log('\n--- NATURAL LANGUAGE EXPERIMENT ---');
    const nlQuery = "I work from home and my back is killing me, what do you recommend?";
    const nlEmbedding = await getEmbedding(nlQuery);
    const nlResults: SearchResult[] = products
        .map((p: Product) => ({
            title: p.title,
            score: dotProduct(nlEmbedding, p.embedding!),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    console.log(`Query: "${nlQuery}"`);
    nlResults.forEach((r: SearchResult, i: number) => console.log(`${i + 1}. [Score: ${r.score.toFixed(4)}] ${r.title}`));
}

runExperiment();
