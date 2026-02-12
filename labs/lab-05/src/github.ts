import axios from 'axios';
import { Comment, PROptions } from './types';

export function parsePRUrl(url: string): PROptions {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname !== 'github.com') {
            throw new Error('Invalid URL: Must be a github.com URL');
        }

        // Path should be /owner/repo/pull/number
        // Split by / and remove empty strings
        const parts = parsedUrl.pathname.split('/').filter(Boolean);

        if (parts.length < 4 || parts[2] !== 'pull') {
            throw new Error('Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/number');
        }

        const owner = parts[0];
        const repo = parts[1];
        const prNumber = parseInt(parts[3], 10);

        if (isNaN(prNumber)) {
            throw new Error('Invalid PR number');
        }

        return { owner, repo, prNumber };
    } catch (error: any) {
        throw new Error(`Failed to parse URL: ${error.message}`);
    }
}

export async function fetchDiff(owner: string, repo: string, prNumber: number): Promise<string> {
    const diffUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

    try {
        const response = await axios.get(diffUrl, {
            headers: {
                'User-Agent': 'AIP444-Lab-03',
                'Accept': 'application/vnd.github.v3.diff',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        let diffText = response.data;

        // Check if diff is too long (100,000 chars)
        if (diffText.length > 100000) {
            console.warn('Warning: Diff is too large, truncating to 100,000 characters...');
            diffText = diffText.substring(0, 100000) + '\n...[Diff Truncated]...';
        }

        return diffText;
    } catch (error: any) {
        throw new Error(`Failed to fetch diff: ${error.message}`);
    }
}

export async function fetchComments(owner: string, repo: string, prNumber: number): Promise<Comment[]> {
    const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

    try {
        const response = await axios.get(commentsUrl, {
            headers: {
                'User-Agent': 'AIP444-Lab-03',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        return response.data.map((item: any) => ({
            username: item.user.login,
            body: item.body,
            date: item.updated_at,
        }));
    } catch (error: any) {
        throw new Error(`Failed to fetch comments: ${error.message}`);
    }
}
