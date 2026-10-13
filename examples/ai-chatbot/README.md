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

## v15 notes

- **Token signing.** The server signs the user token itself, in `src/app/createUserToken.ts` (HS256), because `stream-chat` v10 is a client-side SDK with no server-side `createToken`. For production, use one of Stream's server SDKs instead.
- **One copy of `@stream-io/state-store`.** The example keeps `installConfig.hoistingLimits: workspaces`, so the app installs its own `stream-chat` and `@stream-io/state-store` while the linked `stream-chat-react` workspace resolves the copies at the repository root. `stream-chat`, `@stream-io/i18n` and `stream-chat-react` hand each other store instances, so exactly one copy of `@stream-io/state-store` must be loaded. The app dedupes `stream-chat` and `@stream-io/state-store` through the Turbopack `resolveAlias` in `next.config.ts` plus the matching `paths` in `tsconfig.json`.
- **Sidebar pagination.** The sidebar uses infinite scroll: v15's `ChannelList` has no load-more button.

See [implementation.md](./implementation.md) for implementation notes.
