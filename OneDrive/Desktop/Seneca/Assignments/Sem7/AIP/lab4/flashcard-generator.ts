import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { FlashcardResponseSchema } from './schemas.js';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const openai = new OpenAI();

/**
 * Generates flashcards from the provided notes using Structured Outputs.
 * @param notes - The raw text of the course notes
 * @param count - The number of cards to generate
 * @returns A Promise resolving to the structured JSON data
 */
export async function generateFlashcards(notes: string, count: number) {
    // 1. Load system prompt
    const instructionsPath = path.join(process.cwd(), 'INSTRUCTIONS.md');
    const instructions = await fs.readFile(instructionsPath, 'utf-8');

    // 2. Call OpenAI with structured outputs
    const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini", // OpenRouter model name
        messages: [
            { role: "system", content: instructions },
            { role: "user", content: `Please generate ${count} flashcards based on the following notes:\n\n${notes}` },
        ],
        response_format: zodResponseFormat(FlashcardResponseSchema, "flashcards"),
    });

    // 3. Return the parsed data
    const parsed = completion.choices[0].message.parsed;

    // Handle potential null if refusal (though strict structured outputs usually refuse or return null, strict: true is default for some)
    if (!parsed) {
        if (completion.choices[0].message.content) {
            console.warn("Structured output parsing failed (parsed is null), falling back to manual JSON.parse.");
            try {
                return JSON.parse(completion.choices[0].message.content);
            } catch (e) {
                console.error("Manual parse failed:", e);
            }
        }
        throw new Error("Failed to parse flashcards from LLM response");
    }

    return parsed;
}
