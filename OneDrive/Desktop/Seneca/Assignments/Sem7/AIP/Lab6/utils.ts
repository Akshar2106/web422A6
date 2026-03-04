import { readFile } from 'fs/promises';
import OpenAI from 'openai';

export function serializeProduct(product: any): string {
  const parts = [
    `Title: ${product.title}`,
    `Category: ${product.category}`,
    `Description: ${product.description}`,
    `Tags: ${product.tags?.join(', ')}`,
    `Brand: ${product.brand}`
  ];
  return parts.join(' | ').replace(/[\t\n]/g, ' ');
}

export function dotProduct(vecA: number[], vecB: number[]): number {
  return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
}

export async function loadDatabase() {
  // 1. Read the JSON file
  const productsData = await readFile('products.json', 'utf-8');
  const products = JSON.parse(productsData);

  // 2. Read the TSV file
  const vectorsData = await readFile('vectors.tsv', 'utf-8');
  const lines = vectorsData.trim().split('\n');

  // 3. Attach vectors to products
  // We assume Line 0 of vectors.tsv matches products[0]
  const productsWithEmbeddings = products.map((product: any, index: number) => {
    const vectorString = lines[index];
    // Convert tab-separated values to a list of float numbers
    const vector = vectorString.split('\t').map(Number);
    return { ...product, embedding: vector };
  });

  return productsWithEmbeddings;
}

export interface Product {
  id: number;
  title: string;
  category: string;
  description: string;
  tags: string[];
  brand: string;
  price: number;
  embedding?: number[];
  [key: string]: any;
}

export async function searchProducts(
  query: string,
  products: Product[],
  openai: OpenAI,
  minScore: number = 0.35
): Promise<{ product: Product; score: number }[]> {
  // 1. Embed the query
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryEmbedding = response.data[0]!.embedding;

  // 2. Calculate dot product and map results
  const results = products
    .map((product) => ({
      product,
      score: dotProduct(queryEmbedding, product.embedding!),
    }))
    // 3. Filter out anything below minScore
    .filter((res) => res.score >= minScore)
    // 4. Sort by score (descending)
    .sort((a, b) => b.score - a.score);

  // 5. Return top 5 results
  return results.slice(0, 5);
}
