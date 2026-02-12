import { getGitHubFile } from './tools';

async function test() {
    console.log('Testing getGitHubFile...\n');

    // Test successful fetch
    console.log('--- Test 1: Valid File (microsoft/vscode/package.json) ---');
    try {
        const content = await getGitHubFile('microsoft', 'vscode', 'package.json', 'main');
        console.log(content.slice(0, 200) + '...\n');
    } catch (e) {
        console.error('Test 1 Failed:', e);
    }

    // Test 404
    console.log('--- Test 2: Invalid File ---');
    try {
        const error = await getGitHubFile('microsoft', 'vscode', 'non-existent-file.json', 'main');
        console.log(error + '\n');
    } catch (e) {
        console.error('Test 2 Failed:', e);
    }

    // Test Truncation
    console.log('--- Test 3: Truncation (setting limit to 5 lines) ---');
    try {
        const truncated = await getGitHubFile('microsoft', 'vscode', 'package.json', 'main', 5);
        console.log(truncated);
    } catch (e) {
        console.error('Test 3 Failed:', e);
    }
}

test();
