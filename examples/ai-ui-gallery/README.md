# AI UI gallery

Every A2UI basic component, an OpenUI reply, a reply that finishes without a text reply and two approval cards, in `AIConversation`, for checking how generated UI is themed. It needs no Stream credentials.

Each page is one cell: `?theme=light|dark&wrapper=inside|outside&tokens=default|app`.

- `wrapper=inside` renders in a `.str-chat` element with the SDK's theme class, as a Stream app does. `outside` renders without one, as an app that uses only the AI components does: each AI component then carries the `str-chat` scope itself, with no theme class, since there is no `Chat`, so it is the SDK's light theme.
- `tokens=app` themes the AI components with the SDK's tokens, a purple brand in light and dark (`src/gallery.css`), set on each `.str-chat` scope as an app sets them for the rest of the SDK.

```bash
yarn build                 # at the repo root: the gallery renders dist/
yarn start:ai-ui-gallery   # http://localhost:5177
```

`yarn workspace @stream-io/stream-chat-react-ai-ui-gallery screenshots [outDir]`, with the gallery running, screenshots every cell with the installed Google Chrome and checks every text, including inputs and what A2UI's elements draw in their shadow roots, for 4.5:1 against what is painted under it. It exits non-zero and lists each text that falls short.
