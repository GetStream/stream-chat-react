# AI components (`stream-chat-react/ai-components`)

AI-first building blocks for Stream Chat: a message composer with attachments and speech-to-text, a Markdown renderer with syntax highlighting and Chart.js support, a typewriter-style streaming message, a hook that reveals text at the pace a voice agent speaks it, and an "AI is thinking" indicator.

These components used to ship as the separate package `@stream-io/chat-react-ai`. They now live in `stream-chat-react` behind the optional entry point `stream-chat-react/ai-components`, with a stylesheet at `stream-chat-react/css/ai-components.css`. The main entry point (`stream-chat-react`) never imports from this plugin, so apps that do not use it pay nothing for it.

## Installation

Requires the first `stream-chat-react` release that includes `ai-components` (expected 14.13.0; the exact number is set by semantic-release).

```bash
yarn add stream-chat-react stream-chat
```

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

- Components: `AIMarkdown`, `AIMessageComposer` (with the static sub-components `FileInput`, `TextInput`, `SpeechToTextButton`, `SubmitButton`, `ModelSelect`, `ChatOptions`, `AttachmentPreview`, `AttachmentPreview.Item`), `StreamingMessage`, `AIStateIndicator`, `VoiceWave`, `VoiceGlow`
- Agent conversations (see [Agent conversations](#agent-conversations)): `AIConversation`, `AIUserMessage`, `AIAssistantMessage`, `AIMessageAttachment`, `AIReplyActions`, `AITypingIndicator`, `AISuggestions`, `AIMessageParts`, `AIMessagePart`, `AIToolCall`, `AIToolApproval`, `AIToolApprovalCard`, `AIToolAuthorization`, `AIToolAuthorizationCard`, `AIReasoning`, `AIThinking`, `AIToolApproverProvider`, `ChatOptionsList`, `SelectedChatOptionChip`
- Functions: `parseMessageParts`, `parseMessagePart`, `isAwaitingApproval`, `isAwaitingAuthorization`, `isAwaitingClient`, `isDeclined`, `isToolCallFinished`, `isSupportedPart`, `isAuthorizationExpired`, `fromStreamMessage`, `createPopupAuthorizer`, `completeConnectorSignIn`, `readConnectorSignInResult`, `AIClientIdentity.installId()`
- Hooks: `useAttachments`, `useText`, `useIsDisabled`, `useAIMessageComposerContext`, `useSpeechToText`, `useAudioLevel`, `useHeardText`, `useAIToolApprover`
- Types: `AIMessageComposerStore`, `StreamingMessageRef`, `UseMessageTextStreamingProps`, `ToolComponentProps`, `UseSpeechToTextOptions`, `VoiceAgentState`, `VoiceGlowRendering`, `VoiceVisualizationProps`, `VoiceWaveProps`, `VoiceGlowProps`, `HeardTextProgress`, `HeardTextFunction`, `HeardTextSubscribe`, `UseHeardTextParams`, `UseHeardTextResult`, `AIMessage`, `AIMessageRole`, `AIPendingMessage`, `AIMessagePartData`, `AIReasoningPart`, `AIToolCallPart`, `AIToolApprovalData`, `AIToolAuthorizationData`, `AIToolApprover`, `AIToolAuthorizer`, `AIToolApprovalState`, `AIToolAuthorizationState`, `AIMessageAttachmentData`, `AIMessageRating`, `AIChatOption`, `PopupAuthorizerOptions`, `ConnectorSignInResult`

`useMessageTextStreaming` is not exported from here; import it from the main entry point (`stream-chat-react`).

## Agent conversations

The components of a conversation with an AI agent, such as a personal assistant, that mirror StreamChatAI (iOS) and `stream-chat-android-ai-compose` (Android): the same names, the same message parts, and the same behaviour, in React idiom. A web app built on them renders the same conversations as the iOS and Android apps.

> Until the `stream-chat-react` 14.x release that includes them is published, build the package from the `release-v14` branch and install the tarball: `yarn install && yarn build && npm pack`, then `npm install ./stream-chat-react-0.0.0-development.tgz` in the app. Pin the release once it ships.

### Message parts

An agent writes each step it takes while replying as a custom attachment on its reply, in order: a round of reasoning (`ai_reasoning`) or a tool call (`ai_tool_call`), at format version `v: 1`. The answer stays in the message text, shown after the steps.

```ts
import { parseMessageParts } from 'stream-chat-react/ai-components';

const parts = parseMessageParts(message.attachments);
for (const part of parts) {
  if (part.reasoning) {
    /* part.reasoning: { id, status, summary?, preview?, durationMs? } */
  } else if (part.toolCall) {
    /* part.toolCall: { id, name, displayTitle?, status, executor, approval?, authorization?, … } */
  } else {
    /* a kind of your own, or a newer one: part.kind, part.payload */
  }
}
```

- Attachments that are not AI steps (images, files) are skipped. Decoding is lenient: a field of the wrong type reads as missing, missing fields get defaults (`status` is `completed` for reasoning and `running` for a tool call, `executor` is `server`), and a step of a newer version keeps its `payload` without a typed view.
- A tool call's `status` is one of `running`, `awaiting_client`, `awaiting_approval`, `awaiting_authorization`, `completed`, `failed` or `cancelled`. Treat one you don't know as still in progress.
- `approval` is the question a call asks before it runs (`title`, `message`, `reason`, `allowTitle`, `declineTitle`) and the person's `decision` (`allowed` or `declined`).
- `authorization` is the sign-in a call waits for (`type`, `provider`, `providerName`, `title`, `message`, `url`, `handoffToken`, `expiresAt`, and `status`: `connected`, `declined`, `expired` or `failed` once over).
- `isAwaitingApproval(call, userId, clientId)` is true for a call waiting for this person on this install. A call with no `targetClientId` (a server tool) may be answered from any of their installs. `isAwaitingAuthorization(call, userId)` is true for a sign-in waiting for them, from any install. `isDeclined(call)` is true when they declined the call or its sign-in.

The data types are named `AIMessagePartData`, `AIToolApprovalData` and `AIToolAuthorizationData`, since `AIMessagePart`, `AIToolApproval` and `AIToolAuthorization` are the components that show them.

### `AIConversation`

The conversation laid out by turn, the counterpart of `AIConversationView`. Each of the person's questions starts a turn, with the agent's reply under it.

```tsx
import {
  AIClientIdentity,
  AIConversation,
  createPopupAuthorizer,
  fromStreamMessage,
} from 'stream-chat-react/ai-components';

const approver = {
  authorizer: createPopupAuthorizer({
    decline: (call) => backend.declineSignIn(call.id),
    returnUrl: `${window.location.origin}/connected`,
  }),
  clientId: AIClientIdentity.installId(),
  decide: (call, allowed) => backend.answerApproval(call.id, allowed),
  userId: client.userID,
};

<AIConversation
  approver={approver}
  bottomInset={composerHeight}
  emptyContent={<AISuggestions onSelect={send} suggestions={starters} />}
  footer={failed && <RetryPill />}
  isThinking={isThinking}
  loadOlderMessages={hasMore ? loadOlder : undefined}
  messages={messages.map((message) =>
    fromStreamMessage(message, { reasoningText: liveReasoning.get }),
  )}
  pendingMessage={pending}
  replyActions={(message) => ({
    onRate: (rating) => rate(message.id, rating),
    rating: ratings[message.id],
  })}
/>;
```

| Prop                                              | Description                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messages`                                        | `AIMessage[]`, oldest first: `{ id, role, text, isGenerating?, attachments?, parts?, reasoningText?(stepId) }`. `role` is `user` or `assistant`. `fromStreamMessage(message, options?)` makes one from a Stream message: a reply has `ai_generated: true` and is being written while `generating: true`. |
| `pendingMessage`                                  | `{ id, text, attachments? }`: a message the person sent that is not in `messages` yet. It shows at once, with the agent thinking under it. Keep passing it until its reply starts; its copy takes over its row (matched by `id` when it is the id you sent it with, else by where it lands).             |
| `isThinking`                                      | The agent is answering and its reply shows nothing yet. The latest turn then ends with `AIThinking`, whose seconds the reply's first reasoning step takes over. Also inferred while `pendingMessage` waits and while the latest reply is generating with nothing to show.                                |
| `approver`                                        | Who answers tool calls' questions and sign-ins on this device. Also provided to the parts below through `AIToolApproverProvider`.                                                                                                                                                                        |
| `loadOlderMessages`                               | Called once a spinner above the first turn has been in view for 300 ms, and again when the first turn changes while it is. What is on screen stays in place as older messages arrive. Pass `undefined` once there are none left.                                                                         |
| `footer`                                          | Rendered under the latest turn's messages, such as what the agent is doing (`AITypingIndicator`) or an error with a way to retry.                                                                                                                                                                        |
| `emptyContent`                                    | Shown, centred, while there are no messages.                                                                                                                                                                                                                                                             |
| `bottomInset`                                     | Room in pixels under the latest turn for a composer floating over the conversation. The scroll-to-latest button sits above it.                                                                                                                                                                           |
| `UserMessage`, `AssistantMessage`, `ReplyActions` | Slots for the person's messages, the agent's replies and the actions under each finished reply (`null` for none). Default to `AIUserMessage`, `AIAssistantMessage` and `AIReplyActions`.                                                                                                                 |
| `replyActions`                                    | `(message, { isLatestReply }) => ({ rating?, onRate?, onRegenerate? })` for the default reply actions.                                                                                                                                                                                                   |
| `ui`                                              | An `AIUIHost`: shows the UI the agent writes for a reply (`AIMessage.uiDocument`) in place of its text. See [Generated UI](#generated-ui).                                                                                                                                                               |

Behaviour:

- A new question pins to the top of what is visible, and the reply writes out below it without moving what is on screen: the latest turn is at least as tall as the conversation (less `bottomInset`).
- It opens at its end. A conversation replaced as a whole (another chat opened) opens at its end again.
- A round button scrolls to the latest message while the end is out of view.
- Steps render with `AIMessageParts`; the answer types out with `StreamingMessage` as it streams in, catching up with what has arrived within about 400 ms, and a reply loaded from history shows at once. `letterIntervalMs` and `renderingLetterCount` set a fixed pace instead.

### Generated UI

An agent can answer with UI rather than text, such as a card, a form or a map, in a format such as [A2UI](https://a2ui.org) or OpenUI. The agents router puts it in the reply's `ai_ui` field (`{ v, format, version?, status, content }`) and keeps the words around it as the reply's text, which shows wherever the UI can't. The counterpart of StreamChatAI's generative UI; these components know no format themselves, and renderers plug one in.

```tsx
const ui = useMemo(
  () =>
    new AIUIHost({
      components: [placeCard], // the app's own views, which the agent can place
      renderers: [a2uiRenderer],
      send: (action) =>
        session.responses.create(action.label, { uiAction: aiUIActionJSON(action) }),
    }),
  [session],
);

<AIConversation messages={messages.map((m) => fromStreamMessage(m))} ui={ui} />;
```

- `fromStreamMessage` reads a reply's `ai_ui` into `uiDocument` (`parseAIUIDocument`). A person's message never has one. A document of a newer `v` than this SDK reads is ignored.
- The first renderer whose `format` matches and that `supports(version)` shows it, through the engine the host makes for it once and keeps (`AIUIRenderer`, `AIUIEngine`). When none does, or its engine shows nothing of its own (`view` returns `null`), the reply shows its text. An engine whose answer changes after a reply first shows, such as once its format's packages load, calls `host.refresh()`, and the conversation shows its replies again.
- A reply's UI that throws while it renders, such as an app's component given what it didn't expect, shows the reply's text instead, and the rest of the conversation stays; `onRenderError(error, messageId)` is told, and it is logged by default.
- A reply whose UI shows is no longer empty: the agent's thinking gives way to it as soon as it starts streaming in. A finished reply has its actions under it whether it answers in text or in UI, once the UI is written (`status` other than `streaming`).
- A live reply's UI fades and rises in as it first shows, and its parts after it, 0.1 s apart and at most 0.4 s later (`AIUIEntrance`); with reduced motion they only fade. A reply from history shows at once.
- What the person does is an `AIUIAction` (`messageId`, `format`, `name`, `label`, `payload`). `host.send` sends them in order; one the router would refuse (no reply, format or name, or over 8 KB as JSON) goes to `onError` instead. `label` is the person's message and `aiUIActionJSON(action)` the router's `ui_action`, which it keeps on that message as `ai_ui_action`.
- Links from a reply's UI open through `host.open`: web and email links by default, since the agent writes them. Pass `open` to decide yourself.
- The app's components are described once, in portable JSON shared with the iOS and Android apps (`parseAIUIComponentDefinition`: `name`, `description`, `parameters` as a JSON Schema object with `x-order`, `events`). `defineAIUIComponent(definition, Component)` gives the view `args` (camelCase keys, dates as `Date`s, once they fit the parameters) and `context.emit(event, label, payload)`. `await host.capabilities()` describes the formats and components to the agent's backend, with each renderer's instructions for its model, as on iOS.
- `AIUIView` shows one reply's UI outside `AIConversation`; call `host.receive(messages)` as the messages change, and show the reply's text when `host.content(document, messageId)` is `null`, again whenever `host.subscribe` calls back.
- A renderer of your own can load its format's packages the first time a reply shows it with `AIUIRuntimeLoader` and `AIUIRuntimeView`, as the A2UI and OpenUI renderers do. When they can't load, such as after a deploy replaced the file they are in, the replies already written show their text, and the next reply the agent writes in the format tries again.

### A2UI

`stream-chat-react/a2ui` is the renderer of [A2UI](https://a2ui.org) 1.0, the counterpart of StreamChatA2UI. It is built on the official A2UI packages, which the app installs: they are optional peers of this package, pinned to the version it is tested with.

```bash
npm install @a2ui/web_core@0.15.0 @a2ui/react@0.15.0
```

```tsx
import { createA2UIRenderer } from 'stream-chat-react/a2ui';

const ui = new AIUIHost({
  components: [placeCard, tripMap],
  renderers: [createA2UIRenderer({ onError: (error, messageId) => report(error) })],
  send,
});
```

- A reply's `content` is A2UI messages, one JSON object per line as the agents router passes them on (a JSON array, or JSON rather than text, reads the same). Each message shows as it completes, while the agent writes it. Messages the agent rewrites, rather than adds to, start the reply's surfaces again.
- Each reply's surfaces are its own, kept for as long as the host is, so what the person entered survives scrolling. A finished reply whose A2UI made no surface shows its text.
- The app's components join the catalog under their A2UI type (`place_card` is `PlaceCard`), in the catalog `getstream.io:app-catalog` (`catalogId` to name another) and in the basic catalog, as on iOS, so the same instructions serve both apps. A parameter takes the value its schema describes, or a binding (`@path`) or function (`@call`), which the component gets worked out.
- What the person does goes to `host.send` as an `AIUIAction`: an A2UI event with its `userMessage` as the label (else what its button says, else its name) and `{ surfaceId, sourceComponentId, context }` as its payload; an app component's event with its own label and payload, plus `component`. `openUrl` opens through `host.open`, from a tap only. Text renders with `AIMarkdown`, and its links open through `host.open` too, since the agent writes them.
- What goes wrong, such as a message that is not JSON or a component the catalog lacks, goes to `onError` with the A2UI error code and the reply's id, and the rest of the reply still shows. A batch of components that one bad component spoils shows the others, whether in `updateComponents` or in the `createSurface` that makes the surface. What is wrong with the renderer rather than a reply, such as an app's component that can't join the catalog or packages that couldn't load, comes without an id.
- The parts a person sees most are Stream's: Button, Text, Card, TextField, ChoicePicker and Icon draw with this package's components and follow its theme, and the rest of the basic catalog, its layouts and media, draws with A2UI's own elements, themed with the AI components' tokens in `ai-components.css` (`.str-chat__a2ui` sets the `--a2ui-*` variables). A Button's words are the agent's, in the case it wrote them. What the agent says about a part with its `accessibility` (`label`, `description`, `live`, `hidden`) reaches assistive technology as on A2UI's own parts and on iOS: a field's name is its input's, and a Card or Text the agent names is a group. A live reply's parts come in as the agent writes them, like an app component's, and a reply from history shows whole.
- `Icon` draws Stream's icon for about half of A2UI's 60 names, restyled like any SDK icon with `WithComponents`'s `icons`. `icons` gives the renderer the app's own for any name (`{ shoppingCart: CartIcon }`), and `iconFont` names an icon font the page loads, such as `'Material Symbols Outlined'`, for the rest. An icon none of them draws takes its place but shows nothing, rather than its name as words.
- Its Modal is a native dialog, which keeps focus in it while open, closes on Escape or its backdrop, gives focus back to what opened it, and shows above the reply's layout. A trigger other than a Button opens it from the keyboard too.
- `createA2UIRenderer().capabilities` tells the agent's backend the fence, the catalog id and the instructions for both with the app's components, as StreamChatA2UI's do. It loads the A2UI core to write them; without them, when it can't load, the rest still goes.
- `a2uiInstructions(config)` writes what the agent's backend adds to its instructions, so its model writes A2UI this renderer shows: how a reply carries its UI, the protocol, the catalog's guidelines, and the catalog itself as JSON, with the app's components. It takes what StreamChatA2UI's `prompt.json` takes (`components`, `catalogId`, `fence`, `keep`, `preamble`, `notes`, `rules`, `examples`), and writes the app's components as iOS does, from the A2UI core's own catalog. It runs on a server or in a build, and rejects with an `A2UIInstructionsError` listing what is wrong when an example would not render: a broken example teaches the model broken UI.
- `a2uiProblems(text, config)` lists what is wrong with A2UI messages for that catalog, or nothing: messages that aren't JSON or come out of order, a surface created again without being deleted, components the catalog lacks or that don't fit their schemas, references that lead nowhere, a missing root, components nothing holds, and cycles. Each component is checked as the renderer checks it.
- The A2UI packages load in the browser the first time a reply shows A2UI, so server rendering shows a placeholder and an app whose agent never writes A2UI never loads them. The entry is ESM only, and `require` of it throws saying so; it needs React 18 or later.

### OpenUI

`stream-chat-react/openui` is the renderer of [OpenUI](https://openui.com), the counterpart of StreamChatOpenUI. It is built on the official OpenUI packages, which the app installs: they are optional peers of this package, pinned to the versions it is tested with. Their styles are the app's to import, and `ai-components.css` themes them.

```bash
npm install @openuidev/react-lang@1.0.2 @openuidev/react-ui@0.18.1 @openuidev/react-headless@0.18.1 zustand@^4.5.5
```

```tsx
import '@openuidev/react-ui/components.css';
import { createOpenUIRenderer, openUIInstructions } from 'stream-chat-react/openui';

const ui = new AIUIHost({
  components: [placeCard, tripMap],
  renderers: [createOpenUIRenderer({ onError: (error, messageId) => report(error) })],
  send,
});

// What the agent's backend adds to its instructions, so its model writes OpenUI with them.
const instructions = await openUIInstructions([placeCard, tripMap]);
```

- A reply's `content` is an OpenUI Lang program, which shows as the agent writes it, as OpenUI's own renderer shows it. A finished reply with no program, or one that draws nothing, such as words that aren't OpenUI, shows its text.
- The agent writes with OpenUI's chat library (`openuiChatLibrary`), or with the `library` the renderer is given. The app's components join it under their OpenUI name (`place_card` is `PlaceCard`), wherever the library's own content goes, such as a Card's children or a TabItem's content, as on iOS. One whose name the library already has is left out. A parameter takes the value its schema describes, and the component gets it once it fits, dates as dates.
- What the person does goes to `host.send` as an `AIUIAction`, as on iOS: a button or follow-up is `continue_conversation`, with its words as the label and `{ context, params, form, values }` as its payload, where `values` are the values of the form it belongs to, without a field OpenUI marks secret; an app component's event has its own label and payload, plus `component`. `@OpenUrl` and the links of its Markdown open through `host.open`. A program's `Query()` and `Mutation()` run the host's client tools, or the renderer's `toolProvider`.
- What the person chose in a reply's forms is kept by the host, so it survives scrolling.
- What is wrong with a finished reply's program, such as a component the library lacks, goes to `onError` with OpenUI's error code and the reply's id, once, and the rest of the reply still shows. An app's component left out of the library, or packages that couldn't load, come without an id. While the agent writes it, what a program lacks is still coming, so nothing is reported.
- `.str-chat__openui` sets OpenUI's `--openui-*` variables from the AI components' tokens, so its components follow Stream's light and dark themes. The rest, such as its chart palette, stays OpenUI's own.
- `createOpenUIRenderer().capabilities` tells the agent's backend the fence, `openui-lang`, and the instructions with the app's components, as StreamChatOpenUI's do. `openUIInstructions(components)` writes the same instructions on their own, with OpenUI's own prompt generator. Both load the OpenUI packages, so ask for them where that is fine, such as once at build time or when the app starts its conversation.
- `@openuidev/react-lang` mounts OpenUI's inspector on the page in development, with offers of OpenUI's own; the renderer keeps it off unless `devtools: true`.
- The OpenUI packages load the first time a reply shows OpenUI, so server rendering shows a placeholder and an app whose agent never writes OpenUI never loads them. It needs React 18.3 or later.
- `@openuidev/lang-core`'s install script reports the install to OpenUI's analytics, anonymously, unless `OPENUI_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` is set. It sends nothing from a browser; on a server, only with `OPENUI_RUNTIME_TELEMETRY_ENABLED=1`.

### Steps, questions and sign-ins

- `AIMessageParts` / `AIMessagePart`: a reply's steps, each as `AIReasoning`, `AIToolCall` (with `AIToolApproval` and `AIToolAuthorization` under it), or a neutral line for a step this SDK can't show.
- `AIToolCall`: the call's `displayTitle` (else its name), what it waits for or how it ended, and its duration once finished.
- `AIToolApproval`: the question of a call that waits for this person here, sent with `approver.decide(call, allowed)`. The buttons wait until the call's step changes; a rejected `decide` shows "Your answer couldn't be sent. Try again." and lets them answer again (`AIToolApprovalState`: `isSending`, `failed`). `AIToolApprovalCard` is the same question on its own, such as on a voice call: `<AIToolApprovalCard approval={call.approval} onDecide={…} state={…} />`.
- `AIToolAuthorization`: the sign-in of a call that waits for this person, with Connect and Not now, run by `approver.authorizer`. Connect reads "Connecting…" until the call's step changes; Not now stays available meanwhile. `AIToolAuthorizationCard` also says how a sign-in ended (connected, declined, failed, expired) and stops offering Connect past `expiresAt`.
- `AIReasoning`: a round of reasoning. While the model thinks the header counts ("Thinking… 7s") and the reasoning streams in; once done it says "Thought for 12s" with the step's summary and folds away. Clicking the header opens or folds it. Pass `part` and `reasoningText` (the live reasoning, by step id), or `text`, `isThinking`, `duration` and `summary` yourself. `AIThinking` is the thinking before a reply shows anything.

### Signing in at a provider

`createPopupAuthorizer({ returnUrl, decline })` returns an `AIToolAuthorizer` that runs a call's sign-in in a popup, the web counterpart of the web authentication session on iOS:

1. Connect opens `authorization.url` (the router's launch page) in a popup, in the click itself, so the browser does not block it.
2. The page posts `{ type: 'va.connector.oauth.ready' }` to this window; the authorizer answers `{ type: 'va.connector.oauth.handoff', handoff_token }`, to the page's origin only.
3. The page goes to the provider, which sends the person back through the router to `returnUrl` with `connection_id` and `status` in its query.
4. The return page calls `completeConnectorSignIn()`, which reports the outcome over a `BroadcastChannel` and closes the popup.

`connect` resolves `true` once connected (the card then waits for the call's step to change), `false` when the person closed the popup or the sign-in ended otherwise, and rejects with an `AIConnectorSignInError` when the popup was blocked (`reason: 'blocked'`) or the launch page never asked for the handoff within 15 s (`'unreachable'`). Give your sessions `returnUrl` as their `return_url`: the launch page takes the handoff only from a page of its origin.

```html
<!-- connected.html, the return page -->
<script type="module">
  import { completeConnectorSignIn } from 'stream-chat-react/ai-components';
  completeConnectorSignIn();
</script>
```

### Addressing

`AIClientIdentity.installId()` is a stable id for this browser profile (`web-…`), kept in `localStorage` (in memory where storage is unavailable). Send it in the custom data of the person's message (`client_id`) so the agent can address client tools and questions to this install, and pass it to the approver as `clientId`.

### Reply actions, suggestions and chat options

- `AIReplyActions`: copy, share (`navigator.share` where the browser has it, else a copy), regenerate (with `onRegenerate`) and a thumbs up or down rating (with `onRate`; `AIMessageRating` is `positive` or `negative`, and `null` takes a rating back).
- `AISuggestions`: starter chips for an empty conversation; picking one calls `onSelect(text)`.
- `AIMessageComposer.ChatOptions`: a menu of ways to ask, such as "Think harder" (`AIChatOption`: `id`, `title`, `description?`, `icon?`, `shortTitle?`, `customData?`), and a chip for the one picked with a button that removes it. Controlled with `selectedId` and `onSelectedChange`, or uncontrolled with `defaultSelectedId`; with `name`, the picked id is submitted with the form. `ChatOptionsList` and `SelectedChatOptionChip` are its parts, for layouts of your own.
- `AIUserMessage`, `AIAssistantMessage`, `AIMessageAttachment` (an image thumbnail, or a file with its name, type and size) and `AITypingIndicator` (a label with three pulsing dots) are the views `AIConversation` uses, for lists of your own.

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

All strings are translated through `t()` and `Streami18n` (12 locales shipped). Inside `<Chat>` the active language is used; override or add translations through your `Streami18n` instance.

Outside `<Chat>` (or a `TranslationProvider`), as everywhere in `stream-chat-react`, `t()` is the default translator, which returns the key unchanged. Keys that are English sentences, such as `Ask a question...`, still read correctly, but accessible names use `aria/`-prefixed keys and are then exposed raw: the submit button is announced as `aria/Send` instead of `Send`. Render the components inside `<Chat>`, or wrap them in a `TranslationProvider` (both exported from `stream-chat-react`) whose value holds `userLanguage` plus the `t` and `tDateTimeParser` returned by `await new Streami18n({ language: 'en' }).getTranslators()`, to get real labels.

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
| `accent`                   | tool call icons, reasoning rule while thinking, chips   | `accent-primary`                  | `#005fff`        |
| `success`                  | completed tool calls, connected sign-ins                | `accent-success`                  | `#00a46e`        |
| `error`                    | failed tool calls, answers that couldn't be sent        | `accent-error`                    | `#d92f26`        |
| `text-tertiary`            | reasoning footnote                                      | `text-tertiary`                   | `#7a7d87`        |
| `card-bg`                  | approval and sign-in cards, files, suggestions          | `background-core-surface-card`    | `#f7f7f8`        |
| `card-border`              | approval and sign-in cards, files                       | `border-core-subtle`              | `#e9ecef`        |
| `elevated-bg`              | scroll-to-latest button, chat options menu              | `background-core-elevation-1`     | `#ffffff`        |
| `user-message-bg`          | the person's message bubble                             | `chat-bg-outgoing`                | `#d2e3ff`        |
| `user-message-text`        | the person's message text                               | `chat-text-outgoing`              | `#001a4d`        |
| `button-primary-bg`        | Allow and Connect buttons                               | `button-primary-bg`               | `#005fff`        |
| `button-primary-text`      | Allow and Connect button text                           | `button-primary-text-on-accent`   | `#ffffff`        |
| `button-secondary-bg`      | Don't Allow and Not now buttons                         | `background-core-elevation-1`     | `#ffffff`        |
| `button-secondary-text`    | Don't Allow and Not now button text                     | `text-primary`                    | `#353740`        |
| `button-secondary-border`  | Don't Allow and Not now button border                   | `button-secondary-border`         | `#ccc`           |
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

- **`AIMessageComposer.FileInput`** - File input button for attaching files. Supports multiple file selection. The native `<input type="file">` is visually hidden but stays focusable (it is the keyboard stop, labelled `aria/File upload`, and opens the picker on Enter/Space); the round `<label>` that follows it is the pointer target and shows its focus ring. `labelProps` are spread onto that label.
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

### `useHeardText`

Reveals a text at the pace the user hears it spoken, for apps that talk to a voice AI agent: the agent's reply is written into the chat as the model generates it, far ahead of the agent's voice. The hook is standalone (React only, no chat SDK imports) and takes the speech progress from the app as a plain function, so it works with any voice backend.

```ts
type HeardTextProgress = { chars: number; done: boolean };
type HeardTextFunction = (now: number) => HeardTextProgress | undefined;
type HeardTextSubscribe = (listener: () => void) => () => void;

const useHeardText: (params: UseHeardTextParams) => UseHeardTextResult;
```

`heard(now)` returns how many characters of the text the user has heard by `now` (a `performance.now()` timestamp) and whether the speech for it has finished. `chars` counts Unicode code points (`Array.from(text).length`), not UTF-16 code units; `Infinity` means the whole text. Return `undefined` only for a text that is not spoken at all. A text that will be spoken but whose audio has not started, or that the voice source does not know yet, must return `{ chars: 0, done: false }`: while `heard` returns `undefined` the full text is shown, and the reveal never moves back past what has been shown. `heard` is also called during render, so keep it free of side effects.

#### Props

| Name         | Type                 | Required | Description                                                                                                            |
| ------------ | -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `text`       | `string`             | yes      | The full text to reveal.                                                                                               |
| `heard`      | `HeardTextFunction`  | yes      | The speech progress of `text`.                                                                                         |
| `subscribe`  | `HeardTextSubscribe` | no       | Change notifications from the speech progress source; each one makes the hook check `heard` again. See below.          |
| `generating` | `boolean`            | no       | `true` while the text is still being written. The full text is revealed once `heard` reports `done` and this is falsy. |
| `live`       | `boolean`            | no       | Defaults to `true`. `false` reveals the full text at once, for example for a message loaded from history. See below.   |

#### Returns

| Name        | Type         | Description                                                                        |
| ----------- | ------------ | ---------------------------------------------------------------------------------- |
| `heardText` | `string`     | The part of the text the user has heard (the full text when not paced).            |
| `isPaced`   | `boolean`    | `false` when `heard` returned `undefined`; `heardText` is then the full text.      |
| `skip`      | `() => void` | Reveal the full text from now on, for example when the user stops the AI response. |

Behaviour:

- It reveals the first `floor(chars)` code points of `text` and never moves backwards while `text` grows or is truncated. Emoji and other astral characters are never split.
- When `text` is replaced by a different text (the next reply rendered by the same component), the reveal starts over: the length shown and `skip()` are reset, and `live` is read again. `live` is otherwise read only at mount.
- While the text is paced and its speech is not done, it samples `heard` on every animation frame, and stops when the speech is done or the component unmounts. `subscribe` notifications and changes of `text` or `generating` make it check again. Without `subscribe`, nothing else does: pass it when `heard` can change after the speech is done, or start returning a value after returning `undefined`.
- If `heard` returns `undefined` at first and a value later, the reveal continues from the length already shown.
- `heard` and `subscribe` are read through refs: passing new functions on every render (inline arrow functions) does not restart the pacing. `subscribe` is called once and unsubscribed on unmount; to switch to another speech source, remount the component (for example with a `key`).

#### Example

```tsx
import { useHeardText } from 'stream-chat-react/ai-components';

function SpokenReply({ generating, session, text, turnId }) {
  const { heardText } = useHeardText({
    generating,
    heard: (now) => session.speech.heard(turnId, now),
    subscribe: (listener) => session.speech.subscribe(listener),
    text,
  });

  return <p>{heardText}</p>;
}
```

A drop-in for the `StreamedMessageText` component slot of `stream-chat-react`, built on this hook, is shown in the docs.

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
