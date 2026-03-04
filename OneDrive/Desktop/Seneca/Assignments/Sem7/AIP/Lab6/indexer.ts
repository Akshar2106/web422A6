import axios from 'axios';
import { writeFile } from 'fs/promises';
import { serializeProduct } from './utils';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

async function runIndexer() {
    try {
        console.log('Fetching products...');
        const response = await axios.get('https://dummyjson.com/products?limit=200');
        const products = response.data.products;

        console.log(`Fetched ${products.length} products. Saving to products.json...`);
        await writeFile('products.json', JSON.stringify(products, null, 2));

        console.log('Serializing products...');
        const serializedProducts = products.map(serializeProduct);

        console.log('Generating embeddings (this may take a moment)...');
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: serializedProducts,
        });

        const embeddings = embeddingResponse.data.map((item) => item.embedding);

        console.log('Saving vectors.tsv...');
        const vectorsTsv = embeddings
            .map((vec) => vec.join('\t'))
            .join('\n');
        await writeFile('vectors.tsv', vectorsTsv);

        console.log('Saving metadata.tsv...');
        const metadataHeader = 'Title\tCategory\n';
        const metadataRows = products
            .map((p: any) => {
                const title = p.title.replace(/[\t\n]/g, ' ');
                const category = p.category.replace(/[\t\n]/g, ' ');
                return `${title}\t${category}`;
            })
            .join('\n');
        await writeFile('metadata.tsv', metadataHeader + metadataRows);

        console.log('Indexing complete!');
    } catch (error) {
        console.error('Error during indexing:', error);
    }
}

runIndexer();
