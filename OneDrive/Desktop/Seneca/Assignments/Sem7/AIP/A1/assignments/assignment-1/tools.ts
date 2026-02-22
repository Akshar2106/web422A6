import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Truncates output to a reasonable size for LLM consumption
 */
function truncateOutput(output: string, maxLength: number = 2000): string {
    if (output.length > maxLength) {
        return output.substring(0, maxLength) + "\n... [Output Truncated] ...";
    }
    return output;
}

/**
 * Tool: read_file
 * Reads content of a file, with optional line range
 */
export function readFile(filePath: string, startLine?: number, endLine?: number): string {
    try {
        if (!fs.existsSync(filePath)) {
            return `Error: File not found at ${filePath}`;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        const start = startLine ? Math.max(0, startLine - 1) : 0;
        const end = endLine ? Math.min(lines.length, endLine) : lines.length;

        let resultLines = lines.slice(start, end);

        // Truncate if too many lines (safety limit)
        const MAX_LINES = 500;
        if (resultLines.length > MAX_LINES) {
            resultLines = resultLines.slice(0, MAX_LINES);
            resultLines.push(`\n... [Truncated: File too long, showing first ${MAX_LINES} lines] ...`);
        }

        return resultLines.join('\n');
    } catch (error: any) {
        return `Error reading file: ${error.message}`;
    }
}

/**
 * Tool: grep_codebase
 * Searches codebase for a pattern using ripgrep or grep
 */
export function grepCodebase(searchPattern: string): string {
    try {
        // Try ripgrep first, fallback to grep
        let command = `rg -n "${searchPattern}" .`;
        try {
            const output = execSync(command, { encoding: 'utf-8' });
            return truncateOutput(output);
        } catch (rgError) {
            command = `grep -rn "${searchPattern}" .`;
            const output = execSync(command, { encoding: 'utf-8' });
            return truncateOutput(output);
        }
    } catch (error: any) {
        if (error.status === 1) {
            return `No matches found for "${searchPattern}".`;
        }
        return `Error searching codebase: ${error.message}`;
    }
}

/**
 * Tool: get_file_history
 * Gets recent git history for a file
 */
export function getFileHistory(filePath: string): string {
    try {
        const command = `git log -p -n 3 -- "${filePath}"`;
        const output = execSync(command, { encoding: 'utf-8' });

        if (!output.trim()) {
            return "No history available (file is new or untracked).";
        }

        return truncateOutput(output);
    } catch (error: any) {
        return "No history available (file is new or untracked).";
    }
}
