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

These `*WithLocalUpdate` methods delegate to `channel.messageOperations`, which honours per-request overrides registered through the `Channel` props (see below).

### `MessageComposer` `overrideSubmitHandler` prop → removed

`MessageComposer` (formerly `MessageInput`) now owns the submission flow (`messageComposer.compose()` → `channel.sendMessageWithLocalUpdate()`), so the `overrideSubmitHandler` prop is gone. To customise sending:

- **Intercept the outgoing request** → pass `Channel`'s `doSendMessageRequest` (also `doUpdateMessageRequest` / `doDeleteMessageRequest` / `doMarkReadRequest`). These are wired into `channel.messageOperations` and used instead of the default request.
- **Transform the composed message** → register composition middleware on `messageComposer`.

### `ChatContext.setActiveChannel` → removed

There is no `setActiveChannel` on `ChatContext`. Bind a channel by:

- passing it directly as the `channel` prop: `<Channel channel={channel}>…</Channel>` (the `Channel` component takes `channel` as a prop; it no longer reads it from context), and/or
- opening it in a `ChatView` layout slot — e.g. `open({ key: channel.cid, kind: 'channel', source: channel })` — the mechanism `ChannelListItemUI` uses on selection.

To ingest an ad-hoc channel (e.g. navigating to a DM or search result) into the paginators, use `channelPaginatorsOrchestrator.ingestChannel(channel)`. Confirm the exact `open()` / orchestrator signatures against the installed source.

### `ChatContext.channelsQueryState` → removed

`Channel` no longer reflects the channel-list query state. Its loading / error / empty rendering is driven by the channel's own `watch()` bootstrap (`LoadingIndicator` while watching, `LoadingErrorIndicator` on watch failure, `EmptyPlaceholder` when no channel is provided). The channel-list query state is the `ChannelList`'s concern, not `Channel`'s.

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
rather than copy — override those to change date formatting, not to translate.

Type the app's dictionaries as `TranslationDictionary` (exported from `stream-chat-react`) and
TypeScript will flag every stale key. `LooseTranslationDictionary` is the escape hatch — it admits
any key, so an app can register its own copy through the same instance, and it will **not** flag a
stale one.

Full detail, including plurals for languages needing `_few` / `_many` and how to recover a deleted
dictionary: [`i18n-v15-migration.md`](./i18n-v15-migration.md).

### `ChannelProps.EmptyPlaceholder` accepts `null`

`Channel`'s `EmptyPlaceholder` prop is now typed `React.ReactElement | null` (the default is `null`) — pass `null` to render an empty container when no channel is set. (Non-breaking widening; noted for completeness.)

### `ChannelListItem` `getLatestMessagePreview` prop → removed; customize via `SummarizedMessagePreview`

`ChannelListItem`'s `getLatestMessagePreview` prop and the `getLatestMessagePreview` util (previously re-exported from the package root) are **removed**, along with the `latestMessagePreview` prop on `ChannelListItemUIProps`. The default `ChannelListItemUI` renders the last-message preview via the `SummarizedMessagePreview` component, which is now overridable through `ComponentContext`.

- **Customize how the preview renders** → provide a `SummarizedMessagePreview` component override (via `ComponentProvider`, or the `<Chat>` / `<Channel>` component props). It receives `SummarizedMessagePreviewProps` (`{ latestMessage, messageDeliveryStatus, participantCount }`).
- **Preview a specific message** rather than the channel's latest (e.g. a search result previewing the matched message) → pass the new `previewedMessage?: LocalMessage` prop to `ChannelListItem`. It defaults to the channel's reactive latest, `channel.messagePaginator.aggregateState.lastMessage`.
- **Behavior note:** the preview now honors the channel's `skip_last_msg_update_for_system_msgs` config (a system message no longer becomes the previewed / last message), so the preview and the channel's sort position agree.
