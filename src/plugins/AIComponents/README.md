# AI components (`stream-chat-react/ai-components`)

AI-first building blocks for Stream Chat: a message composer with attachments and speech-to-text, a Markdown renderer with syntax highlighting and Chart.js support, a typewriter-style streaming message, a hook that reveals text at the pace a voice agent speaks it, and an "AI is thinking" indicator.

These components used to ship as the separate package `@stream-io/chat-react-ai`. They now live in `stream-chat-react` behind the optional entry point `stream-chat-react/ai-components`, with a stylesheet at `stream-chat-react/css/ai-components.css`. The main entry point (`stream-chat-react`) never imports from this plugin, so apps that do not use it pay nothing for it.

## Installation

Requires the first `stream-chat-react` **v15** release that includes `ai-components` (expected `15.0.0-rc.N`; the exact number is set by semantic-release). On v14 the entry ships from 14.13.0. [Generated UI](#generated-ui), with its `stream-chat-react/a2ui` and `stream-chat-react/openui` renderers, came later: it needs a v15 release candidate after 15.0.0-rc.3, and ships on v14 from 14.16.0.

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

- Components: `AIMarkdown`, `AIMessageComposer` (with the static sub-components `FileInput`, `TextInput`, `SpeechToTextButton`, `SubmitButton`, `StopButton`, `Actions`, `ModelSelect`, `ChatOptions`, `AttachmentPreview`, `AttachmentPreview.Item`), `StreamingMessage`, `AIStateIndicator`, `VoiceWave`, `VoiceGlow`
- Agent conversations (see [Agent conversations](#agent-conversations)): `AIConversation`, `AIUserMessage`, `AIAssistantMessage`, `AIMessageAttachment`, `AIReplyActions`, `AIBranchSwitcher`, `AITypingIndicator`, `AISuggestions`, `AIMessageParts`, `AIMessagePart`, `AIToolCall`, `AIToolApproval`, `AIToolApprovalCard`, `AIToolArguments`, `AIToolAuthorization`, `AIToolAuthorizationCard`, `AIReasoning`, `AIThinking`, `AIToolApproverProvider`, `ChatOptionsList`, `SelectedChatOptionChip`
- Conversation state (see [`AIConversationController`](#aiconversationcontroller)): `AIConversationController`, `AIAgentError`, `AI_AGENT_ERROR_MESSAGE`, `AIAgentActivityStates`, `isAIConversationAnswering`, `useAIConversationState`, `createAIMessageComposerStore`, and the types `AIConversationControllerState`, `AIConversationControllerOptions`, `AIConversationSendData`, `AIConversationTransport`, `AIConversationFeed`, `AIConversationRequest`, `AIConversationRequestKind`, `AIConversationStatus`, `AIConversationActions`, `AIAgentActivity`, `AIAgentActivityState`
- Functions: `parseMessageParts`, `parseMessagePart`, `isAwaitingApproval`, `isAwaitingAuthorization`, `isAwaitingClient`, `isDeclined`, `isToolCallFinished`, `isSupportedPart`, `isAuthorizationExpired`, `fromStreamMessage`, `createPopupAuthorizer`, `completeConnectorSignIn`, `readConnectorSignInResult`, `AIClientIdentity.installId()`
- Hooks: `useAttachments`, `useText`, `useIsDisabled`, `useAIMessageComposerContext`, `useSpeechToText`, `useAudioLevel`, `useHeardText`, `useAIToolApprover`
- Types: `AIMessageComposerStore`, `AIMessageComposerLayout`, `StreamingMessageRef`, `UseMessageTextStreamingProps`, `ToolComponentProps`, `UseSpeechToTextOptions`, `VoiceAgentState`, `VoiceGlowRendering`, `VoiceVisualizationProps`, `VoiceWaveProps`, `VoiceGlowProps`, `HeardTextProgress`, `HeardTextFunction`, `HeardTextSubscribe`, `UseHeardTextParams`, `UseHeardTextResult`, `AIMessage`, `AIMessageRole`, `AIPendingMessage`, `AIMessagePartData`, `AIReasoningPart`, `AIToolCallPart`, `AIToolApprovalData`, `AIToolAuthorizationData`, `AIToolApprover`, `AIToolAuthorizer`, `AIToolApprovalState`, `AIToolAuthorizationState`, `AIMessageAttachmentData`, `AIMessageRating`, `AIChatOption`, `PopupAuthorizerOptions`, `ConnectorSignInResult`

`useMessageTextStreaming` is not exported from here; import it from the main entry point (`stream-chat-react`).

## Agent conversations

The components of a conversation with an AI agent, such as a personal assistant, that mirror StreamChatAI (iOS) and `stream-chat-android-ai-compose` (Android): the same names, the same message parts, and the same behaviour, in React idiom. A web app built on them renders the same conversations as the iOS and Android apps.

### Message parts

An agent writes each step it takes while replying as a custom attachment on its reply, in order: a round of reasoning (`ai_reasoning`) or a tool call (`ai_tool_call`), at format version `v: 1`. The answer stays in the message text, shown after the steps. stream-chat keeps a step's fields under the attachment's `custom`, and the parser reads them there or at the top level.

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

It scrolls inside itself, so it fills its parent: the space left in a flex container, such as a page-high column with the composer under it, or else the parent's height. Without a bounded ancestor it grows with its turns and the page scrolls instead, so it no longer follows the latest reply.

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

| Prop                                              | Description                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conversation`                                    | An `AIConversationController`: the conversation shows its state and offers what the person can do in it. It takes the place of `messages`, `pendingMessage`, `isThinking` and `loadOlderMessages`, and supplies `approver` and `replyActions` unless you pass them. See [`AIConversationController`](#aiconversationcontroller).                                                       |
| `messages`                                        | Required without `conversation`. `AIMessage[]`, oldest first: `{ id, role, text, isGenerating?, rating?, attachments?, parts?, reasoningText?(stepId), responseId?, branch? }`. `role` is `user` or `assistant`. `fromStreamMessage(message, options?)` makes one from a Stream message: a reply has `custom.ai_generated: true` and is being written while `custom.generating: true`. |
| `pendingMessage`                                  | `{ id, text, attachments? }`: a message the person sent that is not in `messages` yet. It shows at once, with the agent thinking under it. Keep passing it until its reply starts; its copy takes over its row (matched by `id` when it is the id you sent it with, else by where it lands).                                                                                           |
| `isThinking`                                      | The agent is answering and its reply shows nothing yet. The latest turn then ends with `AIThinking`, whose seconds the reply's first reasoning step takes over. Also inferred while `pendingMessage` waits and while the latest reply is generating with nothing to show.                                                                                                              |
| `approver`                                        | Who answers tool calls' questions and sign-ins on this device. Also provided to the parts below through `AIToolApproverProvider`.                                                                                                                                                                                                                                                      |
| `loadOlderMessages`                               | Called once a spinner above the first turn has been in view for 300 ms, and again when the first turn changes while it is. What is on screen stays in place as older messages arrive. Pass `undefined` once there are none left.                                                                                                                                                       |
| `footer`                                          | Rendered under the latest turn's messages, such as what the agent is doing (`AITypingIndicator`) or an error with a way to retry.                                                                                                                                                                                                                                                      |
| `emptyContent`                                    | Shown, centred, while there are no messages.                                                                                                                                                                                                                                                                                                                                           |
| `bottomInset`                                     | Room in pixels under the latest turn for a composer floating over the conversation. The scroll-to-latest button sits above it.                                                                                                                                                                                                                                                         |
| `UserMessage`, `AssistantMessage`, `ReplyActions` | Slots for the person's messages, the agent's replies and the actions under each finished reply (`null` for none). Default to `AIUserMessage`, `AIAssistantMessage` and `AIReplyActions`.                                                                                                                                                                                               |
| `replyActions`                                    | `(message, { isLatestReply }) => ({ rating?, onRate?, onRegenerate?, branch? })` for the default reply actions. `branch` (`{ index, count, onPrevious?, onNext? }`) shows a ‹ i/n › switcher between a reply's versions; see [Versions of a message](#versions-of-a-message).                                                                                                          |
| `userMessageActions`                              | `(message) => ({ onEdit?(text), branch? })` for the default user message: `onEdit` edits the message in place and gets the saved text, and `branch` shows a ‹ i/n › switcher between the versions of an edited question. A custom `UserMessage` gets them as `onSaveEdit` and `branch`.                                                                                                |
| `ui`                                              | An `AIUIHost`: shows the UI the agent writes for a reply (`AIMessage.uiDocument`) in place of its text. See [Generated UI](#generated-ui).                                                                                                                                                                                                                                             |

Behaviour:

- A new question pins to the top of what is visible, and the reply writes out below it without moving what is on screen: the latest turn is at least as tall as the conversation (less `bottomInset`).
- It opens at its end. A conversation replaced as a whole (another chat opened) opens at its end again.
- A round button scrolls to the latest message while the end is out of view.
- Steps render with `AIMessageParts`; the answer types out with `StreamingMessage` as it streams in, catching up with what has arrived within about 400 ms, and a reply loaded from history shows at once. `letterIntervalMs` and `renderingLetterCount` set a fixed pace instead.
- An `AssistantMessage` of your own gets `attachments`, `isGenerating`, `message`, `parts`, `text`, `approver`, `reasoningText`, and two props about the reply's generated UI: `showsUI`, whether its UI shows in place of its words (`text` is then `''`), and `uiFailed`, whether its UI failed to show (`AIUIHost.fail`), so its words, if any, show instead. A reply that is neither generating nor showing UI, with no `text`, finished without a text reply, which your message can say. Both change when the host fails a reply, so a memoised message shows again.

```tsx
const AssistantMessage = (props: AIConversationAssistantMessageProps) => (
  <>
    <AIAssistantMessage {...props} />
    {!props.isGenerating && !props.showsUI && props.text === '' && (
      <p role='status'>
        {props.uiFailed
          ? 'The reply couldn’t be shown.'
          : 'Finished without a text reply.'}
      </p>
    )}
  </>
);
```

### Versions of a message

A reply written again and a question the person edited each have versions, of which one shows. A message marks which it is with `custom.support_branch`:

```json
{
  "response_id": "resp_2",
  "parent_response_id": "resp_1",
  "question_response_id": "resp_2",
  "of": "reply",
  "index": 2,
  "count": 3
}
```

`fromStreamMessage` reads it as `AIMessage.branch` (`{ of, index, count }`, `index` from 1) and `AIMessage.responseId`. A message without it, or with one that doesn't add up (an unknown `of`, an `index` that isn't a whole number from 1 to `count`), has one version and no `branch`. `of: 'reply'` puts the switcher on the reply, among the replies to one question; `of: 'question'` puts it on the person's message, among their edits of it.

The components show the versions; your backend switches between them. Hand the mark on with what to call:

```tsx
// A switcher for the message when its versions are of the given kind.
const versionsOf = (message: AIMessage, of: AIMessageBranch['of']) => {
  const { branch } = message;
  if (branch?.of !== of) return undefined;
  return {
    count: branch.count,
    index: branch.index,
    onNext: () => backend.showVersion(message.responseId, branch.index + 1),
    onPrevious: () => backend.showVersion(message.responseId, branch.index - 1),
  };
};

<AIConversation
  messages={messages.map((message) => fromStreamMessage(message))}
  replyActions={(message) => ({
    branch: versionsOf(message, 'reply'),
    onRegenerate: () => backend.regenerate(message.responseId),
  })}
  userMessageActions={(message) => ({
    branch: versionsOf(message, 'question'),
    onEdit: (text) => backend.editQuestion(message.responseId, text),
  })}
/>;
```

- `AIBranchSwitcher` (`{ index, count, onPrevious?, onNext? }`) shows `‹ index/count ›`, and nothing while `count` is 1. Each arrow is disabled at its end, and when it has nothing to call. `AIReplyActions` takes it as `branch`, in front of its other actions; `AIUserMessage` takes it as `branch`, under the bubble.
- `AIUserMessage`'s `onSaveEdit(text)` (what `userMessageActions`' `onEdit` becomes) turns the edit button into an editor in place of the bubble, filled with the message's text. Save or Enter calls it with the new text (Shift+Enter starts a new line, and an empty text can't be saved); Cancel or Escape closes it. The editor closes when another version shows. Without `onSaveEdit`, the button calls `onEdit()` as before, such as a `conversation`'s edit in the composer; with both, `onSaveEdit` is used.

### `AIConversationController`

The state behind a conversation, and what the person does in it: the counterpart of `AIConversation` in StreamChatAI (iOS) and of `AIConversationController` in `stream-chat-react-native`, with the same names, state and behaviour. Without it, every app works out `messages`, `pendingMessage`, `isThinking`, ratings and retries itself; with it, `AIConversation` and `AIMessageComposer` take one `conversation` prop.

It reaches the agent through an `AIConversationTransport` of yours (or one an agent SDK ships):

```ts
import {
  type AIConversationTransport,
  fromStreamMessage,
} from 'stream-chat-react/ai-components';

const transport: AIConversationTransport = {
  // Tell the feed the messages each time they change, and what the agent is doing.
  connect: (feed) => {
    const update = () =>
      feed.updateMessages(messagesOf(channel).map((m) => fromStreamMessage(m)));
    update();
    return channel.on(update).unsubscribe;
  },
  // Resolve once the agent has the request; its reply arrives through the feed.
  send: (request) => agent.respond(request),
  stop: () => agent.interrupt(),
  // Optional:
  loadOlderMessages: () => loadOlderPage(),
  rate: (reply, rating) => backend.rate(reply.id, rating),
  // Shows the previous or next version of `message`'s branch, then feeds its messages.
  // `signal` aborts when the person sends meanwhile: feed nothing of that version then.
  switchBranch: (message, to, signal) => agent.switchBranch(message, to, { signal }),
};
```

Make the controller inside a `useEffect` and `dispose()` it in that effect's cleanup. React's StrictMode runs effects twice in development, so a controller made with `useState(() => new AIConversationController(…))` and disposed in an effect is disposed by the first cleanup and never connected again; one made in the effect is made again with it.

```tsx
import {
  AIConversation,
  AIConversationController,
  AIMessageComposer,
} from 'stream-chat-react/ai-components';

const Chat = ({ transport }: { transport: AIConversationTransport }) => {
  const [conversation, setConversation] = useState<AIConversationController>();
  useEffect(() => {
    const controller = new AIConversationController({ approver, transport });
    setConversation(controller);
    return () => controller.dispose();
  }, [transport]);

  if (!conversation) return null;
  return (
    <>
      <AIConversation
        conversation={conversation}
        footer={<ErrorFooter conversation={conversation} />}
      />
      <AIMessageComposer conversation={conversation}>
        <AIMessageComposer.TextInput />
        <AIMessageComposer.Actions>
          <AIMessageComposer.FileInput />
          <AIMessageComposer.SubmitButton />
        </AIMessageComposer.Actions>
      </AIMessageComposer>
    </>
  );
};
```

What it holds, in `conversation.state` (a `StateStore`; follow it with `useAIConversationState(conversation, selector)`, with the selector defined outside the component):

| Field               | Description                                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messages`          | The conversation as it shows, oldest first. While a reply is written again, or an edited message is answered again, it and the messages after it are left out until the new reply starts. |
| `pendingMessage`    | The message the person sent last that is not in `messages` yet. It stays until its reply starts, and after it was stopped or failed, while `retry()` can send it again.                   |
| `status`            | `ready`, `submitted` (on its way, or the agent works on it and its reply shows nothing yet), `streaming` or `error`. `isAIConversationAnswering(status)` is true for the middle two.      |
| `isSwitchingBranch` | Whether a `switchBranch` is on its way. `status` stays as it was meanwhile, and the views offer neither sending, regenerating, editing nor another switch.                                |
| `error`             | Why the latest request failed, or, as an `AIAgentError`, that the agent couldn't answer or didn't start its reply in time (`replyTimeout`, five minutes by default).                      |
| `activity`          | What the agent says it is doing besides its reply, such as checking sources (`AIAgentActivityStates`).                                                                                    |
| `hasOlderMessages`  | Whether `loadOlderMessages()` has anything to load.                                                                                                                                       |
| `ratings`           | How the person rated replies, by id: what they gave in the browser, or the reply's own `rating`.                                                                                          |

What the person does: `send({ text, attachments?, chatOption?, custom? })` (a message, or the edit of the message being edited), `stop()`, `regenerate(reply)`, `edit(message)`, `cancelEditing()`, `retry()`, `clearError()`, `rate(reply, rating | null)`, `switchBranch(message, 'previous' | 'next')` and `loadOlderMessages()`. A transport gets each as an `AIConversationRequest` with a `kind` (`message`, `regenerate`, `edit`, or one of your own), a `messageId` it can create the message with (a retry keeps it), the `text`, the `File`s picked, the `chatOption`, `custom`, and the `message` it is about. A generated UI's action travels as `custom.uiAction`.

`actions: { edit, rate, regenerate }` turns off what the views offer (all by default): editing and regenerating the latest message only, or with `switchBranch` any with a `responseId`. `composer` takes a store of your own (`createAIMessageComposerStore()`), and `approver` is given to `AIConversation` unless it gets one of its own.

With a `conversation`:

- `AIConversation` shows its messages, the message on its way and the agent thinking (status `submitted`), loads older messages while `hasOlderMessages`, offers rating under replies and regenerating the latest one while the agent isn't answering, and an edit button on the person's latest message, which edits it in the composer. Passing `replyActions` replaces the controller's. `userMessageActions` replaces the controller's switcher on the person's messages and keeps its edit button: an `onEdit` of yours edits in place instead of in the composer.

With the transport's optional `switchBranch(message, to)` (`conversation.canSwitchBranch`), the conversation follows [versions of a message](#versions-of-a-message) without `replyActions` or `userMessageActions` of yours:

- Each message whose `branch` has two versions or more shows the ‹ i/n › switcher: on the reply for `of: 'reply'`, among its regenerated versions, and on the person's message for `of: 'question'`, among their edits. The arrows call `switchBranch(message, 'previous' | 'next')`, which shows that version and feeds its messages. Each arrow is disabled at its end, and both while the agent is answering or another switch is on its way.
- While a switch is on its way (`isSwitchingBranch`), the composer's send button is disabled and Enter doesn't send, and regenerate and edit aren't offered. A request sent anyway, such as through `send()`, gives up on the switch: the `AbortSignal` `switchBranch` gets as its third argument aborts, and its outcome is ignored. A transport that feeds the switch's version after that can still take the place of the request's question, so honour the signal.
- Regenerate is offered on every finished reply, and edit on every one of the person's messages, while the agent isn't answering (subject to `actions`). Besides the latest, only on those with a `responseId` (a `support_branch` mark), since the transport has nothing to branch from without one. The request is the same as for the latest, with `message` the one regenerated or edited, which with what follows it is left out until the new reply starts. Meanwhile the reply counts only once it is being written, or when it arrives after `send` resolved: a transport that brings a version a switch shows back into the conversation re-sends its messages, finished and under new ids, before it resolves, and those stay left out too. Editing always goes through the composer (`edit(message)` fills it); the controller doesn't wire the in-place editor.
- A `switchBranch` that rejects shows as `error` (status `error`); `clearError()` forgets it, and `retry()` does not retry the switch.

Without `switchBranch`, nothing changes: the latest only, and no switcher.

- `AIMessageComposer` shows `conversation.composer`, and submitting sends what the person wrote, the files they picked and the chat option (which stays picked), unless `onSubmit` calls `event.preventDefault()`. While the agent answers, `SubmitButton` turns into a `StopButton` that stops it, and Enter does not send. While the person edits a message the composer says so above the text ("Editing"), with a button that cancels it (`isEditing` on the store).

An `AIAgentError` without `agentMessage` carries the English `AI_AGENT_ERROR_MESSAGE`; check for that to show copy of your own:

```tsx
const errorSelector = ({ error }: AIConversationControllerState) => ({ error });

const ErrorFooter = ({ conversation }: { conversation: AIConversationController }) => {
  const { error } = useAIConversationState(conversation, errorSelector);
  if (!error) return null;
  return (
    <p role='alert'>
      {error instanceof AIAgentError && !error.agentMessage
        ? 'The assistant is busy. Try again in a moment.'
        : error.message}
      <button onClick={() => conversation.retry()}>Retry</button>
    </p>
  );
};
```

### Generated UI

An agent can answer with UI rather than text, such as a card, a form or a map, in a format such as [A2UI](https://a2ui.org) or OpenUI. The agents router puts it in the reply's `ai_ui` field (`custom.ai_ui` on a stream-chat v10 message) (`{ v, format, version?, status, content }`) and keeps the words around it as the reply's text, which shows wherever the UI can't. The counterpart of StreamChatAI's generative UI; these components know no format themselves, and renderers plug one in.

Generated UI, `stream-chat-react/a2ui` and `stream-chat-react/openui` need a v15 release candidate after 15.0.0-rc.3 (the exact number is set by semantic-release), or 14.16.0 or later on v14.

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

- `fromStreamMessage` reads a reply's `custom.ai_ui` (or `ai_ui` at the top level of a message straight from the API) into `uiDocument` (`parseAIUIDocument`). A person's message never has one. A document of a newer `v` than this SDK reads is ignored. To read the fields yourself, type them in `CustomMessageData`, which stream-chat keeps under a message's `custom`: `ai_ui?: AIUIDocumentJSON` and `ai_ui_action?: AIUIActionJSON`.
- The first renderer whose `format` matches and that `supports(version)` shows it, through the engine the host makes for it once and keeps (`AIUIRenderer`, `AIUIEngine`). When none does, or its engine shows nothing of its own (`view` returns `null`), the reply shows its text. An engine whose answer changes after a reply first shows, such as once its format's packages load, calls `host.refresh()`, and the conversation shows its replies again.
- One of the app's components that throws while it renders, such as when given what it didn't expect, leaves only itself out of the reply's UI, and is tried again when what it is given changes. A reply's UI that throws elsewhere shows the reply's text instead, and a reply still being written tries again once it is written. Either way the rest of the conversation stays, and `onRenderError(error, messageId)` is told once the reply is written; it is logged by default.
- A reply whose UI shows is no longer empty: the agent's thinking gives way to it as soon as it starts streaming in. A finished reply has its actions under it whether it answers in text or in UI, once the UI is written (`status` other than `streaming`).
- A live reply's UI fades and rises in as it first shows, and its parts after it, 0.1 s apart and at most 0.4 s later (`AIUIEntrance`); with reduced motion they only fade. A reply from history shows at once.
- What the person does is an `AIUIAction` (`messageId`, `format`, `name`, `label`, `payload`). `host.send` sends them in order and resolves to whether it sent one; one the router would refuse (no reply, format or name, or over 8 KB as JSON), or that fails to send, goes to `onError` instead. `label` is the person's message and `aiUIActionJSON(action)` the router's `ui_action`, which it keeps on that message as `ai_ui_action` (`custom.ai_ui_action` on a stream-chat v10 message).
- Links from a reply's UI open through `host.open`: web and email links by default, since the agent writes them. Pass `open` to decide yourself.
- The app's tools a reply's UI can run are `AIUIClientTool`s: a `name`, a `description` and an `inputSchema` for the agent's model, `readOnly` for one that only reads, and `run`. `host.runTool(name, args, { userInitiated })` runs one that isn't read-only only when `userInitiated`, from something the person did, and rejects with an `AIUIToolError` naming the tool when it can't run, fails or gives what isn't JSON. `host.capabilities()` lists them for the agent's backend as MCP tools (`name`, `description`, `inputSchema`, `annotations.readOnlyHint`), and each renderer's instructions say how its format calls them.
- The app's components are described once, in portable JSON shared with the iOS and Android apps (`parseAIUIComponentDefinition`: `name`, `description`, `parameters` as a JSON Schema object with `x-order`, `events`). `defineAIUIComponent(definition, Component)` gives the view `args` (camelCase keys, dates as `Date`s, once they fit the parameters) and `context.emit(event, label, payload)`. `await host.capabilities()` describes the formats and components to the agent's backend, with each renderer's instructions for its model, as on iOS.
- `AIUIView` shows one reply's UI outside `AIConversation`; call `host.receive(messages)` as the messages change, and show the reply's text when `host.content(document, messageId)` is `null`, again whenever `host.subscribe` calls back. `host.hasFailed(messageId)` says whether a reply's UI failed to show.
- A renderer of your own can load its format's packages the first time a reply shows it with `AIUIRuntimeLoader` and `AIUIRuntimeView`, as the A2UI and OpenUI renderers do. When they can't load, such as after a deploy replaced the file they are in, the replies already written show their text, and the next reply the agent writes in the format tries again.

### A2UI

`stream-chat-react/a2ui` is the renderer of [A2UI](https://a2ui.org) 1.0, the counterpart of StreamChatA2UI. It is built on the official A2UI packages, which the app installs: they are optional peers of this package, which takes the patch releases of the version it is tested with (`~0.15.0`), since the 0.x packages change their API between minor versions.

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
- The app's components join the catalog under their A2UI type (`place_card` is `PlaceCard`), in the catalog `stream-app-catalog` (`A2UI_DEFAULT_CATALOG_ID`; `catalogId` to name another) and in the basic catalog, as on iOS, so the same instructions serve both apps. The agent writes the catalog id in every surface it makes, so it names no domain: a domain in it, as in the former default `getstream.io:app-catalog`, became a link preview under every A2UI reply. A renderer with the default id still shows surfaces that name the former one (`A2UI_LEGACY_CATALOG_ID`), so A2UI already in a conversation's history keeps showing; pick an id of your own without a domain, too. A conversation is read on every platform its people use, so the renderers there must know the id the agent writes: until your iOS and Android apps' renderers know `stream-app-catalog`, pass `catalogId: A2UI_LEGACY_CATALOG_ID` to keep writing the former id, or give every platform the same id of your own. A parameter takes the value its schema describes, or a binding (`@path`) or function (`@call`), which the component gets worked out.
- What the person does goes to `host.send` as an `AIUIAction`, as on iOS and Android: an A2UI event with what the tapped button says as the label (written or bound to the data model, else the event's name as words, such as "Submit form"), and `{ surfaceId, sourceComponentId, context, userMessage }` as its payload, so the agent's words never pass for the person's; with `dataModel` too when the surface was created with `sendDataModel`. What the person types in an obscured TextField, such as a password, is left out of all of it. An app component's event has its own label and payload, plus `component`. `openUrl` opens through `host.open`, from a tap only. Text renders with `AIMarkdown`, and its links open through `host.open` too, since the agent writes them.
- The app's tools (`AIUIHostOptions.tools`, each with a `description`, an `inputSchema` and `readOnly`) are listed in the instructions, and the agent calls one as a function the catalog doesn't define, `{"@call": "<name>", "args": {…}}`. A read-only one runs wherever it is called; any other only from a tap, through a button's `functionCall`.
- Images, videos and sounds load only what `mediaUrl` allows, before they draw: public web links and the page's own site by default (`aiUIPublicMediaURL`), not `data:` URLs or addresses on the person's network.
- `basicComponents` draws a basic component the app's way (`{ Divider: MyDivider }`), or leaves one out of the catalog and the instructions (`{ Video: null }`). An app's component named like a basic one is left out, and `onError` says so.
- What goes wrong, such as a message that is not JSON or a component the catalog lacks, goes to `onError` with the A2UI error code and the reply's id, and the rest of the reply still shows. A batch of components that one bad component spoils shows the others, whether in `updateComponents` or in the `createSurface` that makes the surface. What is wrong with the renderer rather than a reply, such as an app's component that can't join the catalog or packages that couldn't load, comes without an id.
- The parts a person sees most are Stream's: Button, Text, Card, TextField, ChoicePicker and Icon draw with this package's components and follow its theme, and the rest of the basic catalog, its layouts and media, draws with A2UI's own elements, themed with the AI components' tokens in `ai-components.css` (`.str-chat__a2ui` sets the `--a2ui-*` variables). A Button's words are the agent's, in the case it wrote them. A reply looks as it does in OpenUI: each surface is the reply's card, a Card in it a panel on it, a quote a callout behind its icon, chips pills with the chosen ones in the accent colour, a primary Button a pill as wide as the reply, and borderless Buttons follow-ups in the accent colour with a hairline between them. What the agent says about a part with its `accessibility` (`label`, `description`, `live`, `hidden`) reaches assistive technology as on A2UI's own parts and on iOS: a field's name is its input's, and a Card or Text the agent names is a group. A live reply's parts come in as the agent writes them, like an app component's, and a reply from history shows whole.
- `Icon` draws Stream's icon for about half of A2UI's 60 names, restyled like any SDK icon with `WithComponents`'s `icons`. `icons` gives the renderer the app's own for any name (`{ shoppingCart: CartIcon }`), and `iconFont` names an icon font the page loads, such as `'Material Symbols Outlined'`, for the rest. An icon none of them draws takes its place but shows nothing, rather than its name as words.
- Its Modal is a native dialog, which keeps focus in it while open, closes on Escape or its backdrop, gives focus back to what opened it, and shows above the reply's layout. A trigger other than a Button opens it from the keyboard too.
- `createA2UIRenderer().capabilities` tells the agent's backend the fence, the catalog id and the instructions for both with the app's components and tools, after the renderer's `instructions` when it has them, as StreamChatA2UI's do. It loads the A2UI core to write them; without them, when it can't load, the rest still goes.
- `a2uiInstructions(config)` writes what the agent's backend adds to its instructions, so its model writes A2UI this renderer shows: how a reply carries its UI, the protocol, the catalog's guidelines, and the catalog itself as JSON, with the app's components. It takes what StreamChatA2UI's `prompt.json` takes (`components`, `catalogId`, `fence`, `keep`, `preamble`, `notes`, `rules`, `examples`), and writes the app's components as iOS does, from the A2UI core's own catalog. It runs on a server or in a build, and rejects with an `A2UIInstructionsError` listing what is wrong when an example would not render: a broken example teaches the model broken UI.
- `a2uiProblems(text, config)` lists what is wrong with A2UI messages for that catalog, or nothing: messages that aren't JSON or come out of order, a surface created again without being deleted, components the catalog lacks or that don't fit their schemas, references that lead nowhere, a missing root, components nothing holds, and cycles. Each component is checked as the renderer checks it.
- The A2UI packages load in the browser the first time a reply shows A2UI, so server rendering shows a placeholder and an app whose agent never writes A2UI never loads them. The entry is ESM only, and `require` of it throws saying so; it needs React 18 or later.

### OpenUI

`stream-chat-react/openui` is the renderer of [OpenUI](https://openui.com), the counterpart of StreamChatOpenUI. It is built on the official OpenUI packages, which the app installs: they are optional peers of this package, which takes the patch releases of the versions it is tested with (`~`). `@openuidev/react-ui` needs `@openuidev/react-headless` and `zustand` beside it. Their styles are the app's to import, and `ai-components.css` themes them.

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
- What the person does goes to `host.send` as an `AIUIAction`, as on iOS and Android: a button or follow-up is `continue_conversation`, with what the control they pressed says as the label, and `{ context, message, params, form, values }` as its payload, where `message` is what the program wrote for the agent and `values` are the values of the form it belongs to. What the person types in a password input is left out of all of it and of what the host keeps. An action the library defines but the agent can't take isn't sent, and `onError` says so. An app component's event has its own label and payload, plus `component`. `@OpenUrl` and the links of its Markdown open through `host.open`.
- A program's `Query()` and `Mutation()` run the host's client tools, or the renderer's `toolProvider`: one that isn't read-only only within 5 s of the person pressing a control in that reply's UI, such as a button (a press elsewhere on the page, such as sending a message, doesn't count), and a Query asking the same again within 5 s gets the answer it got, however often the agent asks it to refresh. Images load only what `mediaUrl` allows, as in A2UI.
- What the person chose in a reply's forms is kept by the host, so it survives scrolling.
- What is wrong with a finished reply's program, such as a component the library lacks, goes to `onError` with OpenUI's error code and the reply's id, once, and the rest of the reply still shows. An app's component left out of the library, or packages that couldn't load, come without an id. While the agent writes it, what a program lacks is still coming, so nothing is reported.
- `.str-chat__openui` sets OpenUI's `--openui-*` variables from the AI components' tokens, so its components follow Stream's light and dark themes, and draws the parts a person sees most as StreamChatOpenUI does on iOS, as the A2UI renderer does too: the reply's card on a raised surface, callouts tinted in their variant's colour with its icon, chips as pills with the chosen ones ticked in the accent colour, buttons as pills sharing their row, and follow-ups in the accent colour with no heading. The rest, such as its chart palette, stays OpenUI's own.
- `createOpenUIRenderer().capabilities` tells the agent's backend the fence, `openui-lang`, and the instructions with the app's components and tools, saying which a Query may run, after the renderer's `instructions`, as StreamChatOpenUI's do. `openUIInstructions(components, { tools, instructions })` writes the same instructions on their own, with OpenUI's own prompt generator. Both load the OpenUI packages, so ask for them where that is fine, such as once at build time or when the app starts its conversation.
- `@openuidev/react-lang` mounts OpenUI's inspector on the page in development, with offers of OpenUI's own; the renderer keeps it off unless `devtools: true`.
- The OpenUI packages load the first time a reply shows OpenUI, so server rendering shows a placeholder and an app whose agent never writes OpenUI never loads them. It needs React 18.3 or later.
- `@openuidev/lang-core`'s install script reports the install to OpenUI's analytics, anonymously, unless `OPENUI_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` is set. It sends nothing from a browser; on a server, only with `OPENUI_RUNTIME_TELEMETRY_ENABLED=1`.

### Steps, questions and sign-ins

- `AIMessageParts` / `AIMessagePart`: a reply's steps, each as `AIReasoning`, `AIToolCall` (with `AIToolApproval` and `AIToolAuthorization` under it), or a neutral line for a step this SDK can't show.
- `AIToolCall`: the call's `displayTitle` (else its name), what it waits for or how it ended, and its duration once finished.
- `AIToolApproval`: the question of a call that waits for this person here, sent with `approver.decide(call, allowed)`. The buttons wait until the call's step changes; a rejected `decide` shows "Your answer couldn't be sent. Try again." and lets them answer again (`AIToolApprovalState`: `isSending`, `failed`). `AIToolApprovalCard` is the same question on its own, such as on a voice call: `<AIToolApprovalCard approval={call.approval} onDecide={…} state={…} />`.
- What the call will send shows under its question: its `arguments` as JSON (`AIToolArguments`), in full when short, else collapsed under "What it sends", which the person opens. `approver.argumentsPreview(call)` shows them your way, such as `Posts "Off to Ohrid" in #travel`; it returns `null` to show nothing, or `undefined` for the default. `AIToolApprovalCard` takes the preview as `argumentsPreview`, and `AIToolApproval`'s `children` get it as their fourth argument. A call carries `arguments` when the agents router sends them, which it always does for client tools.
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

- `AIReplyActions`: a ‹ i/n › switcher between the reply's versions (with `branch`), copy, share (`navigator.share` where the browser has it, else a copy), regenerate (with `onRegenerate`) and a thumbs up or down rating (with `onRate`; `AIMessageRating` is `positive` or `negative`, and `null` takes a rating back).
- `AISuggestions`: starter chips for an empty conversation; picking one calls `onSelect(text)`.
- `AIMessageComposer.ChatOptions`: a menu of ways to ask, such as "Think harder" (`AIChatOption`: `id`, `title`, `description?`, `icon?`, `shortTitle?`, `customData?`), and a chip for the one picked with a button that removes it. Controlled with `selectedId` and `onSelectedChange`, or uncontrolled with `defaultSelectedId`; with `name`, the picked id is submitted with the form. The picked option is kept in the composer's store as `chatOption`, where a `conversation` finds it when the message is sent, and stays picked after a form reset. `ChatOptionsList` and `SelectedChatOptionChip` are its parts, for layouts of your own.
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

All strings go through `t()` with namespaced keys and inline English defaults, like the rest of `stream-chat-react` v15. English is the only bundled language. To translate the components, register a dictionary on your `Streami18n` instance (`i18n.registerTranslation(lang, dict)`), exactly as for the core SDK keys (see `ai-docs/i18n-v15-migration.md`). Inside `<Chat>` the active language is used.

Outside `<Chat>` (or a `TranslationProvider`), `t()` is the default translator, which renders each call site's inline English copy. There are no raw keys and nothing to wrap: the labels read `Send`, `File upload` and so on.

Every key the components use:

| Key                                                           | English                                                               | v14 key                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `aiComponents.a2ui.choicePickerFilter.placeholder`            | Search                                                                | `Search`                                                                |
| `aiComponents.attachmentPreview.deleteAttachment.ariaLabel`   | Delete attachment                                                     | `Delete attachment`                                                     |
| `aiComponents.attachmentPreview.unknownFileName.text`         | Unknown file name                                                     | `Unknown file name`                                                     |
| `aiComponents.chart.loading.text`                             | Loading chart...                                                      | `Loading chart...`                                                      |
| `aiComponents.chart.unknownType.text`                         | Unknown chart type                                                    | `Unknown chart type`                                                    |
| `aiComponents.chatOptions.chatOptions.ariaLabel`              | Chat options                                                          | `aria/Chat options`                                                     |
| `aiComponents.chatOptions.removeOption.ariaLabel`             | Remove option: {{ option }}                                           | `aria/Remove option: {{ option }}`                                      |
| `aiComponents.conversation.loadingOlderMessages.ariaLabel`    | Loading older messages                                                | `aria/Loading older messages`                                           |
| `aiComponents.conversation.scrollToLatest.ariaLabel`          | Scroll to latest                                                      | `aria/Scroll to latest`                                                 |
| `aiComponents.messageAttachment.file.text`                    | File                                                                  | `File`                                                                  |
| `aiComponents.messageAttachment.image.text`                   | Image                                                                 | `Image`                                                                 |
| `aiComponents.messageComposer.speechToText.ariaLabel`         | Start voice input                                                     | `aria/Start voice input`                                                |
| `aiComponents.messageComposer.textInput.placeholder`          | Ask a question...                                                     | `Ask a question...`                                                     |
| `aiComponents.messageParts.unsupportedStep.text`              | A step this app version can't show                                    | `A step this app version can't show`                                    |
| `aiComponents.reasoning.thinking.title`                       | Thinking…                                                             | `Thinking…`                                                             |
| `aiComponents.reasoning.thinkingFor.title`                    | Thinking… {{ duration }}                                              | `Thinking… {{ duration }}`                                              |
| `aiComponents.reasoning.thoughtFor.title`                     | Thought for {{ duration }}                                            | `Thought for {{ duration }}`                                            |
| `aiComponents.reasoning.thoughtProcess.title`                 | Thought process                                                       | `Thought process`                                                       |
| `aiComponents.replyActions.badResponse.ariaLabel`             | Bad response                                                          | `aria/Bad response`                                                     |
| `aiComponents.replyActions.copied.ariaLabel`                  | Copied                                                                | `aria/Copied`                                                           |
| `aiComponents.replyActions.copy.ariaLabel`                    | Copy                                                                  | `aria/Copy`                                                             |
| `aiComponents.replyActions.goodResponse.ariaLabel`            | Good response                                                         | `aria/Good response`                                                    |
| `aiComponents.replyActions.regenerate.ariaLabel`              | Regenerate                                                            | `aria/Regenerate`                                                       |
| `aiComponents.replyActions.replyActions.ariaLabel`            | Reply actions                                                         | `aria/Reply actions`                                                    |
| `aiComponents.replyActions.share.ariaLabel`                   | Share                                                                 | `aria/Share`                                                            |
| `aiComponents.stateIndicator.brewingUpAnAnswer.text`          | Brewing up an answer                                                  | `Brewing up an answer`                                                  |
| `aiComponents.stateIndicator.channelingMyInnerEinstein.text`  | Channeling my inner Einstein                                          | `Channeling my inner Einstein`                                          |
| `aiComponents.stateIndicator.connectingTheDots.text`          | Connecting the dots                                                   | `Connecting the dots`                                                   |
| `aiComponents.stateIndicator.consultingTheAiGods.text`        | Consulting the AI gods                                                | `Consulting the AI gods`                                                |
| `aiComponents.stateIndicator.cookingUpSomethingGood.text`     | Cooking up something good                                             | `Cooking up something good`                                             |
| `aiComponents.stateIndicator.crunchingTheNumbers.text`        | Crunching the numbers                                                 | `Crunching the numbers`                                                 |
| `aiComponents.stateIndicator.firingUpTheNeurons.text`         | Firing up the neurons                                                 | `Firing up the neurons`                                                 |
| `aiComponents.stateIndicator.puttingOnMyThinkingCap.text`     | Putting on my thinking cap                                            | `Putting on my thinking cap`                                            |
| `aiComponents.stateIndicator.readingTheDigitalTeaLeaves.text` | Reading the digital tea leaves                                        | `Reading the digital tea leaves`                                        |
| `aiComponents.stateIndicator.summoningMyInnerGenius.text`     | Summoning my inner genius                                             | `Summoning my inner genius`                                             |
| `aiComponents.stateIndicator.thinkingReallyHard.text`         | Thinking really hard                                                  | `Thinking really hard`                                                  |
| `aiComponents.stateIndicator.workingMyMagic.text`             | Working my magic                                                      | `Working my magic`                                                      |
| `aiComponents.suggestions.suggestions.ariaLabel`              | Suggestions                                                           | `aria/Suggestions`                                                      |
| `aiComponents.toolApproval.allow.label`                       | Allow                                                                 | `Allow`                                                                 |
| `aiComponents.toolApproval.answerNotSent.text`                | Your answer couldn't be sent. Try again.                              | `Your answer couldn't be sent. Try again.`                              |
| `aiComponents.toolApproval.arguments.ariaLabel`               | What it sends                                                         | `What it sends`                                                         |
| `aiComponents.toolApproval.arguments.label`                   | What it sends                                                         | `What it sends`                                                         |
| `aiComponents.toolApproval.dontAllow.label`                   | Don't Allow                                                           | `Don't Allow`                                                           |
| `aiComponents.toolAuthorization.answerNotSent.text`           | Your answer couldn't be sent. Try again.                              | `Your answer couldn't be sent. Try again.`                              |
| `aiComponents.toolAuthorization.connect.label`                | Connect                                                               | `Connect`                                                               |
| `aiComponents.toolAuthorization.connectedTo.text`             | Connected to {{ provider }}                                           | `Connected to {{ provider }}`                                           |
| `aiComponents.toolAuthorization.connecting.label`             | Connecting…                                                           | `Connecting…`                                                           |
| `aiComponents.toolAuthorization.notConnected.text`            | Not connected                                                         | `Not connected`                                                         |
| `aiComponents.toolAuthorization.notNow.label`                 | Not now                                                               | `Not now`                                                               |
| `aiComponents.toolAuthorization.popupBlocked.text`            | Your browser blocked the sign-in window. Allow pop-ups and try again. | `Your browser blocked the sign-in window. Allow pop-ups and try again.` |
| `aiComponents.toolAuthorization.signInCouldntOpen.text`       | The sign-in couldn't be opened. Try again.                            | `The sign-in couldn't be opened. Try again.`                            |
| `aiComponents.toolAuthorization.signInDidntComplete.text`     | The sign-in didn't complete.                                          | `The sign-in didn't complete.`                                          |
| `aiComponents.toolAuthorization.signInExpired.text`           | This sign-in has expired.                                             | `This sign-in has expired.`                                             |
| `aiComponents.toolCall.cancelled.text`                        | Cancelled                                                             | `Cancelled`                                                             |
| `aiComponents.toolCall.declined.text`                         | Declined                                                              | `Declined`                                                              |
| `aiComponents.toolCall.didntComplete.text`                    | Didn't complete                                                       | `Didn't complete`                                                       |
| `aiComponents.toolCall.waitingForApproval.text`               | Waiting for approval                                                  | `Waiting for approval`                                                  |
| `aiComponents.toolCall.waitingForDevice.text`                 | Waiting for the device                                                | `Waiting for the device`                                                |
| `aiComponents.toolCall.waitingForSignIn.text`                 | Waiting for you to sign in                                            | `Waiting for you to sign in`                                            |
| `aiComponents.userMessage.edit.ariaLabel`                     | Edit                                                                  | `aria/Edit`                                                             |
| `aiComponents.voiceVisualization.connecting.text`             | Connecting                                                            | `Connecting`                                                            |
| `aiComponents.voiceVisualization.listening.text`              | Listening                                                             | `Listening`                                                             |
| `aiComponents.voiceVisualization.ready.text`                  | Ready                                                                 | `Ready`                                                                 |
| `aiComponents.voiceVisualization.speaking.text`               | Speaking                                                              | `Speaking`                                                              |
| `aiComponents.voiceVisualization.thinking.text`               | Thinking                                                              | `Thinking`                                                              |
| `aiComponents.voiceVisualization.voiceAgent.ariaLabel`        | Voice agent: {{ state }}                                              | `aria/Voice agent: {{ state }}`                                         |
| `messageComposer.sendButton.send.ariaLabel` (core)            | Send                                                                  | `aria/Send`                                                             |
| `fileUpload.uploadButton.fileUpload.ariaLabel` (core)         | File upload                                                           | `aria/File upload`                                                      |
| `common.retryUpload.ariaLabel` (core)                         | Retry upload                                                          | `aria/Retry upload`                                                     |
| `common.search.ariaLabel` (core, A2UI)                        | Search                                                                | `Search`                                                                |
| `common.close.ariaLabel` (core, A2UI)                         | Close                                                                 | `Close`                                                                 |

The last five are core `stream-chat-react` keys that the components reuse (the A2UI renderer's ChoicePicker filter and Modal close button use the last two as their accessible names), so a translation you already registered for them applies here too. `ai-docs/i18n-v15-key-map.json` maps each v14 key to its v15 key. Where one v14 key became two (`File`, `Search`, `aria/Suggestions`, `aria/Remove option: {{ option }}` and `Your answer couldn't be sent. Try again.`), it lists the second under `also`: copy the translation to both. `Image` has no entry there, since core's own `Image` text has no v15 key; the table above gives the attachment's.

## Migrating from `stream-chat-react` v14

If you already use `stream-chat-react/ai-components` on v14 (shipped from 14.13.0; `VoiceWave`, `VoiceGlow` and `useAudioLevel` from 14.14.0; `AIConversation`, the reply's steps, approvals and sign-in, suggestions, reply actions and chat options from 14.15.0; generated UI with `stream-chat-react/a2ui` and `stream-chat-react/openui` from 14.16.0), the component API is identical on v15: same exports, props, class names and theming contract. Only the i18n keys changed. v14 used the English sentence (or an `aria/…` string) as the key; v15 uses namespaced keys. If you registered translations for these components, rename them with the table above or with `ai-docs/i18n-v15-key-map.json`. If you never translated them, there is nothing to do.

v15 bundles English only. If your app runs in another language and relied on the translations v14 shipped for these components, those strings now fall back to English on v15 until you register translations yourself with `i18n.registerTranslation(lang, dict)`. The v14 values live in the 14.x `src/i18n/*.json` files; the voice keys first appear in 14.14.0, so read them from that release or later (for example `git show v14.14.0:src/i18n/de.json`); map the keys with the table above or `ai-docs/i18n-v15-key-map.json`.

## Theming

Each AI component carries the `str-chat` theme scope itself, as `ChannelList` does. Rendered outside `ChatView`, `Channel`, `ChannelList` or another AI component, its root element gets the `str-chat` class with `Chat`'s `theme` (and `customClasses.chat` in place of `str-chat`), so its fonts and colors follow the SDK theme without a wrapper element of your own. Inside a scope it adds none, since a nested `.str-chat` would reset the tokens you override on the outer one. Without `Chat` it gets the plain `str-chat` scope. `AIMarkdown`, `AIUIRuntimeView` and `ChatOptionsList`, which have no root element of their own, get a layout-neutral (`display: contents`) wrapper instead.

Set a dark theme with `<Chat theme='str-chat__theme-dark'>`. To keep a `str-chat` element of your own instead, such as a dark container rendered without `Chat`, render `ThemeScopeProvider` inside it: an AI component can't see a class on your element, and without the provider it would scope itself again, with `Chat`'s theme or none, and reset the tokens your element sets.

```tsx
import { ThemeScopeProvider } from 'stream-chat-react/ai-components';

<div className='str-chat str-chat__theme-dark'>
  <ThemeScopeProvider>
    <AIMessageComposer onSubmit={ask} />
  </ThemeScopeProvider>
</div>;
```

The library never declares the `--str-chat__ai-*` custom properties. Each rule reads them with fallbacks:

```css
var(--str-chat__ai-bg-primary, var(--str-chat__background-core-elevation-0, #ffffff))
```

Precedence for every token except the code palette is: your `--str-chat__ai-*` override, then the `stream-chat-react` theme token (inside `.str-chat`, so the SDK light/dark themes apply automatically), then a built-in light literal (outside `.str-chat`). The `--str-chat__ai-syntax-*` palette has no SDK theme token: it falls back directly from your override to a built-in literal. Because nothing is declared by the library, overrides work at any scope, including `:root`.

| Token (`--str-chat__ai-…`) | Used for                                                   | SDK theme token (`--str-chat__…`) | Literal fallback |
| -------------------------- | ---------------------------------------------------------- | --------------------------------- | ---------------- |
| `bg-primary`               | code block background                                      | `background-core-elevation-0`     | `#ffffff`        |
| `bg-secondary`             | not read by the built-in rules (kept for compatibility)    | `background-core-surface-default` | `#f7f7f8`        |
| `bg-tertiary`              | not read by the built-in rules (kept for compatibility)    | `background-core-surface-strong`  | `#ececf1`        |
| `text-primary`             | not read by the built-in rules (kept for compatibility)    | `text-primary`                    | `#353740`        |
| `text-secondary`           | AI state indicator text and dots                           | `text-secondary`                  | `#565869`        |
| `border`                   | composer, model select and attachment borders              | `border-core-default`             | `#ccc`           |
| `border-subtle`            | table row separators                                       | `border-core-subtle`              | `#e9ecef`        |
| `surface-hover`            | composer round-button hover                                | `background-utility-hover`        | `#e8e8e8`        |
| `surface-pressed`          | pressed (listening) speech-to-text button                  | `background-utility-selected`     | `#d1eaff`        |
| `button-bg`                | attachment delete/retry buttons                            | `background-core-surface-strong`  | `#e8e8e8`        |
| `inline-code-bg`           | inline code in `StreamingMessage`                          | `background-core-surface-default` | `#f5f5f5`        |
| `table-border`             | table header borders                                       | `border-core-default`             | `#dee2e6`        |
| `table-header-bg`          | table header and row hover background                      | `background-core-surface-subtle`  | `#f8f9fa`        |
| `table-header-text`        | table header text                                          | `text-primary`                    | `#212529`        |
| `table-text`               | table cell text                                            | `text-secondary`                  | `#495057`        |
| `scrollbar-track`          | attachment list scrollbar track                            | `background-core-surface-subtle`  | `#f1f1f1`        |
| `scrollbar-thumb`          | attachment list scrollbar thumb                            | `border-core-default`             | `#ddd`           |
| `voice-color`              | `VoiceWave` / `VoiceGlow` color when `colors` is unset     | `accent-primary`                  | `#005fff`        |
| `voice-backdrop`           | what `VoiceWave` / `VoiceGlow` sit on (light or dark)      | `background-core-elevation-0`     | `#ffffff`        |
| `accent`                   | tool call icons, reasoning rule while thinking, chips      | `accent-primary`                  | `#005fff`        |
| `success`                  | completed tool calls, connected sign-ins                   | `accent-success`                  | `#00a46e`        |
| `error`                    | failed tool calls, answers that couldn't be sent           | `accent-error`                    | `#d92f26`        |
| `text-tertiary`            | reasoning footnote                                         | `text-tertiary`                   | `#7a7d87`        |
| `card-bg`                  | approval and sign-in cards, files, suggestions             | `background-core-surface-card`    | `#f7f7f8`        |
| `card-border`              | approval and sign-in cards, files                          | `border-core-subtle`              | `#e9ecef`        |
| `elevated-bg`              | scroll-to-latest button, chat options menu                 | `background-core-elevation-1`     | `#ffffff`        |
| `user-message-bg`          | the person's message bubble                                | `chat-bg-outgoing`                | `#d2e3ff`        |
| `user-message-text`        | the person's message text                                  | `chat-text-outgoing`              | `#001a4d`        |
| `button-primary-bg`        | Allow and Connect buttons                                  | `button-primary-bg`               | `#005fff`        |
| `button-primary-text`      | Allow and Connect button text                              | `button-primary-text-on-accent`   | `#ffffff`        |
| `button-secondary-bg`      | Don't Allow and Not now buttons                            | `background-core-elevation-1`     | `#ffffff`        |
| `button-secondary-text`    | Don't Allow and Not now button text                        | `text-primary`                    | `#353740`        |
| `button-secondary-border`  | Don't Allow and Not now button border                      | `button-secondary-border`         | `#ccc`           |
| `link`                     | words in the accent colour in generated UI (else `accent`) | `text-link`                       | `#005fff`        |
| `color-scheme`             | native controls in generated UI, such as the date input    | the SDK theme (`light` / `dark`)  | `light`          |
| `syntax-*`                 | code palette (see below)                                   | none                              | built-in palette |

The code palette tokens are `--str-chat__ai-syntax-text`, `-selection-bg`, `-comment`, `-punctuation`, `-number`, `-keyword`, `-tag`, `-string`, `-function`, `-cyan`, `-error` and `-whitespace`.

In the SDK's dark theme, `button-primary-bg` falls back to the SDK's primary fill drawn a fifth of the way toward black, so the white words on it reach 4.5:1 (the SDK's dark `#4586ff` gives 3.4:1). The shade is worked out on the `.str-chat__theme-dark` element, from the SDK token there, in browsers with `color-mix()`; elsewhere the fill is the SDK's as it is. An app that sets `--str-chat__ai-button-primary-bg` gets that colour as it is.

An app that themes generated UI dark with these tokens alone, outside the SDK's dark theme, also sets `--str-chat__ai-color-scheme: dark`, so native controls such as the date input draw dark too.

### Generated UI

A2UI and OpenUI replies take every colour from these tokens, so an app that sets only `--str-chat__ai-*` themes them in both themes, inside a `.str-chat` element or outside one, where the SDK's theme tokens don't exist and the literal fallbacks apply.

- `.str-chat__a2ui` sets every `--a2ui-*` colour A2UI's own elements read (text, captions, tab titles, the open tab, inputs, focus, errors, the slider, the date input, the modal), and `.str-chat__openui` every `--openui-*` colour OpenUI's components read. Without them, A2UI falls back to a light theme's literals (dark tab titles at #666, 2.6:1), and OpenUI's follow the person's system rather than the SDK's theme.
- A2UI's buttons, chips, text fields and check marks are the SDK's own components. In a reply they take the AI tokens: `button-primary-bg` and `button-primary-text` for the main button and checked boxes, `button-secondary-*` for the others, `bg-primary` for fields (`--a2ui-color-input`), `border` and `text-*` for the rest. They're drawn in full by `ai-components.css`, so they need no `.str-chat` around the reply.
- Words in the accent colour (follow-ups, borderless buttons, the open tab, a chosen chip) take `link`, else `accent`, else the SDK's link colour, which reads on the SDK's surfaces in both themes where its accent doesn't. Words in the error colour take `error`, else the SDK's, drawn toward the text colour.
- `yarn validate-ai-ui-tokens`, run in CI, fails when either renderer reads a colour these leave unset, such as after an upgrade of its packages.
- The gallery in `examples/ai-ui-gallery` shows both formats in each theme, inside and outside `.str-chat`, with the SDK's tokens and with only an app's AI tokens, and its `screenshots` script checks every text against what is under it for 4.5:1.

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
      <AIMessageComposer.AttachmentPreview>
        {attachments.map((attachment) => (
          <AIMessageComposer.AttachmentPreview.Item key={attachment.id} {...attachment} />
        ))}
      </AIMessageComposer.AttachmentPreview>
      <AIMessageComposer.TextInput name='message' />
      <AIMessageComposer.Actions>
        <AIMessageComposer.FileInput name='attachments' />
        <AIMessageComposer.ModelSelect name='model' />
        <AIMessageComposer.SpeechToTextButton />
        <AIMessageComposer.SubmitButton />
      </AIMessageComposer.Actions>
    </AIMessageComposer>
  );
}
```

#### Layout

By default (`layout='stacked'`) the parts are stacked, one under another: put the controls in `AIMessageComposer.Actions`, a row that lines them up at its end, under the text. With `layout='inline'` the text and the controls share one line, the controls staying at its end as the text grows, which suits a composer whose only control is the send button. Attachment previews keep a full-width row above the line.

```tsx
<AIMessageComposer layout='inline' onSubmit={handleSubmit}>
  <AIMessageComposer.TextInput />
  {isAnswering ? (
    <AIMessageComposer.StopButton onClick={stop} />
  ) : (
    <AIMessageComposer.SubmitButton />
  )}
</AIMessageComposer>
```

#### Sub-components

- **`AIMessageComposer.FileInput`** - File input button for attaching files. Supports multiple file selection. The native `<input type="file">` is visually hidden but stays focusable (it is the keyboard stop, labelled with the `fileUpload.uploadButton.fileUpload.ariaLabel` string, "File upload", and opens the picker on Enter/Space); the round `<label>` that follows it is the pointer target and shows its focus ring. `labelProps` are spread onto that label.
- **`AIMessageComposer.TextInput`** - Where the message is written: a `textarea` that grows with its lines, up to 200 px, then scrolls. Enter sends, Shift+Enter starts a new line, and Enter while an input method is composing does neither. Automatically syncs with composer state.
- **`AIMessageComposer.SpeechToTextButton`** - Button to toggle speech-to-text input using the Web Speech API.
- **`AIMessageComposer.SubmitButton`** - Submit button for sending the message. In a composer with a `conversation`, a `StopButton` takes its place while the agent answers.
- **`AIMessageComposer.StopButton`** - A round button that stops a reply still being written, to show in place of `SubmitButton` meanwhile. It is `type="button"`, so it never submits, and it is named by the `messageComposer.stopAiGeneration.stopAiGeneration.ariaLabel` string ("Stop AI Generation"). Unlike the other parts it does not follow the composer's `disabled`, since the composer is often disabled exactly while a reply runs; pass `disabled` to it to disable it. Children replace its stop icon. In a composer with a `conversation` it stops the conversation's reply, unless its `onClick` calls `event.preventDefault()`.
- **`AIMessageComposer.Actions`** - A row for the controls, lined up at its end (`str-chat__ai-message-composer__actions`). Takes any `div` prop.
- **`AIMessageComposer.ModelSelect`** - Dropdown for selecting AI models. Customizable via `options` prop.
- **`AIMessageComposer.AttachmentPreview`** - Preview container for attached files.
- **`AIMessageComposer.AttachmentPreview.Item`** - Preview item component, renders a different look for file types that begin with `image/`.

#### Props

| Name                       | Type                                         | Required | Description                                                                                                                                                                                               |
| -------------------------- | -------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conversation`             | `AIConversationController`                   | no       | The conversation the person writes in: the composer shows its `composer` store and sends through it. See [`AIConversationController`](#aiconversationcontroller).                                         |
| `layout`                   | `'stacked' \| 'inline'`                      | no       | How the parts are arranged: one under another (`stacked`, the default), or the text and the controls on one line (`inline`). See [Layout](#layout).                                                       |
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
