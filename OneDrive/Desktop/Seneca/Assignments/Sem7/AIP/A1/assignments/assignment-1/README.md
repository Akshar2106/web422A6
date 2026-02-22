# AI Code Review CLI Tool

A powerful CLI tool that uses multiple AI agents to review your code. Built for AIP444 Assignment 1.

## Features
- **Git Mode:** Reviews staged changes (`git diff --staged`).
- **File Mode:** Reviews a specific file (`--file path/to/file`).
- **Verbose Mode:** Detailed logs of agent thoughts and tool calls (`--verbose`).
- **Parallel Reviewers:** Uses "The Security Auditor" and "The Maintainability Critic" in parallel.
- **Lead Developer Synthesis:** Merges agent findings into a single Markdown report.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Create a `.env` file and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   ```

## Usage

### Review Staged Changes (Git Mode)
```bash
git add .
npx ts-node --transpile-only review.ts
```

### Review a Specific File (File Mode)
```bash
npx ts-node --transpile-only review.ts --file bad_code.ts
```

### Enable Verbose Logging
```bash
npx ts-node --transpile-only review.ts --verbose --file bad_code.ts
```

## Architecture
- **Phase 1:** Two parallel requests to Gemini (via OpenRouter) with specialized personas.
- **Phase 2:** A third "Judge" model synthesizes the JSON outputs into the final report.
- **Tools:** Agents have access to `read_file`, `grep_codebase`, and `get_file_history`.
