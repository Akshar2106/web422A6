# AI Code Review CLI Tool

A powerful CLI tool that uses multiple AI agents to perform comprehensive code reviews. It features specialized reviewers for Security and Maintainability, with a Lead Developer agent that synthesizes findings into a final report.

## Features

- **Git Mode**: Review staged changes automatically.
- **File Mode**: Review a specific file using the `--file` flag.
- **Verbose Mode**: Detailed execution logs via the `--verbose` flag.
- **Parallel Reviews**: Multiple AI agents working simultaneously.
- **Tool-Enabled Agents**: Agents can read files, search the codebase, and check git history.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your OpenRouter API Key:
   ```env
   OPENROUTER_API_KEY=your_key_here
   ```

## Usage

### Review Staged Changes
```bash
git add .
npx ts-node --transpile-only review.ts
```

### Review a Specific File
```bash
npx ts-node --transpile-only review.ts --file path/to/file.ts
```

### Verbose Mode
```bash
npx ts-node --transpile-only review.ts --verbose --file bad_code.ts
```

## Architecture

- **The Security Auditor**: Focuses on vulnerabilities and secrets.
- **The Maintainability Critic**: Focuses on clean code and naming conventions.
- **The Lead Developer**: Synthesizes reports and produces a final Markdown summary.
