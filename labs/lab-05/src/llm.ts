import axios from 'axios';
import * as dotenv from 'dotenv';
import { Comment } from './types';
import { getGitHubFile } from './tools';

dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

const tools = [
    {
        type: 'function',
        function: {
            name: 'get_github_file',
            description: 'Fetches the content of a file from GitHub. Use this when the diff is insufficient to understand the context of a change, such as when you need to see how a variable is initialized, how a function is called elsewhere, or the broader scope of a file.',
            parameters: {
                type: 'object',
                properties: {
                    owner: {
                        type: 'string',
                        description: 'The owner of the repository (e.g., "facebook")',
                    },
                    repo: {
                        type: 'string',
                        description: 'The name of the repository (e.g., "react")',
                    },
                    filepath: {
                        type: 'string',
                        description: 'The path to the file (e.g., "packages/react/src/React.js")',
                    },
                    ref: {
                        type: 'string',
                        description: 'The branch, tag, or commit SHA to fetch from. Defaults to "main" if not specified.',
                    },
                    maxLines: {
                        type: 'number',
                        description: 'The maximum number of lines to return. Defaults to 500.',
                    },
                },
                required: ['owner', 'repo', 'filepath'],
                additionalProperties: false,
            },
        },
    },
];

export async function generateAnalysis(owner: string, repo: string, diff: string, comments: Comment[]): Promise<string> {
    if (!API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not defined in .env file');
    }

    const systemPrompt = `Act like a senior engineer helping a junior. I will send you code changes and comments.

You have access to a tool called 'get_github_file' that can fetch the full content of a file from GitHub.
Use this tool whenever the diff alone is not enough to understand the changes. For example:
- If a variable is used but not defined in the diff.
- If a function call's arguments are unclear.
- If you need to see the full context of a function or class.

Important:
- Do not fetch files unnecessarily. If the diff is self-explanatory, just analyze it.
- If you fetch a file, explain why you are fetching it (e.g., "I need to check how 'suspenseHandlerStackCursor' is initialized...").
- The 'owner' and 'repo' are provided in the context, make sure to use them correctly.

Step 1: Read the code and comments.
Step 2: Determine if you need more context. You should strongly consider fetching the file to see the surrounding code, especially for key logic changes.
If a question can be answered by fetching a file, USE THE TOOL immediately. Do not ask the user if you should fetch it.
Step 3: Once you have enough information, write the report.

Format:
# PR Analysis
## Summary
(What is it?)
## Discussion
(What did they say?)
## Assessment
(Any problems?)
## Questions
(Ask me 3 questions)
`;

    const formattedComments = comments.map(c =>
        `<comment username="${c.username}" date="${c.date}">\n${c.body}\n</comment>`
    ).join('\n');

    const userPrompt = `
Here is the PR data for ${owner}/${repo}:

\`\`\`diff
${diff}
\`\`\`

<comments>
${formattedComments}
</comments>
`;

    let messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    let iteration = 0;
    const MAX_ITERATIONS = 5;

    while (iteration < MAX_ITERATIONS) {
        iteration++;

        try {
            const response = await axios.post(API_URL, {
                model: MODEL,
                messages: messages,
                tools: tools,
                tool_choice: 'auto',
                temperature: 0.7,
            }, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/Akshar2106/web422A6',
                    'X-Title': 'GitHub PR Explainer'
                }
            });

            const responseMessage = response.data.choices[0].message;
            messages.push(responseMessage);

            if (responseMessage.tool_calls) {
                console.log(`\n[Tool Call] The LLM wants to execute tools: ${responseMessage.tool_calls.length} calls`);

                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);

                    if (functionName === 'get_github_file') {
                        console.log(`  > Calling get_github_file for ${args.filepath}...`);
                        const content = await getGitHubFile(args.owner, args.repo, args.filepath, args.ref, args.maxLines);

                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: content
                        });
                        console.log(`  > Result added to conversation.`);
                    }
                }
            } else {
                // No tool calls, we are done
                return responseMessage.content;
            }

        } catch (error: any) {
            throw new Error(`Failed to call LLM API: ${error.message}${error.response ? ` - ${JSON.stringify(error.response.data)}` : ''}`);
        }
    }

    return "Max iterations reached without final response.";
}
