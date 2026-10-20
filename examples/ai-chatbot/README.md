# AI chatbot example

A Next.js chatbot built with `stream-chat-react` and its `stream-chat-react/ai-components` entry point
(streaming messages, AI state indicator, AI message composer, voice agent visualizations). Styles come from
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

## Voice mode

The waveform button in the composer opens voice mode: a hands-free conversation in which the AI agent is shown as a `VoiceGlow` and your microphone as a `VoiceWave`. It listens to you, sends what you said, and reads the answer aloud before listening again.

It needs a browser with the Web Speech API's `SpeechRecognition` (Chrome, Edge or Safari; the button is hidden elsewhere) and access to the microphone. Reading answers aloud uses `speechSynthesis`; where it is missing, the answer is only shown in the chat.

See [implementation.md](./implementation.md) for implementation notes.
