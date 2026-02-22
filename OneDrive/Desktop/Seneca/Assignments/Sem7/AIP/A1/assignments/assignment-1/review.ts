import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import JSON5 from 'json5';
import { readFile, grepCodebase, getFileHistory } from './tools';

dotenv.config();

const program = new Command();

program
    .name('review')
    .description('AI Code Review CLI Tool')
    .version('1.0.0')
    .option('-f, --file <path>', 'File Mode: Review a specific file')
    .option('-v, --verbose', 'Verbose Mode: Print detailed logs to stderr')
    .parse(process.argv);

const options = program.opts();
const isVerbose = !!options.verbose;

function log(message: string) {
    if (isVerbose) {
        process.stderr.write(`[VERBOSE] ${message}\n`);
    }
}

async function getStagedDiff(): Promise<string> {
    try {
        const diff = execSync('git diff --staged', { encoding: 'utf-8' });
        return diff;
    } catch (error: any) {
        console.error('Error getting staged diff:', error.message);
        process.exit(1);
    }
}

async function callOpenRouter(systemPrompt: string, userContent: string, tools: any[]): Promise<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error('Error: OPENROUTER_API_KEY is not set in .env');
        process.exit(1);
    }

    let messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
    ];

    while (true) {
        log(`Calling LLM...`);
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.0-flash-001', // High value model
            messages,
            tools: tools.length > 0 ? [{ type: 'function', function: tools[0] }, { type: 'function', function: tools[1] }, { type: 'function', function: tools[2] }] : undefined,
            tool_choice: 'auto'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const choice = response.data.choices[0];
        const message = choice.message;

        if (message.tool_calls) {
            messages.push(message);
            for (const toolCall of message.tool_calls) {
                const name = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                log(`Agent calling tool: ${name}(${JSON.stringify(args)})`);

                let result = '';
                if (name === 'read_file') result = readFile(args.file_path, args.start_line, args.end_line);
                else if (name === 'grep_codebase') result = grepCodebase(args.search_pattern);
                else if (name === 'get_file_history') result = getFileHistory(args.file_path);

                log(`Tool ${name} returned: ${result.substring(0, 100)}...`);
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name,
                    content: result
                });
            }
            continue;
        }

        return message.content;
    }
}

const TOOL_SCHEMAS = [
    {
        name: 'read_file',
        description: 'Read the contents of a file on disk.',
        parameters: {
            type: 'object',
            properties: {
                file_path: { type: 'string', description: 'Path to the file' },
                start_line: { type: 'number', description: 'Starting line number (1-indexed)' },
                end_line: { type: 'number', description: 'Ending line number (inclusive)' }
            },
            required: ['file_path']
        }
    },
    {
        name: 'grep_codebase',
        description: 'Search for a string pattern in the codebase.',
        parameters: {
            type: 'object',
            properties: {
                search_pattern: { type: 'string', description: 'Regex or string to search for' }
            },
            required: ['search_pattern']
        }
    },
    {
        name: 'get_file_history',
        description: 'Get recent git history/diffs for a file.',
        parameters: {
            type: 'object',
            properties: {
                file_path: { type: 'string', description: 'Path to the file' }
            },
            required: ['file_path']
        }
    }
];

const SECURITY_PROMPT = `You are "The Security Auditor". Persona: Paranoid, strict, and unyielding. 
Role: Scan for vulnerabilities, hardcoded secrets, dangerous logic, and missing checks.
Output: MUST be a JSON array of objects with keys: file, line_number, severity, category, description.
Only output the JSON array, no other text.`;

const MAINTAINABILITY_PROMPT = `You are "The Maintainability Critic". Persona: Obsessed with "Clean Code", DRY, and naming conventions.
Role: Focus on readability, variable naming, function length, and refactoring opportunities.
Output: MUST be a JSON array of objects with keys: file, line_number, severity, category, description.
Only output the JSON array, no other text.`;

const JUDGE_PROMPT = `You are the "Lead Developer". Persona: Pragmatic, empathetic, firm.
Goal: Synthesize multiple code review JSON reports into a single, actionable Markdown report.
De-duplicate issues, filter hallucinations, and clarify wording.
Output: Markdown report with an executive summary and detailed findings.`;

async function main() {
    let inputCode = '';
    let targetFile = '';

    if (options.file) {
        log(`File Mode: ${options.file}`);
        if (!fs.existsSync(options.file)) {
            console.error(`Error: File not found: ${options.file}`);
            process.exit(1);
        }
        inputCode = fs.readFileSync(options.file, 'utf-8');
        targetFile = options.file;
    } else {
        log('Git Mode: checking staged changes');
        inputCode = await getStagedDiff();
        if (!inputCode.trim()) {
            console.log('No staged changes to review.');
            process.exit(0);
        }
    }

    log('Phase 1: Running Parallel Reviews');
    const [securityReview, maintainabilityReview] = await Promise.all([
        callOpenRouter(SECURITY_PROMPT, inputCode, TOOL_SCHEMAS),
        callOpenRouter(MAINTAINABILITY_PROMPT, inputCode, TOOL_SCHEMAS)
    ]);

    log(`Security Review JSON: ${securityReview}`);
    log(`Maintainability Review JSON: ${maintainabilityReview}`);

    log('Phase 2: Synthesis');
    const judgeInput = `Review 1 (Security):\n${securityReview}\n\nReview 2 (Maintainability):\n${maintainabilityReview}`;
    const finalReport = await callOpenRouter(JUDGE_PROMPT, judgeInput, []);

    console.log(finalReport);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
