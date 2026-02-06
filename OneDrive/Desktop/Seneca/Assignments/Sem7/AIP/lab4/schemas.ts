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
