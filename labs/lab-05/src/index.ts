#!/usr/bin/env node
import { parsePRUrl, fetchDiff, fetchComments } from './github';
import { generateAnalysis } from './llm';

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Error: Please provide a GitHub PR URL.');
        console.error('Usage: npx ts-node src/index.ts <PR_URL>');
        process.exit(1);
    }

    const url = args[0];

    try {
        console.log('Parsing URL...');
        const prOptions = parsePRUrl(url);
        console.log(`Analyzing PR: ${prOptions.owner}/${prOptions.repo} #${prOptions.prNumber}`);

        console.log('Fetching Diff...');
        const diff = await fetchDiff(prOptions.owner, prOptions.repo, prOptions.prNumber);
        console.log(`Diff fetched (${diff.length} characters).`);

        console.log('Fetching Comments...');
        const comments = await fetchComments(prOptions.owner, prOptions.repo, prOptions.prNumber);
        console.log(`Comments fetched (${comments.length} comments).`);

        console.log('Generating Analysis with LLM (this may take a moment)...');
        const analysis = await generateAnalysis(prOptions.owner, prOptions.repo, diff, comments);

        console.log('\n' + '='.repeat(50) + '\n');
        console.log(analysis);
        console.log('\n' + '='.repeat(50) + '\n');

    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
