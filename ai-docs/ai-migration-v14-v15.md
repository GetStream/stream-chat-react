# stream-chat-react v14 → v15 AI Migration Guide

Execution-only guide for a coding agent migrating a third-party app from `stream-chat-react` v14 to v15. Apply the changes below and fix each compile/runtime break before moving on. For evidence or edge cases, verify against the installed SDK source (see below).

> Status: this guide is seeded with the breaking changes confirmed while working on the v15 branch. It is **not yet exhaustive** — additional v15 breaking changes may exist. Always confirm a symbol/prop against the installed source before relying on it.

## Source of Truth

Never rely on training knowledge — the v14 surface is heavily represented in pretraining data and will mislead you. Before writing any code, verify against the user's installed packages:

1. `node_modules/stream-chat-react/dist/types/index.d.ts` — public React type surface (props, override keys, hook signatures).
2. `node_modules/stream-chat/dist/types/index.d.ts` — core client types: `Channel` methods (`messagePaginator`, `*WithLocalUpdate`, `messageOperations`), event names, etc.
3. `node_modules/stream-chat-react/package.json` — `exports` map and peer dependencies.

Rule: before claiming a symbol/prop/method exists or writing a replacement snippet, grep the installed `.d.ts` and read the current signature — do not reconstruct it from memory.

---

## The core v15 shift: channel state moved to the low-level client

The single largest v15 change: the React SDK no longer owns channel message state in a React reducer or exposes it through the `ChannelStateContext` / `ChannelActionContext`. Message data, pagination, and the write operations now live on the `stream-chat` **`channel` instance**, and the React components read it reactively via `useStateStore`. Everything else in this guide follows from that.

### Removed: `ChannelStateContext` / `ChannelActionContext` and their hooks

`ChannelStateContext`, `ChannelActionContext`, `useChannelStateContext`, and `useChannelActionContext` are **removed**. Read state and invoke actions off the `channel` instance instead.

**Reading state (was `useChannelStateContext`):**

| v14 (`useChannelStateContext`)                    | v15                                                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messages`                                        | `channel.messagePaginator.state.items` (subscribe with `useStateStore(channel.messagePaginator.state, …)`); `channel.state.messages` for the raw channel state |
| `hasMore` (older)                                 | `channel.messagePaginator.hasPrev`                                                                                                                             |
| `hasMoreNewer`                                    | `channel.messagePaginator.hasNext`                                                                                                                             |
| `loadingMore`                                     | `channel.messagePaginator.state` (`isLoading`)                                                                                                                 |
| `read` / `members` / `watchers` / `watcher_count` | `channel.state.read` / `channel.state.members` / `channel.state.watchers` / `channel.state.watcher_count`                                                      |

**Actions (was `useChannelActionContext`):** call the `channel` methods, which perform an optimistic local update and then the request:

- `sendMessage` → `channel.sendMessageWithLocalUpdate({ localMessage, message, options })`
- `editMessage` → `channel.updateMessageWithLocalUpdate({ localMessage, options })`
- `retrySendMessage` → `channel.retrySendMessageWithLocalUpdate({ localMessage, options })`
- `deleteMessage` → `channel.deleteMessageWithLocalUpdate({ localMessage, options })`
- `loadMore` / `loadMoreNewer` → `channel.messagePaginator.prev()` / `.next()` (and `.toHead()` / `.toTail()`)
- `jumpToMessage` → `channel.messagePaginator.jumpToMessage(id)`

These `*WithLocalUpdate` methods delegate to `channel.messageOperations`, which honours request handlers registered through `client.config` (see below).

### `MessageComposer` `overrideSubmitHandler` prop → removed

`MessageComposer` (formerly `MessageInput`) now owns the submission flow (`messageComposer.compose()` → `channel.sendMessageWithLocalUpdate()`), so the `overrideSubmitHandler` prop is gone. To customise sending:

- **Intercept the outgoing request** → register a `sendMessageRequest` handler on `client.config` (also `updateMessageRequest` / `deleteMessageRequest` / `markReadRequest`). `channel.messageOperations` uses it instead of the default request. The `do*Request` props that did this in v14 are removed — see "Per-component request-handler props removed" below.
- **Transform the composed message** → register composition middleware on `messageComposer`.

### `ChatContext.setActiveChannel` → removed

There is no `setActiveChannel` on `ChatContext`. Bind a channel by:

- passing it directly as the `channel` prop: `<Channel channel={channel}>…</Channel>` (the `Channel` component takes `channel` as a prop; it no longer reads it from context), and/or
- opening it in a `ChatView` layout slot — e.g. `open({ key: channel.cid, kind: 'channel', source: channel })` — the mechanism `ChannelListItemUI` uses on selection.

To ingest an ad-hoc channel (e.g. navigating to a DM or search result) into the paginators, use `channelManager.ingestChannel(channel)`. Confirm the exact `open()` / orchestrator signatures against the installed source.

### `ChatContext.channelsQueryState` → removed

`Channel` no longer reflects the channel-list query state. Its loading / error / empty rendering is driven by the channel's own `watch()` bootstrap (`LoadingIndicator` while watching, `LoadingErrorIndicator` on watch failure, `EmptyPlaceholder` when no channel is provided). The channel-list query state is the `ChannelList`'s concern, not `Channel`'s.

## Dates on response types are unix-nanosecond numbers

`stream-chat` now types every **server-sent** date as the unix-nanosecond `number` the API puts on the
wire — `created_at`, `updated_at`, `last_read`, and every sibling on a response or event. It is not a
`Date` and not an ISO string, and the React types that carry those values through changed with it.

Two failure modes, neither of which is a type error:

- **Every `Date`-based path is out of range.** `Date` tops out near 8.64e15 ms while a current
  timestamp is ~1.79e18, and a date library reads a bare number as **milliseconds** — so both land on
  an invalid instance rather than on a plausible wrong date. `.toISOString()` throws
  `RangeError: Invalid time value`, usually mid-render; `dayjs(created_at).format()` instead returns
  the literal string `Invalid Date` and renders it on screen.
- **A unit mix-up between two `number`s is the silent one.** Comparing a wire timestamp against
  `Date.now()`, or adding a millisecond duration to one, produces a plausible-looking number and no
  complaint at all — see `headerPosition` below for a case with no type change to warn you.

### The public React types that changed

| Type                                                  | v14                           | v15                             |
| ----------------------------------------------------- | ----------------------------- | ------------------------------- |
| `ChatContextValue.latestMessageDatesByChannels`       | `Record<ChannelConfId, Date>` | `Record<ChannelConfId, number>` |
| `ProcessMessagesParams.lastRead` (`processMessages`)  | `Date \| null`                | `number \| null`                |
| `VirtualizedMessageList` render props: `lastReadDate` | `Date \| null`                | `number \| null`                |

`DateSeparatorMessage` (a member of the exported `RenderedMessage` union) changed shape rather than
type: it **lost its `type: MessageLabel` field**, and `unread` is now optional. The `type` field was
never actually populated — every construction site cast the object into place without it — so reading
it was already `undefined` at runtime; it now fails to compile. `unread` is set only by the unread
separator; the plain day divider omits it. Narrow with `isDateSeparatorMessage` rather than checking
either field.

Comparisons get simpler, not harder — compare and sort the raw numbers and drop the `Date` round-trip:

```ts
// v14
if (latestMessageDatesByChannels[cid].getTime() < new Date(message.created_at).getTime()) { … }

// v15
if (latestMessageDatesByChannels[cid] < message.created_at) { … }
```

### Presentational props still take `Date`

The conversion boundary is where core data enters the component tree, so components that exist to
_render_ a date are unchanged — `DateSeparator`'s `date: Date` and `formatDate?: (date: Date) => string`,
for instance. Convert at that boundary with the guarded helper `stream-chat` exports:

`convertTimestampToDate` returns `Date | undefined` — `undefined` for an absent or non-finite value.
**Handle that `undefined`; do not cast it away.** A prop typed `date: Date` will accept it through a
cast and then fail somewhere further along: `isDateSeparatorMessage` (`src/components/MessageList/utils.ts`)
gates on `isDate(message.date)`, so the list stops recognising the object as a separator and renders it
as an ordinary message — an empty row where the day divider belonged, with no error and no type error.

```ts
import { convertTimestampToDate } from 'stream-chat';

const createdAt = convertTimestampToDate(message.created_at);

// Render nothing when there is no usable timestamp.
{createdAt ? <DateSeparator date={createdAt} /> : null}
```

```ts
// WRONG — the cast launders `undefined` into a required `Date`.
<DateSeparator date={convertTimestampToDate(message.created_at) as Date} />
// WRONG — invents "now", labelling a months-old message "Today".
<DateSeparator date={convertTimestampToDate(message.created_at) ?? new Date()} />
```

`nsToDate` / `dateToNs` / `nsToMs` / `msToNs` / `nowNs` are exported alongside it for values known to be
present. Note that **outgoing request** date fields are still `Date` (filter bounds like
`created_at_before`, plus `remind_at` and `message_timestamp`) — `JSON.stringify` emits RFC3339 for a
`Date`, which is what the request spec declares. Use `nsToDate` when handing a server-sent timestamp
back to the API.

### `MessageList`'s `headerPosition` prop changed unit, not type

`headerPosition` is compared against `message.created_at`, so it is now **unix nanoseconds** — it was
epoch milliseconds while `created_at` was a `Date`. The type is still `number`, so nothing warns.

### Peer-dependency gate before release

The SDK imports `convertTimestampToDate` / `nsToDate` / `nsToMs` from `stream-chat`, which only exist
from the version that ships `utils/time`. Until that is published, `package.json` pins
`stream-chat` exactly and the workspace resolves it through a local `portal:` — so a green local build
says nothing about whether a consumer can resolve these imports. Before publishing, widen the peer
range to the version that exports them and verify from a clean install with no `portal:` override.

### Test fixtures have to model the wire

A fixture that hands the SDK a `Date` cannot catch either failure mode above, and will diverge from
runtime behavior. The SDK's own suite normalizes through
`mock-builders/generator/time.ts` (`convertDateToTimestamp`), which accepts a `Date`, an ISO string or a
raw wire number so tests stay readable while the value on the wire stays a number.

## i18n: English-only bundle, namespaced translation keys

Two breaking changes, both of which fail **silently** — no error, no compile break unless the app
is typed against the new surface. Check for them explicitly.

1. **The 11 non-English dictionaries are removed** (`de`, `es`, `fr`, `hi`, `it`, `ja`, `ko`, `nl`,
   `pt`, `ru`, `tr`), along with their `dayjs` locale data. The `deTranslations` …
   `trTranslations` exports are gone.
2. **Keys are namespaced identifiers, not the English text.**
   `t('Send Message')` → `t('messageComposer.sendButton.send.ariaLabel', 'Send')`.

**What to look for in the app:**

| Symptom                                                          | Cause                                 | Fix                                                            |
| ---------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `registerTranslation(...)` / `translationsForLanguage` present   | keys are the old English strings      | rename every key                                               |
| `language: 'de'` (or any non-`en`) with no dictionary registered | the built-in one is gone              | register a dictionary                                          |
| non-English dates render in English                              | the dayjs locale is no longer bundled | `import 'dayjs/locale/de.js'` + `dayjsLocaleConfigForLanguage` |
| imports of `deTranslations` etc.                                 | exports removed                       | recover from a v14 tag, then rename                            |

An unrenamed key does **not** throw — it simply never matches, and the English copy renders
instead. Do not assume the absence of an error means the app is migrated.

**Renaming:** every old key maps to exactly one new key. The complete table is
[`i18n-v15-key-map.json`](./i18n-v15-key-map.json) (603 rows, `{ "<old key>": { "key": "<new key>",
"prose": bool, "plural"?: bool } }`). Entries with `"prose": false` hold formatter expressions
rather than copy. Four of them nonetheless carry English words inside their `calendarFormats`
argument — `timestamp.DateSeparator`, `timestamp.ReminderNotification`,
`timestamp.ChannelPreviewTimestamp`, `timestamp.ChannelDetailPinnedMessageTimestamp` — and must be
overridden to translate Today/Tomorrow/Yesterday/Last. `dayjsLocaleConfigForLanguage` does not
reach them, because a per-key `calendarFormats` replaces the locale's calendar.

`registerTranslation()` and `translationsForLanguage` take `TranslationDictionary` (exported from
`stream-chat-react`), so TypeScript flags every stale key in a dictionary written inline. Plural keys
accept any `Intl.PluralRules` category, so a language needing `_few` / `_many` / `_zero` stays
checked. Only if the app needs keys the SDK does not define, annotate the variable it passes as
`LooseTranslationDictionary` — that admits any key and will **not** flag a stale one.

Full detail, including plurals for languages needing `_few` / `_many` and how to recover a deleted
dictionary: [`i18n-v15-migration.md`](./i18n-v15-migration.md).

### `ChannelProps.EmptyPlaceholder` accepts `null`

`Channel`'s `EmptyPlaceholder` prop is now typed `React.ReactElement | null` (the default is `null`) — pass `null` to render an empty container when no channel is set. (Non-breaking widening; noted for completeness.)

### `ChannelListItem` `getLatestMessagePreview` prop → removed; customize via `SummarizedMessagePreview`

`ChannelListItem`'s `getLatestMessagePreview` prop and the `getLatestMessagePreview` util (previously re-exported from the package root) are **removed**, along with the `latestMessagePreview` prop on `ChannelListItemUIProps`. The default `ChannelListItemUI` renders the last-message preview via the `SummarizedMessagePreview` component, which is now overridable through `ComponentContext`.

- **Customize how the preview renders** → provide a `SummarizedMessagePreview` component override (via `ComponentProvider`, or the `<Chat>` / `<Channel>` component props). It receives `SummarizedMessagePreviewProps` (`{ latestMessage, messageDeliveryStatus, participantCount }`).
- **Preview a specific message** rather than the channel's latest (e.g. a search result previewing the matched message) → pass the new `previewedMessage?: LocalMessage` prop to `ChannelListItem`. It defaults to the channel's reactive latest, `channel.messagePaginator.aggregateState.lastMessage`.
- **Behavior note:** the preview now honors the channel's `skip_last_msg_update_for_system_msgs` config (a system message no longer becomes the previewed / last message), so the preview and the channel's sort position agree.

## Message UI overrides consolidate on the `MessageUI` slot

The deprecated `Message` component override is removed from `ComponentContext`, and so is every `Message` **prop** that took a message UI component. There is now exactly one way to override the message UI — the `MessageUI` slot — plus `VirtualMessage` for the virtualized list.

| v14                                                                                                                        | v15                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ComponentContext.Message` (deprecated in v14)                                                                             | `ComponentContext.MessageUI`                                   |
| `<Message Message={Custom} />`                                                                                             | `MessageUI` override                                           |
| `<MessageList Message={Custom} />`                                                                                         | `MessageUI` override                                           |
| `<VirtualizedMessageList Message={Custom} />`                                                                              | `VirtualMessage` override (falls back to `MessageUI`)          |
| `<Thread Message={Custom} />`                                                                                              | `MessageUI` override, scoped with `WithComponents` (see below) |
| `additionalMessageListProps` / `additionalVirtualizedMessageListProps` / `additionalParentMessageProps` carrying `Message` | `MessageUI` override                                           |

```tsx
// before
<WithComponents overrides={{ Message: CustomMessage }}>
  <Channel channel={channel}>
    <MessageList Message={CustomMessage} />
  </Channel>
</WithComponents>;

// after
<WithComponents overrides={{ MessageUI: CustomMessage }}>
  <Channel channel={channel}>
    <MessageList />
  </Channel>
</WithComponents>;
```

**`VirtualMessage` still wins inside the virtualized list**, and only there — `VirtualizedMessageList` applies it to its own subtree's `ComponentContext`, so it no longer needs to be drilled through a prop and no longer affects messages rendered outside the list:

```tsx
<WithComponents
  overrides={{ MessageUI: CustomMessage, VirtualMessage: CustomVirtualMessage }}
>
  <Channel channel={channel}>
    <VirtualizedMessageList /> {/* renders CustomVirtualMessage */}
    <MessageList /> {/* renders CustomMessage */}
  </Channel>
</WithComponents>
```

**Overriding only a thread's messages** (was `<Thread Message={…} />`) means scoping the slot to the thread's subtree:

```tsx
<WithComponents overrides={{ MessageUI: CustomThreadMessage }}>
  <Thread />
</WithComponents>
```

> **This can fail silently in untyped code.** In TypeScript every leftover is a compile error: `Message={…}` on `Message` / `MessageList` / `VirtualizedMessageList` / `Thread` fails with `TS2322`, and a stale `Message:` key in a `WithComponents` `overrides` object or in `additionalMessageListProps` fails with `TS2561` — which reports `Did you mean to write 'MessageUI'?`, so the compiler names the fix. In plain JS or behind an `any`, both are ignored with no warning and the **default** message UI renders. Grep for `Message=` and `Message:` rather than relying on the build to find them.

A custom message UI receives no props — read everything from `useMessageContext()`.

## Context hooks: no `componentName` argument, and required contexts throw

Two changes. The first is a compile break; the second only surfaces at runtime.

### The optional `componentName` argument is removed

```tsx
// v14
const { t } = useTranslationContext('EmojiPicker');
const { textareaRef } = useMessageComposerContext('EmojiPicker');

// v15
const { t } = useTranslationContext();
const { textareaRef } = useMessageComposerContext();
```

Affects `useChatContext`, `useTranslationContext`, `useMessageContext`, `useComponentContext`,
`useMessageComposerContext`, `useMessageListContext` and `useMessageBounceContext`. TypeScript flags
every call site (`TS2554`). In plain JS the extra argument is simply ignored — harmless, but dead;
drop it.

### Required contexts throw outside their provider

In v14 these hooks logged a `console.warn` and returned `{}`, so a component rendered outside its
provider rendered blank and usually failed later with `Cannot read properties of undefined`. In v15
the hook throws where the mistake is, naming itself and the provider it needs:

| hook                               | must be rendered within                 |
| ---------------------------------- | --------------------------------------- |
| `useChatContext`                   | `<Chat>`                                |
| `useMessageContext`                | `MessageProvider` (a rendered message)  |
| `useMessageComposerContext`        | `MessageComposerContextProvider`        |
| `useMessageListContext`            | `MessageListContextProvider`            |
| `useVirtualizedMessageListContext` | `VirtualizedMessageListContextProvider` |
| `useMessageBounceContext`          | `MessageBounceProvider`                 |
| `usePollContext`                   | `PollProvider`                          |
| `useDialogManager`                 | `DialogManagerProvider`                 |
| `useSearchContext`                 | `SearchContextProvider`                 |
| `useSearchSourceResultsContext`    | `SearchSourceResultsProvider`           |
| `useContextMenuContext`            | `ContextMenu`                           |
| `useChannelListItemContext`        | `ChannelListItemUI`                     |
| `useGalleryContext`                | `Gallery`                               |
| `useChatViewContext`               | `ChatView`                              |

**What to look for in the app:** any custom component that calls one of these hooks but is mounted
outside the provider — most often a custom message UI or attachment component rendered outside a
message, or a component mounted outside `<Chat>` for a loading / empty state. In v14 these rendered
blank with a console warning; in v15 they throw. Move them inside the provider, or wrap them in it.

These hooks are unchanged and still work outside their provider — no action needed:
`useTranslationContext` (renders the English copy), `useComponentContext` (empty override map),
`useChannelInstanceContext`, `useModalContext`, `useAriaLiveAnnouncer` and
`useMessageTranslationViewContext`.

### Related type changes

- `useChannelInstanceContext()` returns `Partial<ChannelInstanceContextValue>` — `channel` may be
  `undefined`. Use `useChannel()` when a channel is required; it throws.
- `ChatViewContext` has no default value, so `useContext(ChatViewContext)` may be `undefined`.
- `MessageComposerContext` is typed `MessageComposerContextValue | undefined`.
- The gallery header renders the gallery item's own timestamp and no longer honors the
  `ComponentContext.MessageTimestamp` override.

## Configuration: components read the resolved config, not raw server flags

The client combines each server flag with whatever the integrator registers through `client.config`, and
that combined value is what it enforces. Components used to read only the server's half, so a UI could
offer an action the client had already disabled. The sections below are the consequences of closing that
gap; they are all one change.

### Attachment/poll availability now reads the composer's resolved config, not raw server flags

`AttachmentSelector` used to decide which actions to offer by reading the channel type's raw server flags
off `ChannelStateContext` (`channelConfig?.uploads` / `.polls` / `.shared_locations`). It now reads the composer's **resolved**
configuration, which is those server flags already reconciled with whatever the integrator registered
through `client.config`. No React API changed — no prop, override key, or hook signature — but two
behaviours differ.

- **Declarative configuration now reaches the UI.** `client.config.set({ messageComposer: { attachments: { enabled: false } } })` (and the same for `polls` / `location`) hides the corresponding action. Previously only the server flag was consulted, so the menu offered actions the composer would refuse to compose. Either side can switch a feature off; neither can widen — see the LLC's `docs/instance-configuration.md`.
- **A custom `doUploadRequest` no longer implies a custom upload destination.** If yours uploads to storage Stream does not host, you must now declare it, or the File action disappears for users without the `upload-file` capability:

  ```ts
  client.config.set({
    messageComposer: { attachments: { customCdn: true } },
  });
  ```

  If your custom upload function still posts to Stream (a wrapper adding retries or headers, a proxy
  through your own backend), leave `customCdn` alone — Stream's capability correctly applies again.

`useAttachmentManagerState` additionally subscribes to the composer's configuration, so `isUploadEnabled`
and its siblings now re-render when that configuration changes. Purely additive; consumers need no change.

> Note: `isUploadEnabled` still does **not** re-render on an `own_capabilities` change. That predates v15
> and is unchanged here. Components that need it subscribe via `useChannelCapabilities`.

### `channel.getConfig()` → `channel.serverConfig`; `channel.config` is new

The LLC renamed the channel's server-configuration accessor to a getter that says what it returns, which freed `config` to mean on `Channel` what it means on every other configurable class:

| Read this                                                  | For                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `channel.serverConfig`                                     | The channel **type's** server flags (`replies`, `commands`, `url_enrichment`, …) |
| `useStateStore(channel.configState, …)` / `channel.config` | The **resolved** configuration — server flags ANDed with what you registered     |

`channel.getConfig()` is **removed** — `channel.serverConfig` is a getter returning the same value, so migrating is dropping the parentheses. **If you mock it in tests, note it is a getter** — `vi.fn()` cannot stand in for one; use `Object.defineProperty(channel, 'serverConfig', { get: … })` or a plain value.

The React SDK's own `useMarkRead` switched from `channel.getConfig()?.read_events` to the resolved `readEvents.enabled` via `useStateStore`, so it now honours `client.config.set({ channel: { readEvents: { enabled: false } } })` **and** re-runs when that changes — a plain method call could not, being outside React's dependency graph.

### `useAttachmentManagerState`: `hasCustomDoUploadRequest` → `customCdn`, plus the location and poll gates

`hasCustomDoUploadRequest` is **removed**. It answered "is a custom upload function installed?", which was only ever consulted as a proxy for "do uploads bypass Stream's rules?" — and the LLC now shows those are different questions: an upload function that still posts to Stream stays subject to them. Read `customCdn` instead, which is the flag that actually decides.

```ts
// v14
const { hasCustomDoUploadRequest } = useAttachmentManagerState();

// v15
const { customCdn } = useAttachmentManagerState();
```

The hook also now returns `attachmentsEnabled`, `locationEnabled`, `pollsEnabled` and `maxNumberOfFilesPerMessage`. The three gates are the composer's **resolved** answers, each already ANDed with the matching channel-type flag (`uploads`, `shared_locations`, `polls`) — so a menu can ask one hook instead of combining `channel.serverConfig` with client configuration itself. `location` and `polls` have no getter on the attachment manager; they exist only on the resolved configuration, which is why they are selected rather than read off the instance.

### Per-component request-handler props removed — register them on `client.config`

`doSendMessageRequest`, `doUpdateMessageRequest`, `doDeleteMessageRequest` and `doMarkReadRequest` are **removed** from both `<Channel>` and `<Thread>`. Register the handlers declaratively instead:

```tsx
// v14
<Channel channel={channel} doSendMessageRequest={mySend}>
  …
</Channel>;

// v15
client.config.set({
  channel: {
    requestHandlers: {
      sendMessageRequest: async ({ localMessage, message, options }) => ({
        message: await mySend(message, options),
      }),
    },
  },
});
<Channel channel={channel}>…</Channel>;
```

Three things change with it:

- **The handler signature is the LLC's, not the prop's.** Handlers take a single params object (`{ localMessage, message, options }`) and must return `{ message }`. The props took positional arguments and tolerated a `void` return, because an adapter inside the SDK filled in the rest.
- **`thread` variants are gone as a separate shape.** Thread flows register under the `thread` key (`client.config.set({ thread: { requestHandlers: … } })`); the LLC resolves per instance.
- **Registration is global to the client**, not scoped to a mounted subtree. If you were passing different handlers to different `<Channel>` instances, branch inside one handler on the `channel`/`cid` you receive.

`useChannelEditMessageHandler` is removed with them. It existed to apply `doUpdateMessageRequest` to the edit path and fell back to `client.updateMessage` when no handler was passed — with the prop gone it wrapped nothing. Register an `updateMessageRequest` handler as above; `channel.updateMessageWithLocalUpdate` already routes through it.

**Why.** The props and declarative registration wrote to the same slot, so the SDK carried a coordinator that tracked which mounted component owned each handler, restored the previous claimant on unmount, and re-applied everything whenever the LLC re-derived its configuration. All of that existed only to reconcile two ways of doing one thing. Removing the props deletes it — the SDK no longer arbitrates ownership, because there is only one owner.

### Channel configuration: `ChannelStateContext.channelConfig` → `channel.configState`

In v14 a component read the channel's configuration from `ChannelStateContext` as
`ChannelConfigWithInfo` — the channel type's raw server flags, copied into React state by `Channel`.
That context is gone, and so is the copy: configuration now lives on the channel as a reactive store.

```ts
// v14
const { channelConfig } = useChannelStateContext();
if (channelConfig?.typing_events) {
  /* … */
}

// v15
const configStateSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

const channel = useChannel();
const { typingEventsEnabled } = useStateStore(channel.configState, configStateSelector);
```

Two things change at once.

**The value is now _resolved_, not raw.** Every gate is the server flag ANDed with whatever the
integrator registered through `client.config`, so it is the whole answer to "may this channel do X".
Reading the raw flag is what let a UI offer features the client had already disabled. Field names
change with the shape:

| v14 (raw server flag)                   | v15 (resolved)                 |
| --------------------------------------- | ------------------------------ |
| `channelConfig?.typing_events`          | `typingEvents.enabled`         |
| `channelConfig?.read_events`            | `readEvents.enabled`           |
| `channelConfig?.replies`                | `replies.enabled`              |
| `channelConfig?.user_message_reminders` | `userMessageReminders.enabled` |
| `channelConfig?.commands`               | `availableCommands`            |

`availableCommands` is the server's list, unchanged in shape — it is a list, not a gate, so there is
nothing to reconcile. It is renamed for two reasons: whether a command is _usable_ right now is
`messageComposer.isCommandDisabled(command)` and depends on the message context, so "enabled" would be
wrong; and `messageComposer.config.commands` is an unrelated field holding `{ sendValidator }`.

**You subscribe rather than read.** Select only the settings you use: the controller keeps the
reference of every subtree a write does not touch, so a narrow selector means an unrelated
configuration change does not re-render you. The selector must live at module scope, since
`useStateStore` keys its subscription on it.

`channel.config` holds the same resolved value as a plain getter. It does **not** subscribe, so a
`client.config.set()` will not reach the screen — use it only where you are already re-rendering for
another reason.

Fields of `ChannelConfigWithInfo` that have no client-side counterpart are not on the resolved
configuration. Read them from `channel.serverConfig`, and be aware of what that means: you are getting
the server's half only, which is correct for a purely server-owned setting and wrong for anything the
integrator can also configure.

**Everything the React SDK reads now goes through the resolved configuration.** `serverConfig` has no
callers left in `src/`.

## Channel state moves to a single reactive store

The client replaced the per-domain stores on `channel.state` with one
`StateStore<ChannelStateData>`, subscribed to exactly like `thread.state`. Consumers previously had to
know which of ~6 sub-stores held a given field; there is now one store and one selector.

### The `*Store` handles are removed

`readStore`, `typingStore`, `membersStore`, `watcherStore`, `ownCapabilitiesStore` and `mutedUsersStore`
are gone from `ChannelState`. Subscribe to `channel.state` itself:

```ts
// v14
useStateStore(channel.state.ownCapabilitiesStore, ownCapabilitiesSelector);

// v15
useStateStore(channel.state, ownCapabilitiesSelector);
```

**The selector does not change.** `ChannelStateData` is flat and keeps the same top-level keys the old
per-store shapes used, so an existing `(s: OwnCapabilitiesState) => O` stays contravariantly assignable
to `(s: ChannelStateData) => O`. In practice the migration is: delete the `.<X>Store` segment.

The state gained the channel-level slices UI SDKs used to re-derive by hand — `data`, `membership`,
`muteStatus`, `initialized` / `offlineMode` / `pendingDisposal`, `active`, `aiState`, `watchStatus`,
`memberCount`. `messagePaginator`, `pinnedMessagesPaginator`, `messageComposer` and `configState` stay
separate.

Two type renames come with it:

| v14                    | v15                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| `WatcherState`         | `ChannelWatchState` (it now also answers whether _we_ are watching)    |
| `channel.disconnected` | `channel.pendingDisposal` (**removed outright — no deprecated alias**) |

`pendingDisposal` is one-way and terminal: the paginators are disposed, subscriptions unregistered, and
the client drops the channel from `activeChannels`, so the instance is never revived. `getClient()`
throws on such a channel — a reference held across a `disconnectUser()` now fails loudly rather than
quietly requesting on a client with no user.

### Reading channel state without re-rendering

The convenience getters (`channel.state.members` / `.read` / `.typing` / `.watchers`) are **not
reactive** — they return a one-shot snapshot. Use `useStateStore(channel.state, selector)` for anything
that must re-render. Two rules that bite:

- **Selectors must be module-scope**, because `useStateStore` keys its subscription on
  `[store, selector]`; an inline `(s) => ({ … })` re-subscribes every render.
- **Selectors must return direct slice references**, not freshly-computed values. `(s) => ({ read: s.read })`
  is fine; `(s) => ({ members: Object.values(s.members) })` returns a new array every call and re-renders
  forever. Derive in the component, after the selector.

Drive unread badges off `read`, not `unreadCount`: the latter is a non-reactive getter derived from
`read[ownUserId].unread_messages`, so there is nothing separate to select.

### `AIStates` moves to `stream-chat`

`stream-chat-react` no longer exports it.

```ts
// v14
import { AIStates } from 'stream-chat-react';

// v15
import { AIStates } from 'stream-chat';
```

The values are unchanged, but it is now a literal-typed `as const`, so an inferred array of its members
no longer accepts the wide `AIState` that `useAIState` returns. Widen the array:

```ts
const STOPPABLE: readonly AIState[] = [AIStates.Thinking, AIStates.Generating];
STOPPABLE.includes(aiState);
```

`useAIState`'s public shape (`{ aiState }`) is unchanged, but it now reads the reactive slice instead of
holding its own `ai_indicator.*` subscriptions — so it also honors `ai_indicator.stop` and the
connection-loss reset, which the event-based version had no way to do. `useIsChannelMuted` likewise
reads `muteStatus` instead of subscribing to `notification.channel_mutes_updated`.

### `<Channel>` declares the channel active, and owns its message window

`<Channel>` now calls `channel.activate()` on mount and `channel.deactivate()` on unmount (refcounted,
so several consumers can hold one instance), and calls `channel.reload()` on `connection.recovered`.

These two go together and **a custom channel surface must do both**. While a channel is active, the
client deliberately skips re-seeding its message list on channel-list hydration and on reconnect — its
smaller page would perturb a larger scrolled-back window — and hands that window to the consumer.
Nothing in the client calls `reload()` for you:

```ts
useEffect(() => {
  channel.activate();
  return () => channel.deactivate();
}, [channel]);

client.on('connection.recovered', () => {
  if (!channel.pendingDisposal) channel.reload().catch(handleError);
});
```

Skip the reload and the failure is quiet: the list keeps whatever it held while offline, and hard
deletes that happened meanwhile are never reconciled — they reach other clients via no event, so only a
re-query surfaces them. Guard on `pendingDisposal` because `reload()` goes through `getClient()`.

### Test mocks

`channel.state` **is** a `StateStore` now, so a plain-object mock crashes the `useStateStore` hooks with
`getLatestValue is not a function`. Build a real store (the SDK ships
`mock-builders/generator/channelState.ts` for its own suite). Also:

| v14 mock                          | v15                                              |
| --------------------------------- | ------------------------------------------------ |
| `vi.spyOn(channel, 'muteStatus')` | seed `channel.state.partialNext({ muteStatus })` |
| `channel.disconnected = true`     | `channel.pendingDisposal = true`                 |
