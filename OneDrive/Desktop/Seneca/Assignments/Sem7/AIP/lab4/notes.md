# Introduction to Hono

Hono is a small, simple, and ultrafast web framework for the Edges. It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, Lagon, AWS Lambda, Node.js, and others.

## Features

- **Ultrafast**: The router is incredibly fast using a trie-based structure.
- **Lightweight**: Zero dependencies and small bundle size.
- **Web Standards**: Built on Web Standards (Fetch API).
- **TypeScript**: First-class TypeScript support.

## Usage

You can create an app instance and define routes.
```ts
const app = new Hono()
app.get('/', (c) => c.text('Hello Hono!'))
```
