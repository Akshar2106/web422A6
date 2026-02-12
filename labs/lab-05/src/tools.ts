import axios from 'axios';

export async function getGitHubFile(
    owner: string,
    repo: string,
    filepath: string,
    ref: string = 'main',
    maxLines: number = 500
): Promise<string> {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filepath}`;

    try {
        const response = await axios.get(url, {
            responseType: 'text',
            validateStatus: (status) => status === 200 // Only resolve for 200 OK
        });

        const content = response.data;
        const lines = content.split('\n');

        if (lines.length > maxLines) {
            const truncatedContent = lines.slice(0, maxLines).join('\n');
            return `${truncatedContent}\n\n[File truncated: showing first ${maxLines} of ${lines.length} lines]`;
        }

        return content;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                return `Error: File not found at ${url}. Please check:
1. The repository is public.
2. The file path is correct.
3. The branch/ref '${ref}' exists.`;
            }
            return `Error fetching file: ${error.message}`;
        }
        return `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
    }
}
