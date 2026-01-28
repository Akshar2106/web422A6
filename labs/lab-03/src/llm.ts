import axios from 'axios';
import * as dotenv from 'dotenv';
import { Comment } from './types';

dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-exp:free';

export async function generateAnalysis(diff: string, comments: Comment[]): Promise<string> {
    if (!API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not defined in .env file');
    }

    const systemPrompt = `You are a Principal Engineer at a top-tier tech company. Your role is to review Pull Requests (PRs) and provide a comprehensive analysis to a junior developer. 
You value code safety, maintainability, performance, and best practices. Your tone is educational but rigorous.

You will be provided with:
1. The Code Changes (The DIFF) wrapped in a markdown code block.
2. The Discussion History (The Comments) wrapped in XML tags <comments>...</comments>.

Your task is to analyze these inputs using the following Chain of Thought process:
1. **Analyze the Diff**: Read the code changes carefully. Understand what code was added, removed, or modified. Identify the technical details of the implementation.
2. **Analyze the Context**: Read the comments to understand the goal of the PR, the discussions between the author and maintainers, and any concerns raised.
3. **Reflect**: Combine your technical understanding with the human context. Are there any potential bugs? Are there edge cases? specific constraint?
4. **Synthesize**: Generate a final report in Markdown format.

**Output Format**:
Your output must be a Markdown report with the following sections:

# PR Analysis

## Summary
(What is the goal of this PR? briefly.)

## The Discussion
(Summarize the conversation. Who said what? What were the key points of agreement or disagreement? Are there blockers?)

## Assessment
(Identify potential bugs, edge cases, hidden assumptions, or code quality issues. Be specific.)

## Socratic Questions
(Generate 3 questions that would test the user's understanding of the changes. e.g., "Why did the author use X instead of Y?")
`;

    const formattedComments = comments.map(c =>
        `<comment username="${c.username}" date="${c.date}">\n${c.body}\n</comment>`
    ).join('\n');

    const userPrompt = `
Here is the PR data:

\`\`\`diff
${diff}
\`\`\`

<comments>
${formattedComments}
</comments>
`;

    try {
        const response = await axios.post(API_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/Akshar2106/web422A6', // Optional: required by OpenRouter for ranking
                'X-Title': 'GitHub PR Explainer'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error: any) {
        throw new Error(`Failed to call LLM API: ${error.message}${error.response ? ` - ${JSON.stringify(error.response.data)}` : ''}`);
    }
}
