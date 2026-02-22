import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Reads a file from disk, optionally returning a range of lines.
 * Truncates long files to avoid token limits.
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
 * Searches the codebase for a pattern using ripgrep or grep.
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
 * Gets the recent git history of a file.
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

function truncateOutput(output: string, maxChars: number = 2000): string {
    if (output.length > maxChars) {
        return output.substring(0, maxChars) + `\n... [Truncated: Output too long] ...`;
    }
    return output;
}
