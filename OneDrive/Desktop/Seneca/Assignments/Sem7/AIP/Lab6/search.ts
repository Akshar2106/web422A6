import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { loadDatabase, searchProducts, Product } from './utils';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
    console.log('Loading database...');
    const products: Product[] = await loadDatabase();
    console.log(`Loaded ${products.length} products with embeddings.`);

    const MIN_SIMILARITY_SCORE = 0.20;

    while (true) {
        const query = await question('\nWhat are you looking for? (or type "exit" to quit): ');

        if (query.toLowerCase() === 'exit') {
            rl.close();
            break;
        }

        if (!query.trim()) continue;

        console.log('Searching...');
        const results = await searchProducts(query, products, openai, MIN_SIMILARITY_SCORE);

        if (results.length > 0) {
            console.log(`Found ${results.length} matches:`);
            results.forEach((res, i) => {
                console.log(`${i + 1}. [Score: ${res.score.toFixed(2)}] ${res.product.title} - $${res.product.price}`);
            });
        } else {
            console.log("I'm sorry, we don't have anything like that in stock.");
        }
    }
}

main().catch(console.error);
