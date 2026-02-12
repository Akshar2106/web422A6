import { generateAnalysis } from './llm';

async function test() {
    console.log('Testing Tool Calling causing scenario...');

    // Simulate a situation where the LLM MUST fetch a file
    const owner = 'microsoft';
    const repo = 'vscode';

    // logic: The diff shows usage of 'version' from package.json, but doesn't show the value.
    const diff = `
diff --git a/src/main.ts b/src/main.ts
index 1234567..890abcd 100644
--- a/src/main.ts
+++ b/src/main.ts
@@ -1,5 +1,5 @@
-import { app } from 'electron';
+import { app, version } from 'electron';
+import { version as packageVersion } from '../package.json';
 
 console.log(\`Running VS Code version \${packageVersion}\`);
`;

    const comments = [
        {
            username: 'reviewer',
            body: 'Can you check if the version in package.json matches 1.99.0? I cannot see package.json in this diff.',
            date: '2023-10-27T10:00:00Z'
        }
    ];

    try {
        const analysis = await generateAnalysis(owner, repo, diff, comments);
        console.log('\nFinal Analysis:\n', analysis);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
