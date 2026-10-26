# AI components (`stream-chat-react/ai-components`)

AI-first building blocks for Stream Chat: a message composer with attachments and speech-to-text, a Markdown renderer with syntax highlighting and Chart.js support, a typewriter-style streaming message and an "AI is thinking" indicator.

These components used to ship as the separate package `@stream-io/chat-react-ai`. They now live in `stream-chat-react` behind the optional entry point `stream-chat-react/ai-components`, with a stylesheet at `stream-chat-react/css/ai-components.css`. The main entry point (`stream-chat-react`) never imports from this plugin, so apps that do not use it pay nothing for it.

## Installation

Requires the first `stream-chat-react` **v15** release that includes `ai-components` (expected `15.0.0-rc.N`; the exact number is set by semantic-release). On v14 the entry ships from 14.13.0.

```bash
yarn add stream-chat-react@rc stream-chat@rc
```

The `rc` dist-tag resolves to the v15 release candidate of `stream-chat-react` and to the matching `stream-chat` v10 release candidate; plain `stream-chat-react` currently resolves to v14.

The runtime dependencies of the components (`chart.js`, `react-chartjs-2`, `react-syntax-highlighter`, `zod`) come with `stream-chat-react`; you do not need to install them.

```tsx
import {
  AIMarkdown,
  AIMessageComposer,
  StreamingMessage,
} from 'stream-chat-react/ai-components';
import 'stream-chat-react/css/ai-components.css';
```

Load `ai-components.css` in addition to `stream-chat-react/css/index.css`.

## What is exported

From `stream-chat-react/ai-components`:

- Components: `AIMarkdown`, `AIMessageComposer` (with the static sub-components `FileInput`, `TextInput`, `SpeechToTextButton`, `SubmitButton`, `ModelSelect`, `AttachmentPreview`, `AttachmentPreview.Item`), `StreamingMessage`, `AIStateIndicator`, `VoiceWave`, `VoiceGlow`
- Hooks: `useAttachments`, `useText`, `useIsDisabled`, `useAIMessageComposerContext`, `useSpeechToText`, `useAudioLevel`
- Types: `AIMessageComposerStore`, `StreamingMessageRef`, `UseMessageTextStreamingProps`, `ToolComponentProps`, `UseSpeechToTextOptions`, `VoiceAgentState`, `VoiceGlowRendering`, `VoiceVisualizationProps`, `VoiceWaveProps`, `VoiceGlowProps`

`useMessageTextStreaming` is not exported from here; import it from the main entry point (`stream-chat-react`).

## Migrating from `@stream-io/chat-react-ai`

### 1. Dependencies

Remove `@stream-io/chat-react-ai`. Remove `material-symbols` too if it was only installed for these components (they use `stream-chat-react` icons now). Upgrade `stream-chat-react` to the first release that includes `ai-components`.

### 2. Imports

| Before                                      | After                                     |
| ------------------------------------------- | ----------------------------------------- |
| `@stream-io/chat-react-ai`                  | `stream-chat-react/ai-components`         |
| `@stream-io/chat-react-ai/styles/index.css` | `stream-chat-react/css/ai-components.css` |

```diff
-import { AIMarkdown, AIMessageComposer } from '@stream-io/chat-react-ai';
-import '@stream-io/chat-react-ai/styles/index.css';
+import { AIMarkdown, AIMessageComposer } from 'stream-chat-react/ai-components';
+import 'stream-chat-react/css/ai-components.css';
```

### 3. Class names and CSS custom properties

All `aicr__` prefixes were renamed to the `str-chat__ai-` namespace. The rule: `aicr__ai-…` becomes `str-chat__ai-…`; every other `aicr__…` becomes `str-chat__ai-…`; custom properties `--aicr__…` become `--str-chat__ai-…`. If you target these classes in your own CSS, update them with the table below.

Classes (and the two keyframes, `thinking` and `text-fade`):

| Old (`@stream-io/chat-react-ai`)                  | New (`stream-chat-react/ai-components`)                 |
| ------------------------------------------------- | ------------------------------------------------------- |
| `aicr__ai-message-composer__form`                 | `str-chat__ai-message-composer__form`                   |
| `aicr__ai-message-composer__round-button`         | `str-chat__ai-message-composer__round-button`           |
| `aicr__ai-message-composer__round-button--active` | `str-chat__ai-message-composer__round-button--active`   |
| `aicr__ai-message-composer__select`               | `str-chat__ai-message-composer__select`                 |
| `aicr__ai-message-composer__text-input`           | `str-chat__ai-message-composer__text-input`             |
| `aicr__attachment-preview`                        | `str-chat__ai-attachment-preview`                       |
| `aicr__attachment-preview__delete-button`         | `str-chat__ai-attachment-preview__delete-button`        |
| `aicr__attachment-preview__failed-state-overlay`  | `str-chat__ai-attachment-preview__failed-state-overlay` |
| `aicr__attachment-preview__file-metadata`         | `str-chat__ai-attachment-preview__file-metadata`        |
| `aicr__attachment-preview__file-name`             | `str-chat__ai-attachment-preview__file-name`            |
| `aicr__attachment-preview__file-size`             | `str-chat__ai-attachment-preview__file-size`            |
| `aicr__attachment-preview__image`                 | `str-chat__ai-attachment-preview__image`                |
| `aicr__attachment-preview__item`                  | `str-chat__ai-attachment-preview__item`                 |
| `aicr__attachment-preview__item--failed`          | `str-chat__ai-attachment-preview__item--failed`         |
| `aicr__attachment-preview__item--pending`         | `str-chat__ai-attachment-preview__item--pending`        |
| `aicr__attachment-preview__item--uploaded`        | `str-chat__ai-attachment-preview__item--uploaded`       |
| `aicr__attachment-preview__item--uploading`       | `str-chat__ai-attachment-preview__item--uploading`      |
| `aicr__attachment-preview__item-content`          | `str-chat__ai-attachment-preview__item-content`         |
| `aicr__attachment-preview__retry-button`          | `str-chat__ai-attachment-preview__retry-button`         |
| `aicr__chart`                                     | `str-chat__ai-chart`                                    |
| `aicr__chart--loading`                            | `str-chat__ai-chart--loading`                           |
| `aicr__code`                                      | `str-chat__ai-code`                                     |
| `aicr__pre`                                       | `str-chat__ai-pre`                                      |
| `aicr__state-indicator`                           | `str-chat__ai-state-indicator`                          |
| `aicr__state-indicator__content`                  | `str-chat__ai-state-indicator__content`                 |
| `aicr__state-indicator__dot`                      | `str-chat__ai-state-indicator__dot`                     |
| `aicr__state-indicator__dots`                     | `str-chat__ai-state-indicator__dots`                    |
| `aicr__state-indicator__text`                     | `str-chat__ai-state-indicator__text`                    |
| `aicr__streaming-message`                         | `str-chat__ai-streaming-message`                        |
| `aicr__syntax-highlighter-code`                   | `str-chat__ai-syntax-highlighter-code`                  |
| `aicr__syntax-highlighter-pre`                    | `str-chat__ai-syntax-highlighter-pre`                   |
| `aicr__text-fade`                                 | `str-chat__ai-text-fade`                                |
| `aicr__thinking`                                  | `str-chat__ai-thinking`                                 |

Custom properties:

| Old                           | New                                  |
| ----------------------------- | ------------------------------------ |
| `--aicr__bg-primary`          | `--str-chat__ai-bg-primary`          |
| `--aicr__bg-secondary`        | `--str-chat__ai-bg-secondary`        |
| `--aicr__bg-tertiary`         | `--str-chat__ai-bg-tertiary`         |
| `--aicr__syntax-comment`      | `--str-chat__ai-syntax-comment`      |
| `--aicr__syntax-cyan`         | `--str-chat__ai-syntax-cyan`         |
| `--aicr__syntax-error`        | `--str-chat__ai-syntax-error`        |
| `--aicr__syntax-function`     | `--str-chat__ai-syntax-function`     |
| `--aicr__syntax-keyword`      | `--str-chat__ai-syntax-keyword`      |
| `--aicr__syntax-number`       | `--str-chat__ai-syntax-number`       |
| `--aicr__syntax-punctuation`  | `--str-chat__ai-syntax-punctuation`  |
| `--aicr__syntax-selection-bg` | `--str-chat__ai-syntax-selection-bg` |
| `--aicr__syntax-string`       | `--str-chat__ai-syntax-string`       |
| `--aicr__syntax-tag`          | `--str-chat__ai-syntax-tag`          |
| `--aicr__syntax-text`         | `--str-chat__ai-syntax-text`         |
| `--aicr__syntax-whitespace`   | `--str-chat__ai-syntax-whitespace`   |
| `--aicr__text-primary`        | `--str-chat__ai-text-primary`        |
| `--aicr__text-secondary`      | `--str-chat__ai-text-secondary`      |

### 4. `useMessageTextStreaming`

The hook is no longer exported from the AI package. Import it from `stream-chat-react` and rename the `letterIntervalMs` option to `streamingLetterIntervalMs`:

```diff
-import { useMessageTextStreaming } from '@stream-io/chat-react-ai';
+import { useMessageTextStreaming } from 'stream-chat-react';

 const { streamedMessageText } = useMessageTextStreaming({
   text,
-  letterIntervalMs: 30,
+  streamingLetterIntervalMs: 30,
 });
```

`UseMessageTextStreamingProps` is the `StreamingMessage` props type (the name is kept for compatibility). The component props are unchanged (`text`, `letterIntervalMs`, `renderingLetterCount`, and a ref exposing `skipAnimation`).

### 5. Two `AIStateIndicator` components

- `AIStateIndicator` from `stream-chat-react` is channel-bound: it reads the AI state events of the current channel and renders accordingly.
- `AIStateIndicator` from `stream-chat-react/ai-components` is presentational: it takes an optional `text` prop and renders the animated indicator. Without `text` it shows a random "thinking" phrase.

Use the first one to react to channel AI state, the second when you drive the text yourself.

### 6. Icons

The components now render `stream-chat-react` icons (`IconPlus`, `IconXmark`, `IconRetry`, `IconMicrophoneSolid`, `IconSend`, `IconFile`) instead of Material Symbols. Override them like any other SDK icon:

```tsx
import { WithComponents } from 'stream-chat-react';

<WithComponents overrides={{ icons: { IconSend: MySendIcon } }}>
  <AIMessageComposer>{/* … */}</AIMessageComposer>
</WithComponents>;
```

### 7. Internationalization

All strings go through `t()` with namespaced keys and inline English defaults, like the rest of `stream-chat-react` v15. English is the only bundled language. To translate the components, register a dictionary on your `Streami18n` instance (`i18n.registerTranslation(lang, dict)`), exactly as for the core SDK keys (see `ai-docs/i18n-v15-migration.md`). Inside `<Chat>` the active language is used.

Outside `<Chat>` (or a `TranslationProvider`), `t()` is the default translator, which renders each call site's inline English copy. There are no raw keys and nothing to wrap: the labels read `Send`, `File upload` and so on.

Every key the components use:

| Key                                                           | English                        | v14 key                          |
| ------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| `aiComponents.attachmentPreview.deleteAttachment.ariaLabel`   | Delete attachment              | `Delete attachment`              |
| `aiComponents.attachmentPreview.unknownFileName.text`         | Unknown file name              | `Unknown file name`              |
| `aiComponents.chart.loading.text`                             | Loading chart...               | `Loading chart...`               |
| `aiComponents.chart.unknownType.text`                         | Unknown chart type             | `Unknown chart type`             |
| `aiComponents.messageComposer.speechToText.ariaLabel`         | Start voice input              | `aria/Start voice input`         |
| `aiComponents.messageComposer.textInput.placeholder`          | Ask a question...              | `Ask a question...`              |
| `aiComponents.stateIndicator.brewingUpAnAnswer.text`          | Brewing up an answer           | `Brewing up an answer`           |
| `aiComponents.stateIndicator.channelingMyInnerEinstein.text`  | Channeling my inner Einstein   | `Channeling my inner Einstein`   |
| `aiComponents.stateIndicator.connectingTheDots.text`          | Connecting the dots            | `Connecting the dots`            |
| `aiComponents.stateIndicator.consultingTheAiGods.text`        | Consulting the AI gods         | `Consulting the AI gods`         |
| `aiComponents.stateIndicator.cookingUpSomethingGood.text`     | Cooking up something good      | `Cooking up something good`      |
| `aiComponents.stateIndicator.crunchingTheNumbers.text`        | Crunching the numbers          | `Crunching the numbers`          |
| `aiComponents.stateIndicator.firingUpTheNeurons.text`         | Firing up the neurons          | `Firing up the neurons`          |
| `aiComponents.stateIndicator.puttingOnMyThinkingCap.text`     | Putting on my thinking cap     | `Putting on my thinking cap`     |
| `aiComponents.stateIndicator.readingTheDigitalTeaLeaves.text` | Reading the digital tea leaves | `Reading the digital tea leaves` |
| `aiComponents.stateIndicator.summoningMyInnerGenius.text`     | Summoning my inner genius      | `Summoning my inner genius`      |
| `aiComponents.stateIndicator.thinkingReallyHard.text`         | Thinking really hard           | `Thinking really hard`           |
| `aiComponents.stateIndicator.workingMyMagic.text`             | Working my magic               | `Working my magic`               |
| `aiComponents.voiceVisualization.connecting.text`             | Connecting                     | `Connecting`                     |
| `aiComponents.voiceVisualization.listening.text`              | Listening                      | `Listening`                      |
| `aiComponents.voiceVisualization.ready.text`                  | Ready                          | `Ready`                          |
| `aiComponents.voiceVisualization.speaking.text`               | Speaking                       | `Speaking`                       |
| `aiComponents.voiceVisualization.thinking.text`               | Thinking                       | `Thinking`                       |
| `aiComponents.voiceVisualization.voiceAgent.ariaLabel`        | Voice agent: {{ state }}       | `aria/Voice agent: {{ state }}`  |
| `messageComposer.sendButton.send.ariaLabel` (core)            | Send                           | `aria/Send`                      |
| `fileUpload.uploadButton.fileUpload.ariaLabel` (core)         | File upload                    | `aria/File upload`               |
| `common.retryUpload.ariaLabel` (core)                         | Retry upload                   | `aria/Retry upload`              |

The last three are core `stream-chat-react` keys that the components reuse, so a translation you already registered for them applies here too. `ai-docs/i18n-v15-key-map.json` maps each v14 key to its v15 key.

## Migrating from `stream-chat-react` v14

If you already use `stream-chat-react/ai-components` on v14 (shipped from 14.13.0; `VoiceWave`, `VoiceGlow` and `useAudioLevel` from 14.14.0), the component API is identical on v15: same exports, props, class names and theming contract. Only the i18n keys changed. v14 used the English sentence (or an `aria/…` string) as the key; v15 uses namespaced keys. If you registered translations for these components, rename them with the table above or with `ai-docs/i18n-v15-key-map.json`. If you never translated them, there is nothing to do.

v15 bundles English only. If your app runs in another language and relied on the translations v14 shipped for these components, those strings now fall back to English on v15 until you register translations yourself with `i18n.registerTranslation(lang, dict)`. The v14 values live in the 14.x `src/i18n/*.json` files; the voice keys first appear in 14.14.0, so read them from that release or later (for example `git show v14.14.0:src/i18n/de.json`); map the keys with the table above or `ai-docs/i18n-v15-key-map.json`.

## Theming

The library never declares the `--str-chat__ai-*` custom properties. Each rule reads them with fallbacks:

```css
var(--str-chat__ai-bg-primary, var(--str-chat__background-core-elevation-0, #ffffff))
```

Precedence for every token except the code palette is: your `--str-chat__ai-*` override, then the `stream-chat-react` theme token (inside `.str-chat`, so the SDK light/dark themes apply automatically), then a built-in light literal (outside `.str-chat`). The `--str-chat__ai-syntax-*` palette has no SDK theme token: it falls back directly from your override to a built-in literal. Because nothing is declared by the library, overrides work at any scope, including `:root`.

| Token (`--str-chat__ai-…`) | Used for                                                | SDK theme token (`--str-chat__…`) | Literal fallback |
| -------------------------- | ------------------------------------------------------- | --------------------------------- | ---------------- |
| `bg-primary`               | code block background                                   | `background-core-elevation-0`     | `#ffffff`        |
| `bg-secondary`             | not read by the built-in rules (kept for compatibility) | `background-core-surface-default` | `#f7f7f8`        |
| `bg-tertiary`              | not read by the built-in rules (kept for compatibility) | `background-core-surface-strong`  | `#ececf1`        |
| `text-primary`             | not read by the built-in rules (kept for compatibility) | `text-primary`                    | `#353740`        |
| `text-secondary`           | AI state indicator text and dots                        | `text-secondary`                  | `#565869`        |
| `border`                   | composer, model select and attachment borders           | `border-core-default`             | `#ccc`           |
| `border-subtle`            | table row separators                                    | `border-core-subtle`              | `#e9ecef`        |
| `surface-hover`            | composer round-button hover                             | `background-utility-hover`        | `#e8e8e8`        |
| `surface-pressed`          | pressed (listening) speech-to-text button               | `background-utility-selected`     | `#d1eaff`        |
| `button-bg`                | attachment delete/retry buttons                         | `background-core-surface-strong`  | `#e8e8e8`        |
| `inline-code-bg`           | inline code in `StreamingMessage`                       | `background-core-surface-default` | `#f5f5f5`        |
| `table-border`             | table header borders                                    | `border-core-default`             | `#dee2e6`        |
| `table-header-bg`          | table header and row hover background                   | `background-core-surface-subtle`  | `#f8f9fa`        |
| `table-header-text`        | table header text                                       | `text-primary`                    | `#212529`        |
| `table-text`               | table cell text                                         | `text-secondary`                  | `#495057`        |
| `scrollbar-track`          | attachment list scrollbar track                         | `background-core-surface-subtle`  | `#f1f1f1`        |
| `scrollbar-thumb`          | attachment list scrollbar thumb                         | `border-core-default`             | `#ddd`           |
| `voice-color`              | `VoiceWave` / `VoiceGlow` color when `colors` is unset  | `accent-primary`                  | `#005fff`        |
| `voice-backdrop`           | what `VoiceWave` / `VoiceGlow` sit on (light or dark)   | `background-core-elevation-0`     | `#ffffff`        |
| `syntax-*`                 | code palette (see below)                                | none                              | built-in palette |

The code palette tokens are `--str-chat__ai-syntax-text`, `-selection-bg`, `-comment`, `-punctuation`, `-number`, `-keyword`, `-tag`, `-string`, `-function`, `-cyan`, `-error` and `-whitespace`.

Focus rings use the SDK focus token `--str-chat__border-utility-focused` (falling back to `#005fff` outside `.str-chat`). Icons inside the composer and attachment previews are sized and coloured (`currentColor`) by `ai-components.css` itself.

```css
:root {
  --str-chat__ai-bg-secondary: #101828;
  --str-chat__ai-text-primary: #f2f4f7;
  --str-chat__ai-syntax-keyword: #c084fc;
}
```

## Notes

- Server-side rendering: the components render under SSR (for example Next.js). This relies on a fix in the SDK's `useStateStore`, which now provides `getServerSnapshot`.
- The Chart.js renderer is lazy-loaded; a fallback ("Loading chart...") is shown while it loads. If the chunk fails to load or Chart.js throws, the block falls back to the raw code instead of breaking the message.
- `AIMessageComposer` attachment `meta` remains `Record<string, any>`.

## Example app

`examples/ai-chatbot` in the `stream-chat-react` repository is a Next.js app built on these components. Copy `examples/ai-chatbot/.env.example` to `examples/ai-chatbot/.env.local`, fill in the Stream credentials, then run `yarn build` followed by `yarn start:ai-chatbot` from the repository root.

# Component reference

## Components

### `AIMessageComposer`

The `AIMessageComposer` gives users a complete message composer component with support for text input, file attachments, speech-to-text, and model selection.

```tsx
import { AIMessageComposer } from 'stream-chat-react/ai-components';

function ChatComposer({ attachments }: ChatComposerProps) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    // Handle submission
  };

  return (
    <AIMessageComposer onSubmit={handleSubmit}>
      <AIMessageComposer.FileInput name='attachments' />
      <AIMessageComposer.TextInput name='message' />
      <AIMessageComposer.SpeechToTextButton />
      <AIMessageComposer.ModelSelect name='model' />
      <AIMessageComposer.SubmitButton />
      <AIMessageComposer.AttachmentPreview>
        {attachments.map((attachment) => (
          <AIMessageComposer.AttachmentPreview.Item key={attachment.id} {...attachment} />
        ))}
      </AIMessageComposer.AttachmentPreview>
    </AIMessageComposer>
  );
}
```

#### Sub-components

- **`AIMessageComposer.FileInput`** - File input button for attaching files. Supports multiple file selection. The native `<input type="file">` is visually hidden but stays focusable (it is the keyboard stop, labelled with the `fileUpload.uploadButton.fileUpload.ariaLabel` string, "File upload", and opens the picker on Enter/Space); the round `<label>` that follows it is the pointer target and shows its focus ring. `labelProps` are spread onto that label.
- **`AIMessageComposer.TextInput`** - Text input field for typing messages. Automatically syncs with composer state.
- **`AIMessageComposer.SpeechToTextButton`** - Button to toggle speech-to-text input using the Web Speech API.
- **`AIMessageComposer.SubmitButton`** - Submit button for sending the message.
- **`AIMessageComposer.ModelSelect`** - Dropdown for selecting AI models. Customizable via `options` prop.
- **`AIMessageComposer.AttachmentPreview`** - Preview container for attached files.
- **`AIMessageComposer.AttachmentPreview.Item`** - Preview item component, renders a different look for file types that begin with `image/`.

#### Props

| Name                       | Type                                         | Required | Description                                                                                                                                                                                               |
| -------------------------- | -------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resetAttachmentsOnSelect` | `boolean`                                    | no       | Resets file input after selection. Defaults to `true`.                                                                                                                                                    |
| `nameMapping`              | `{ message?: string; attachments?: string }` | no       | Maps custom input names to internal state. By default, the composer expects inputs named `message` (for text) and `attachments` (for files). Use this prop to map different names to these internal keys. |
| `onSubmit`                 | `(e: FormEvent<HTMLFormElement>) => void`    | no       | Form submission handler.                                                                                                                                                                                  |
| `onChange`                 | `(e: FormEvent<HTMLFormElement>) => void`    | no       | Form change handler.                                                                                                                                                                                      |
|                            | `...HTMLFormElement props`                   | no       | Supports all standard HTML form element props.                                                                                                                                                            |

> [!NOTE]
> Some default input components come with default `name` attributes (`TextInput` defaults to `"message"`, `FileInput` defaults to `"attachments"`). You can override these names via props, and use the `nameMapping` prop to tell the composer how to map your custom names to its internal state.

### `AIMarkdown`

The `AIMarkdown` is a markdown renderer optimized for AI-generated content with syntax highlighting and custom tool component support.

#### Props

| Name                 | Type                 | Required | Description                                                  |
| -------------------- | -------------------- | -------- | ------------------------------------------------------------ |
| `children`           | `string`             | yes      | The markdown content to render.                              |
| `toolComponents`     | `ToolComponents`     | no       | Custom components for rendering tool outputs (e.g., charts). |
| `markdownComponents` | `MarkdownComponents` | no       | Custom markdown component overrides.                         |

#### Built-in Tool Components

- **`chartjs`** - Renders Chart.js visualizations from code blocks with `language-chartjs` or `language-json` if it matches supported Chart.js data schema.

#### Example

```tsx
import { AIMarkdown } from 'stream-chat-react/ai-components';

function MessageContent({ content }) {
  return <AIMarkdown>{content}</AIMarkdown>;
}
```

### `VoiceWave` and `VoiceGlow`

Two animated visualizations of a voice agent, the web counterparts of `AIVoiceWave` and `AIVoiceGlow` in the Android and iOS AI components, with the same motion. `VoiceWave` is a single string carrying a wave packet that erupts with speech; `VoiceGlow` is a soft globe whose color masses orbit inside it and swell with speech.

Both draw on a `<canvas>` inside a `div` with `role="img"` and an accessible name such as "Voice agent: Speaking". They have no size of their own and draw in the middle of the box they are given (`VoiceWave` about 80% as wide as the shorter side, `VoiceGlow` about half), so size them with CSS. The defaults are `width: 100%; height: 8rem` for the wave and `12rem` square for the glow. The wave's line is as thick as on Android and iOS, 0.6% of the shorter side and never under 1.5 device pixels, and drawn at the screen's own density up to 3x; the soft glow is drawn at 1x, which looks the same at a fraction of the cost.

#### Props

| Name           | Type                                                                | Required | Description                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state`        | `'idle' \| 'connecting' \| 'listening' \| 'thinking' \| 'speaking'` | yes      | What the agent is doing. The states differ only in motion, never in color, and a change eases from one motion into the next.                                                                                                      |
| `colors`       | `string[]`                                                          | no       | One to five CSS colors, flowing through the shape. Past five are ignored. When omitted or empty, `--str-chat__ai-voice-color` is used, which follows the SDK accent color.                                                        |
| `expressivity` | `number`                                                            | no       | From 0 to 2: how far and how fast it moves. Defaults to 1.                                                                                                                                                                        |
| `audioLevel`   | `() => number \| null \| undefined`                                 | no       | The level of whoever is talking, from 0 to 1, read once a frame, so a level changing many times a second re-renders nothing. Returning `null` (or omitting it) animates speech on its own.                                        |
| `rendering`    | `'auto' \| 'css'`                                                   | no       | `VoiceGlow` only. `auto` (default) draws with a WebGL shader and falls back to `css` when WebGL is unavailable or its context is lost; `css` builds the glow from CSS gradients animated by the browser's compositor (see below). |

Any other `div` prop (`className`, `style`, event handlers, ...) is passed to the root. Only the shape takes the pointer, as on iOS: the globe (within 0.32 of the shorter side from the centre) or the string. Elsewhere in the box, clicks and hovers reach whatever is behind it. On the shape, pointer events are watched and never stopped: a tap bounces it and a hovering mouse or pen ripples it, while your own `onClick` on the root or a parent still fires.

Behavior:

- The animation runs only while the element is on screen and the tab is visible.
- Every WebGL glow on a page draws with one shared WebGL context, so the shader compiles once and a page with many glows stays under the browser's limit on live contexts.
- It fades in over 0.3 s once its first frame is drawn (instantly with reduced motion), so it never flashes empty while a shader compiles.
- With `prefers-reduced-motion: reduce`, the motion slows to a crawl and taps and hover are ignored.
- The palette and the light or dark look follow the theme (`--str-chat__ai-voice-color` and `--str-chat__ai-voice-backdrop`), re-read about once a second, so a theme switch needs no prop.
- `VoiceWave` moves as on Android and iOS, smoothed for speech: its height rises quickly and settles slowly, its syllables swing it a little less, and as it grows its crests spread out rather than steepen into spikes. While idle, connecting or thinking it is the native wave exactly.

`rendering='css'`, also the fallback when WebGL is unavailable, composes the glow the way the shader does, as gradients that are painted once and animated only through `transform` and `opacity`, so the browser's compositor runs the motion. It keeps moving while the main thread is busy (for example while a long answer streams in), needs no canvas or WebGL, and runs no script per frame unless `audioLevel` is given. It lacks the shader's fine marbling and its second, fainter riding mass: a tap bounces the glow and sends out a ring instead of a ripple, and a hovering pointer does nothing. Off screen, its animations pause. It needs `@property`, container query units and `color-mix()` (Chrome 111, Safari 16.4, Firefox 128 and later).

- Under SSR the markup is rendered and drawing starts after hydration.

#### Example

```tsx
import { useEffect, useState } from 'react';
import {
  useAudioLevel,
  type VoiceAgentState,
  VoiceGlow,
  VoiceWave,
} from 'stream-chat-react/ai-components';

const VoiceAgent = ({ state }: { state: VoiceAgentState }) => {
  const [mic, setMic] = useState<MediaStream | null>(null);
  const micLevel = useAudioLevel(mic);

  useEffect(() => {
    let stream: MediaStream | undefined;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((granted) => {
      stream = granted;
      setMic(granted);
    });
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, []);

  return (
    <>
      <VoiceGlow colors={['#005fff', '#7c3aed']} state={state} />
      <VoiceWave
        audioLevel={state === 'listening' ? micLevel : undefined}
        state={state}
      />
    </>
  );
};
```

### `StreamingMessage`

The `StreamingMessage` is a component that displays text with a typewriter animation effect, similar to ChatGPT. It's ideal for streaming AI responses. It's a simplified wrapper with typewriter animation effect around the `AIMarkdown` component.

#### Props

| Name                   | Type     | Required | Description                                                 |
| ---------------------- | -------- | -------- | ----------------------------------------------------------- |
| `text`                 | `string` | yes      | The text content to display with streaming effect.          |
| `letterIntervalMs`     | `number` | no       | Interval between character updates. Defaults to `30`.       |
| `renderingLetterCount` | `number` | no       | Number of characters to render per update. Defaults to `2`. |

The component accepts a `ref` (`StreamingMessageRef`) exposing `skipAnimation()`, which immediately shows the full text.

#### Example

```tsx
import { StreamingMessage } from 'stream-chat-react/ai-components';

function AIResponse({ text }) {
  return <StreamingMessage text={text} />;
}
```

### `AIMessageComposer.SpeechToTextButton`

A button for voice input using the Web Speech API, with a built-in microphone icon. It is a static sub-component of `AIMessageComposer` (not a named export) and must be rendered inside an `AIMessageComposer`: it writes the recognized transcript to the composer's text input through the composer context.

The button renders nothing in browsers without the Web Speech API (for example Firefox). Because support can only be detected in the browser, it also renders nothing during server rendering and appears after hydration.

#### Props

| Name      | Type                         | Required | Description                                                                                                                                                                                                                                                                                                                              |
| --------- | ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options` | `UseSpeechToTextOptions`     | no       | Passed to `useSpeechToText` (`lang`, `continuous`, `interimResults`, `maxAlternatives`). `onTranscript` is called in addition to updating the composer text. `onError` replaces the default error handling, which logs to `console.error`. Changing `lang` or another setting re-creates the recognizer; new callback identities do not. |
|           | `...HTMLButtonElement props` | no       | Supports all standard HTML button element props.                                                                                                                                                                                                                                                                                         |

#### Example

```tsx
import { AIMessageComposer } from 'stream-chat-react/ai-components';

function VoiceInputButton() {
  return (
    <AIMessageComposer>
      <AIMessageComposer.TextInput />
      <AIMessageComposer.SpeechToTextButton />
    </AIMessageComposer>
  );
}
```

### `AIMessageComposer.AttachmentPreview`

A static sub-component of `AIMessageComposer` (not a named export) for displaying file attachment previews with support for images and documents.

#### `AIMessageComposer.AttachmentPreview.Item` props

| Name                 | Type                                                 | Required | Description                                   |
| -------------------- | ---------------------------------------------------- | -------- | --------------------------------------------- |
| `file`               | `File`                                               | yes      | The file object to preview.                   |
| `state`              | `'uploading' \| 'finished' \| 'failed' \| 'pending'` | no       | Upload state indicator.                       |
| `title`              | `string`                                             | no       | Custom title (defaults to filename).          |
| `imagePreviewSource` | `string`                                             | no       | Custom image preview URL.                     |
| `onDelete`           | `(e: MouseEvent) => void`                            | no       | Delete button handler.                        |
| `onRetry`            | `(e: MouseEvent) => void`                            | no       | Retry button handler (shown on failed state). |

#### Example

```tsx
import { AIMessageComposer } from 'stream-chat-react/ai-components';

function CustomAttachmentPreview({ attachments }: CustomAttachmentPreviewProps) {
  return (
    <AIMessageComposer.AttachmentPreview>
      {attachments.map((attachment) => (
        <AIMessageComposer.AttachmentPreview.Item
          key={attachment.id}
          file={attachment.file}
          onDelete={() => removeAttachment(attachment.id)}
        />
      ))}
    </AIMessageComposer.AttachmentPreview>
  );
}
```

## Hooks

### `useAttachments` (experimental)

Manage attachments within the composer context. **Must be used within an `AIMessageComposer` component.**

#### Returns

| Name                | Type                                                            | Description                 |
| ------------------- | --------------------------------------------------------------- | --------------------------- |
| `attachments`       | `Array<{ id: string; file: File; meta?: Record<string, any> }>` | Current attachments.        |
| `removeAttachment`  | `(idOrFile: string \| File) => void`                            | Remove an attachment.       |
| `updateAttachments` | `(ids: Array<string \| Attachment>, updater: Function) => void` | Update attachment metadata. |

#### Example

```tsx
import { useAttachments } from 'stream-chat-react/ai-components';

function AttachmentManager() {
  const { attachments, removeAttachment, updateAttachments } = useAttachments();

  const manageAttachment = (attachmentId: string) => {
    // Update attachment metadata
    updateAttachments([attachmentId], (attachment) => ({
      ...attachment,
      meta: { uploaded: true },
    }));

    // Remove an attachment by id or file
    removeAttachment(attachmentId);
  };

  return <div>{attachments.length} files attached</div>;
}
```

> [!NOTE]
> While this attachment API works it's highly recommended to use own attachment API or the one provided by the `stream-chat-react`/`stream-chat`.

### `useText`

Access and update the text input value. **Must be used within an `AIMessageComposer` component.**

#### Returns

| Name      | Type                     | Description         |
| --------- | ------------------------ | ------------------- |
| `text`    | `string`                 | Current text value. |
| `setText` | `(text: string) => void` | Update text value.  |

#### Example

```tsx
import { useText } from 'stream-chat-react/ai-components';

function CustomTextDisplay() {
  const { text, setText } = useText();

  return (
    <div>
      <p>Current text: {text}</p>
      <button onClick={() => setText('New text')}>Update</button>
    </div>
  );
}
```

### `useSpeechToText`

Enable voice input using the Web Speech API. Provides speech recognition capabilities with real-time transcription.

#### Props

| Name              | Type                      | Required | Description                                                                         |
| ----------------- | ------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `lang`            | `string`                  | no       | Language for speech recognition (e.g., 'en-US', 'es-ES'). Defaults to `'en-US'`.    |
| `interimResults`  | `boolean`                 | no       | Whether to return interim (partial) results. Defaults to `true`.                    |
| `maxAlternatives` | `number`                  | no       | Maximum number of alternative transcriptions. Defaults to `1`.                      |
| `continuous`      | `boolean`                 | no       | Whether recognition should continue after user stops speaking. Defaults to `false`. |
| `onTranscript`    | `(text: string) => void`  | no       | Callback when transcription text changes.                                           |
| `onError`         | `(error: string) => void` | no       | Callback when an error occurs.                                                      |

#### Returns

| Name             | Type         | Description                                             |
| ---------------- | ------------ | ------------------------------------------------------- |
| `isListening`    | `boolean`    | Whether speech recognition is currently active.         |
| `isSupported`    | `boolean`    | Whether the Web Speech API is supported in the browser. |
| `startListening` | `() => void` | Start speech recognition.                               |
| `stopListening`  | `() => void` | Stop speech recognition.                                |

#### Example

```tsx
import { useSpeechToText } from 'stream-chat-react/ai-components';

function VoiceInput() {
  const [transcript, setTranscript] = useState('');

  const { isListening, isSupported, startListening, stopListening } = useSpeechToText({
    lang: 'en-US',
    interimResults: true,
    onTranscript: (text) => setTranscript(text),
    onError: (error) => console.error('Speech recognition error:', error),
  });

  if (!isSupported) {
    return <div>Speech recognition is not supported in your browser</div>;
  }

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop' : 'Start'} Recording
      </button>
      <p>Transcript: {transcript}</p>
    </div>
  );
}
```

### `useAudioLevel`

Reads the live level of a `MediaStream`'s audio (a microphone from `getUserMedia({ audio: true })`, or a remote track) for the `audioLevel` prop of `VoiceWave` and `VoiceGlow`.

```ts
const useAudioLevel: (stream: MediaStream | null | undefined) => () => number | null;
```

It returns a stable getter that measures the level when called, from 0 to 1, so nothing re-renders as the level changes. It measures over the last 2048 samples (about 43 ms at 48 kHz), a few pitch periods of a voice, so the level holds steady through a vowel. The getter returns `null` while there is no stream or no Web Audio support. The audio graph is torn down when the stream changes and on unmount; the stream's tracks are left running, since they belong to you.

## Examples

### Basic Chat Interface

```tsx
import { AIMessageComposer } from 'stream-chat-react/ai-components';
import 'stream-chat-react/css/ai-components.css';

function ChatInterface() {
  const [attachments, setAttachments] = useState([]);

  const handleChange = (e) => {
    const input = e.currentTarget.elements.namedItem(
      'attachments',
    ) as HTMLInputElement | null;

    const files = input?.files ?? null;

    if (files) {
      // Send to your API
      uploadFiles(files).then((uploadedAttachments) =>
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...uploadedAttachments,
        ]),
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const message = formData.get('message');

    // Send to your API
    await sendMessage({ message });

    // Reset form
    e.target.reset();
  };

  return (
    <AIMessageComposer onChange={handleChange} onSubmit={handleSubmit}>
      <AIMessageComposer.AttachmentPreview>
        {attachments.map((attachment) => (
          <AIMessageComposer.AttachmentPreview.Item key={attachment.id} {...attachment} />
        ))}
      </AIMessageComposer.AttachmentPreview>
      <AIMessageComposer.FileInput name='attachments' />
      <AIMessageComposer.TextInput name='message' />
      <AIMessageComposer.SpeechToTextButton />
      <AIMessageComposer.ModelSelect name='model' />
      <AIMessageComposer.SubmitButton />
    </AIMessageComposer>
  );
}
```

### Custom Markdown Rendering

```tsx
import { AIMarkdown } from 'stream-chat-react/ai-components';

const customComponents = {
  h1: ({ children }) => <h1 className='custom-heading'>{children}</h1>,
  code: ({ children }) => (
    <AIMarkdown.default.code className='custom-class'>{children}</AIMarkdown.default.code>
  ),
};

const customToolComponents = {
  weather: ({ data, fallback }) => {
    try {
      const parsedData = JSON.parse(data);
      return <div className='weather-tool'>{parsedData.result}</div>;
    } catch {
      return fallback;
    }
  },
};

function CustomMarkdown({ content }) {
  return (
    <AIMarkdown
      markdownComponents={customComponents}
      toolComponents={customToolComponents}
    >
      {content}
    </AIMarkdown>
  );
}
```

### Streaming AI Response

```tsx
import { StreamingMessage } from 'stream-chat-react/ai-components';

function AIResponseStream({ response }) {
  return (
    <div className='ai-response'>
      <StreamingMessage text={response} />
    </div>
  );
}
```

<br />

<a href="https://getstream.io?utm_source=Github&utm_medium=Github_Repo_Content&utm_content=Developer&utm_campaign=Github_React_AI_SDK&utm_term=DevRelOss">
<img src="https://user-images.githubusercontent.com/24237865/138428440-b92e5fb7-89f8-41aa-96b1-71a5486c5849.png" alt="Stream" align="right" width="12%"/>
</a>
