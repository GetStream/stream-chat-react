# AI chatbot example

A Next.js chatbot built with `stream-chat-react` and its `stream-chat-react/ai-components` entry point
(streaming messages, AI state indicator, AI message composer). Styles come from
`stream-chat-react/css/ai-components.css`.

## Getting started

From the repository root:

```bash
yarn install
yarn build        # the SDK must be built first: the example consumes `dist` through package `exports`
cp examples/ai-chatbot/.env.example examples/ai-chatbot/.env.local
# fill in STREAM_API_KEY and STREAM_API_SECRET in .env.local
yarn start:ai-chatbot
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

- `STREAM_API_KEY`, `STREAM_API_SECRET` - credentials of your Stream app (server-side only, never commit them).
- `NEXT_PUBLIC_AI_SERVER_URL` (optional) - URL of your own AI agent server; defaults to the hosted demo server.

See [implementation.md](./implementation.md) for implementation notes.
