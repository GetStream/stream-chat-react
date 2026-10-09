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
- `NEXT_PUBLIC_AI_SERVER_URL` (optional) - URL of your own AI agent server; defaults to Stream's hosted demo server.

The hosted demo server only answers for channels of Stream's demo app. With your own `STREAM_API_KEY` /
`STREAM_API_SECRET` the AI agent never joins your channels, so run your own AI agent server (it must
expose `POST /start-ai-agent` and `POST /summarize`, as called from `src/components/api.ts`) and point `NEXT_PUBLIC_AI_SERVER_URL` at it.

See [implementation.md](./implementation.md) for implementation notes.
