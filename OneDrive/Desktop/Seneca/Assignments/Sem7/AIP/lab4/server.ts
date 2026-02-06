import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import * as z from 'zod';

// NOTE: you will implement this code
import { generateFlashcards } from './flashcard-generator.js';

/**
 * Server Application Entry Point
 * 
 * This file sets up a Hono web server using Node.js adapter.
 * It configures global middleware (logging, timing, CORS) and defines
 * the API routes. It uses Zod for input validation to ensure strictly typed requests.
 */

const app = new Hono();

// Global Middleware
// logger: logs request details (method, path, status)
// timing: adds Server-Timing headers to visualize performance
app.use(logger(), timing());

// CORS Middleware: Allow cross-origin requests from any domain ('*')
// This is necessary when the frontend and backend live on different ports.
app.use('/api/*', cors());

// Zod Schema for input validation
// Defines the expected shape of the POST body for /api/generate
const generateSchema = z.object({
    // 'notes' must be a non-empty string
    notes: z.string().min(1, "Field 'notes' is required."),
    // 'count' is optional (defaults to 3 if not provided) and must be a number
    count: z.number().optional().default(3),
});

// POST endpoint to generate flashcards
// Uses zValidator middleware to validate the JSON body against generateSchema
// If validation fails, Hono automatically returns a 400 error.
app.post('/api/generate', zValidator('json', generateSchema), async (c) => {
    try {
        // Access validated data (fully typed)
        const { notes, count } = await c.req.valid('json');

        // Call the AI logic
        const result = await generateFlashcards(notes, count);

        // Return the result as JSON
        return c.json(result);
    } catch (error: any) {
        console.error('Server Error:', error);
        // Return a 500 Internal Server Error if something goes wrong
        return c.json(
            {
                error: 'Failed to generate flashcards.',
                details: error.message,
            },
            500
        );
    }
});

const port = 3000;
console.log(`🚀 Server running on http://localhost:${port}`);

// Start the Node.js server adapter
serve({
    fetch: app.fetch,
    port,
});
