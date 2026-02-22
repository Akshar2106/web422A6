import axios from 'axios';
import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { readFile, grepCodebase, getFileHistory } from './tools';
import { execSync } from 'child_process';

dotenv.config();

const program = new Command();

program
    .name('ai-code-reviewer')
    .description('AI-powered code review CLI tool')
    .version('1.0.0')
    .option('-v, --verbose', 'enable verbose logging')
    .option('-f, --file <path>', 'review a specific file')
    .parse(process.argv);

const options = program.opts();

function log(message: string) {
    if (options.verbose) {
        console.log(`[VERBOSE] ${message}`);
    }
}

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

const TOOL_SCHEMAS = [
    {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
            type: 'object',
            properties: {
                file_path: { type: 'string' },
                start_line: { type: 'number' },
                end_line: { type: 'number' }
            },
            required: ['file_path']
        }
    },
    {
        name: 'grep_codebase',
        description: 'Search the codebase for a pattern',
        parameters: {
            type: 'object',
            properties: {
                search_pattern: { type: 'string' }
            },
            required: ['search_pattern']
        }
    },
    {
        name: 'get_file_history',
        description: 'Get the git history (diffs) for a file',
        parameters: {
            type: 'object',
            properties: {
                file_path: { type: 'string' }
            },
            required: ['file_path']
        }
    }
];

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
            model: 'google/gemini-2.0-flash-001',
            messages,
            tools: tools.length > 0 ? tools.map(t => ({ type: 'function', function: t })) : undefined,
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

async function main() {
    let context = "";
    if (options.file) {
        console.log(`Reviewing file: ${options.file}`);
        context = `Review this file: ${options.file}\n\nContent:\n${readFile(options.file)}`;
    } else {
        console.log(`Reviewing staged changes (Git Mode)`);
        try {
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
            if (!staged.trim()) {
                console.log("No staged changes found. Use --file <path> or stage changes with 'git add'.");
                return;
            }
            context = `Review these staged changes:\n${staged}\n\nDiff:\n${execSync('git diff --cached', { encoding: 'utf-8' })}`;
        } catch (e) {
            console.error("Error getting git context. Are you in a git repo?");
            return;
        }
    }

    console.log("Running parallel reviews...");
    const [securityReport, maintainabilityReport] = await Promise.all([
        callOpenRouter(SECURITY_PROMPT, context, TOOL_SCHEMAS),
        callOpenRouter(MAINTAINABILITY_PROMPT, context, TOOL_SCHEMAS)
    ]);

    log("Security Report received.");
    log("Maintainability Report received.");

    console.log("Synthesizing final report...");
    const synthesisContext = `Security Findings:\n${securityReport}\n\nMaintainability Findings:\n${maintainabilityReport}`;
    const finalReport = await callOpenRouter(JUDGE_PROMPT, synthesisContext, []);

    console.log("\n--- FINAL CODE REVIEW REPORT ---\n");
    console.log(finalReport);
}

main().catch(console.error);
