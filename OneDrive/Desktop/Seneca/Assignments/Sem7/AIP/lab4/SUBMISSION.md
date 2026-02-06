# Lab 4 Submission

## Link to code for lab on GitHub
[https://github.com/Akshar2106/web422A6/tree/feature/fix-css-forindex/OneDrive/Desktop/Seneca/Assignments/Sem7/AIP/lab4](https://github.com/Akshar2106/web422A6/tree/feature/fix-css-forindex/OneDrive/Desktop/Seneca/Assignments/Sem7/AIP/lab4)

(Note: Ensure the path matches where it is pushed in the repo. Since the repo root is your user folder, the path is likely long).

## Code Reading Reflection

### Reflection
Hono is a web framework similar to Express using the same "middleware" pattern (`app.use(...)`), but it's designed to be modern, lightweight, and run on any JavaScript runtime (Node.js, Deno, Bun, Cloudflare Workers). In this project, we adapt it to run on Node.js using `@hono/node-server`.

**Middleware:**
- `logger()`: Logs details of every request (HTTP method, path, status) to the console, essential for debugging.
- `timing()`: Tracks how long requests take and adds a `Server-Timing` header to the response, useful for performance monitoring.
- `cors()`: (Cross-Origin Resource Sharing) Adds headers allowing browsers to make requests to this API from different domains.

**Validation:**
The `/api/generate` route uses `zValidator('json', generateSchema)`. It intercepts the request, parses the JSON body, validates it against the `generateSchema` defined with Zod, and passes typed data to the handler. If invalid, it automatically returns a 400 Bad Request.

### Commented Server Code
(See `server.ts` in the codebase)

## Prompt Changes

### New INSTRUCTIONS.md
```markdown
You are an intelligent tutor designed to help students learn by generating practical, scenario-based flashcards from their course notes.

# GOAL
Your goal is to extract key concepts from the provided notes and transform them into specific, realistic scenarios that test the student's ability to apply their knowledge.

# RULES
1.  **Source Material**: Use ONLY the provided text. Do not hallucinate outside information.
2.  **Scenario-Based**: Questions must be based on a realistic situation, not just "Define X".
3.  **Correctness**: Ensure the answer is accurate and directly supported by the notes.
4.  **Format**: You must respond with valid JSON matching the defined schema.

# STRUCTURED OUTPUT
You must return a JSON object with a key "flashcards" containing a list of flashcard objects.
Each flashcard must have:
- `scenario`: A practical situation.
- `question`: The question to ask.
- `response`: The answer.
- `reference`: Direct quote from notes.
- `why_it_matters`: Why this is important.
- `common_mistake`: A quote of a misconception.

# EXAMPLES
(These examples are for tone and style only. Output must be strictly JSON.)
... (Examples omitted for brevity)
```

### Explanation
I removed the explicit "=== CARD ===" formatting instructions and replaced them with a `# STRUCTURED OUTPUT` section that enforces the JSON key structure. I also added a `# RULES` section to emphasize strict adherence to the schema and source material.

## Evidence of Success
(Please take a screenshot of the terminal running `node test-client.js` showing the successful JSON output)

## Structured Outputs Reflection

**Models Tried:**
- `openai/gpt-4o-mini` (via OpenRouter)

**Results & Issues:**
The model produced high-quality content that matched the schema perfectly in terms of JSON structure. However, I encountered a technical issue with the `openai` Node.js SDK when using OpenRouter: the `completion.choices[0].message.parsed` field (which is supposed to be auto-populated by `zodResponseFormat`) was `null`.

**Resolution:**
To overcome this, I implemented a fallback in `flashcard-generator.ts` that checks if `parsed` is null and, if so, attempts to manually parse `completion.choices[0].message.content` using `JSON.parse()`. This successfully retrieved the structured data.

**Quality:**
The model did not get "dumber"; the quality of the generated flashcards was high, and the JSON format was strictly followed.

## Code

### schemas.ts
```typescript
import { z } from 'zod';

export const FlashcardSchema = z.object({
  scenario: z.string().describe("A realistic situation where this concept applies"),
  question: z.string().describe("A specific question about the scenario"),
  response: z.string().describe("The correct answer"),
  reference: z.string().describe("A direct quote from source notes"),
  why_it_matters: z.string().describe("An explanation of significance"),
  common_mistake: z.string().describe("A quote of what a confused student might say"),
});

export const FlashcardResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema),
});
```

### flashcard-generator.ts
```typescript
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { FlashcardResponseSchema } from './schemas.js';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const openai = new OpenAI();
// ... (code omitted for brevity, see file)
```
