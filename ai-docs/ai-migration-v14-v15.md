# stream-chat-react v14 → v15 AI Migration Guide

Execution-only guide for a coding agent migrating a third-party app from `stream-chat-react` v14 to v15. Apply the changes below and fix each compile or runtime break before moving on. For evidence and edge cases, verify against the installed SDK source (see below).

Every breaking change confirmed in [`ai-docs/v15-breaking-changes.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/v15-breaking-changes.md) (the audit this guide is written from, `BC-001` to `BC-077`) is covered here. The [index at the end](#index-of-breaking-changes) maps each `BC` entry to its section.

## Source of truth

Never rely on training knowledge. The v14 surface is heavily represented in pretraining data and will mislead you. Before writing any code, verify against the user's installed packages:

1. `node_modules/stream-chat-react/dist/types/index.d.ts`: the public React type surface (props, override keys, hook signatures). Entry points other than the root have their own folders: `dist/types/plugins/SlotLayout/` for `stream-chat-react/slot-layout`, and so on.
2. `node_modules/stream-chat/dist/types/index.d.ts`: the core client types. `Channel` (`channel.d.ts`: `messagePaginator`, `messageOperations`, `configState`, `watch`), `ChannelManager.d.ts`, `thread.d.ts`, `pagination/paginators/`, `messageOperations/types.d.ts`.
3. `node_modules/stream-chat-react/package.json`: the `exports` map and peer dependencies.

Rule: before claiming a symbol, prop or method exists, or writing a replacement snippet, grep the installed `.d.ts` and read the current signature. Do not reconstruct it from memory.

Rule: change only what a section says is broken. Much of the v14 / `stream-chat` v9 surface carries over (`client.channel()`, `channel.watch()`, `channel.markRead()`, ...). When existing app code still type-checks and does what the app needs, keep it. Make the smallest edit that fixes the break rather than rewriting the code into the shape of a snippet below. The snippets show one valid form, not the only one.

Links to this repository point at `master`, because `ai-docs/` and `examples/` are not in the npm package (`files` ships only `dist`, `package.json` and `README.md`), so an agent working in a consumer repo cannot read them from `node_modules`. At the stable v15 release, re-pin them to the release tag.

## How to migrate

Work through the sections in order. They follow the order an app is usually rebuilt in:

1. [Install and imports](#1-install-and-imports): dependency versions, moved and removed exports.
2. [Client and `<Chat>`](#2-client-and-chat)
3. [Layout: `Window` is gone, `ChatView` is rebuilt](#3-layout-window-is-gone-chatview-is-rebuilt)
4. [Selecting channels and opening threads](#4-selecting-channels-and-opening-threads-workspace-navigation)
5. [Providing a channel to `<Channel>`](#5-providing-a-channel-to-channel)
6. [Channel list](#6-channel-list)
7. [Threads](#7-threads)
8. [Channel and thread headers](#8-channel-and-thread-headers)
9. [Reading channel state](#9-reading-channel-state)
10. [Customizing components](#10-customizing-components)
11. [Message lists](#11-message-lists)
12. [Messages](#12-messages)
13. [Message composer](#13-message-composer)
14. [Request handlers](#14-request-handlers)
15. [Configuration](#15-configuration-components-read-the-resolved-config)
16. [Dates](#16-dates-on-response-types-are-unix-nanosecond-numbers)
17. [Other `stream-chat` v10 data shapes](#17-other-stream-chat-v10-data-shapes)
18. [i18n](#18-i18n)
19. [CSS and markup](#19-css-and-markup)
20. [Tests](#20-tests)

Then run the [silent-break checklist](#breaks-that-do-not-fail-to-compile) once more: those are the changes a green build does not prove.

## Breaks that do not fail to compile

These compile cleanly, or are ignored in plain JS, and change behavior at runtime. Check each one explicitly; the absence of an error does not mean the app is migrated.

| Symptom                                                                                                                                    | Cause                                                                                                                                                        | Fix                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clicking a channel-list row, a search result, a thread-list row or a message's reply button does nothing; no row shows active              | Selection and thread opening go through workspace navigation, whose default outside `ChatView` is a no-op (it logs a one-time console warning per operation) | Use `ChatView`, or provide `WorkspaceNavigationProvider` ([section 4](#4-selecting-channels-and-opening-threads-workspace-navigation))                          |
| No channel is open when the app loads                                                                                                      | v14 `ChannelList.setActiveChannelOnMount` defaulted to `true`; v15 selects nothing                                                                           | Open the first channel yourself ([section 6](#v14-list-defaults-that-changed))                                                                                  |
| Inside `ChatView`, returning from the threads view shows the first channel instead of the one that was open, and the channel list reloads  | `ChatView` unmounts the inactive view, so an auto-open guarded by a `useRef`, or a paginator created inside the view, starts over on every switch            | Create the paginator above `ChatView`; auto-open only while `openChannels` is empty ([section 6](#v14-list-defaults-that-changed))                              |
| Without `ChatView`, a default `ThreadHeader` shows no close button                                                                         | `defaultWorkspaceNavigation.isThreadDismissable` returns `false`                                                                                             | Override it in your provider ([section 4](#without-chatview))                                                                                                   |
| A new message in a channel outside the list's filters no longer adds that channel to the list                                              | v14 `allowNewMessagesFromUnfilteredChannels` defaulted to `true`; v15 adds only channels the filters match                                                   | Widen the paginator's filters ([section 6](#v14-list-defaults-that-changed))                                                                                    |
| The channel list scrolls infinitely instead of showing a "Load more" button                                                                | v14 `Paginator` defaulted to `LoadMorePaginator`                                                                                                             | Keep it, or render your own list ([section 6](#v14-list-defaults-that-changed))                                                                                 |
| Opening a thread no longer focuses its composer                                                                                            | v14 `Thread.autoFocus` defaulted to `true`, so every thread focused it                                                                                       | `<MessageComposer focus />` in the thread ([section 7](#thread-takes-a-thread-prop-and-renders-its-children))                                                   |
| A thread renders below the channel instead of beside it, or a panel collapses to a narrow column                                           | The channel no longer contains a flex row, and `ChatView` slots are `flex: 1 1 0` siblings                                                                   | Make your container a row; size panels by slot ([section 19](#panel-layout))                                                                                    |
| A channel name or image renders empty                                                                                                      | `name` / `image` are custom data in `stream-chat` v10: `channel.data.custom.name`                                                                            | Read `custom` ([section 17](#17-other-stream-chat-v10-data-shapes))                                                                                             |
| A held channel throws "pending disposal" after logout or a user switch                                                                     | `disconnectUser()` disposes the user's channels                                                                                                              | Drop held channels on disconnect ([section 4](#without-chatview))                                                                                               |
| A channel renders empty, with no error, and gets no new messages                                                                           | `Channel` no longer watches the channel                                                                                                                      | Watch it first: `channel.watch()` ([section 5](#channel-no-longer-watches-the-channel))                                                                         |
| A direct message the app just created renders, but new messages never arrive                                                               | The created members-only instance was superseded by the store's instance for the same cid                                                                    | Render the instance `watch()` resolves with ([section 5](#channel-no-longer-watches-the-channel))                                                               |
| After a failed send, the composer is empty instead of holding the text and attachments                                                     | The composer is released before the request and nothing is put back                                                                                          | Nothing to do; the failed message is retried from the list ([section 13](#a-failed-send-or-edit-no-longer-restores-the-composer))                               |
| A component that rendered blank outside its provider now throws                                                                            | Required context hooks throw instead of warning and returning `{}`                                                                                           | Render it inside the provider ([section 10](#required-context-hooks-throw-outside-their-provider))                                                              |
| A standalone `<Message>` (a preview, a pinned-message card) throws                                                                         | `Message` needs a channel in context                                                                                                                         | Wrap it in `ChannelInstanceProvider` ([section 12](#a-standalone-message-needs-a-channel-in-context))                                                           |
| The channel is not marked read                                                                                                             | Mark-read moved from `Channel` mount to the message list                                                                                                     | Render a message list, or mark read yourself ([section 5](#markreadonmount-is-removed-the-list-marks-read))                                                     |
| The tab title no longer shows `(3) Title`                                                                                                  | `Channel` no longer writes `document.title`                                                                                                                  | Write it in app code ([section 5](#channel-no-longer-writes-documenttitle))                                                                                     |
| Mount effects in a channel's children stop re-running when the channel changes                                                             | `Channel` no longer remounts its subtree per channel                                                                                                         | Depend on the `channel` instance ([section 5](#channel-lifecycle-activation-no-remount-no-reload-no-search-jump))                                               |
| After switching channels, a child still shows the previous channel's name, draft or other local state                                      | `Channel` no longer remounts its subtree, so `useState(valueFromChannel)` keeps the value of the first channel it saw                                        | Reset the state when `channel` changes ([section 5](#channel-lifecycle-activation-no-remount-no-reload-no-search-jump))                                         |
| Search results open unwatched, empty channels in a custom result component                                                                 | Search results are no longer watched                                                                                                                         | `watch()` on open ([section 4](#search-results))                                                                                                                |
| Translations or overrides stop applying; non-English UI renders English                                                                    | Keys renamed, non-English dictionaries removed                                                                                                               | Rename keys, register dictionaries ([section 18](#18-i18n))                                                                                                     |
| CSS on `.str-chat__main-panel`, `.str-chat__container`, `.str-chat__channel-list-inner` or `.str-chat__thread--virtualized` stops applying | Those wrappers and classes are gone                                                                                                                          | Grep for them, combinators included, and retarget ([section 19](#19-css-and-markup))                                                                            |
| Plain JS: `useCreateChatClient({ options })` stops applying `baseURL` and other settings                                                   | `options` was renamed to `config`                                                                                                                            | [Section 2](#usecreatechatclient-options--config)                                                                                                               |
| Plain JS: a removed prop or override key (`Message`, `HeaderStartContent`, `do*Request`, `overrideSubmitHandler`, ...) does nothing        | Ignored without a warning                                                                                                                                    | Grep for each removed name listed in this guide                                                                                                                 |
| A supplied composer keeps its content after `MessageComposer` unmounts                                                                     | A supplied composer is never cleared on unmount                                                                                                              | Call `composer.clear()` yourself ([section 13](#preventclearingonunmount-is-removed))                                                                           |
| A voice message stops another one playing in a different panel                                                                             | Playback is exclusive app-wide                                                                                                                               | Nothing to do ([section 12](#allowconcurrentplayback-is-removed-one-voice-message-plays-at-a-time))                                                             |
| The attachment menu offers different actions than before                                                                                   | Actions follow the composer's resolved configuration                                                                                                         | Set `customCdn` where it applies ([section 13](#attachment-and-poll-availability))                                                                              |
| A custom `MessageTimestamp` does not show in the header of a gallery you build yourself                                                    | The gallery renders outside a message and reads the item; it uses the override only when the item carries its `message`                                      | Set `message` on each `GalleryItem` ([section 12](#the-gallery-header-renders-the-messagetimestamp-override-for-items-that-carry-their-message))                |
| `dayjs(created_at)` renders `Invalid Date`                                                                                                 | Server timestamps are unix nanoseconds                                                                                                                       | Convert with `convertTimestampToDate` ([section 16](#16-dates-on-response-types-are-unix-nanosecond-numbers))                                                   |
| The "New Messages!" notification no longer shows after jumping to older messages                                                           | It shows only when a message arrives while the list is scrolled up                                                                                           | Read `messagePaginator.hasMoreHead` for an "older messages shown" indicator ([section 11](#the-new-messages-notification-shows-only-for-messages-that-arrived)) |
| The scroll-to-latest button shows a larger number than before                                                                              | It shows the channel's unread count for the current user, not the messages that arrived while scrolled up                                                    | Nothing to do; see [section 11](#scrolltolatestmessagebutton-shows-the-channels-unread-count)                                                                   |
| A custom loader given to `InfiniteScrollPaginator` (or `ChannelList` / `SearchSourceResultList`) is called earlier and more often          | `loadNextDebounceMs` now limits how often the scroll position is checked, rather than waiting for scrolling to stop                                          | Ignore calls while a page is loading ([section 11](#loading-older-messages-keeps-your-place-loadnextdebouncems-rate-limits-the-check))                          |

---

## 1. Install and imports

### Packages

- **`stream-chat` peer is v10.** Read the exact range from `peerDependencies['stream-chat']` in the installed `node_modules/stream-chat-react/package.json` and install a version that satisfies it; the minimum moves between release candidates. v9 does not satisfy it, and v10 is itself a breaking client release (see [`v10-breaking-changes.md`](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md) in stream-chat-js).
- **The first compile errors are usually `stream-chat` type changes, not React ones.** The removed-exports table below lists only this package's exports. The common ones from `stream-chat`: `ChannelSort`, `UserSort` and the other sort aliases → `SortParamRequest[]` ([sort](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#sort-shape)); `client.queryChannels` keeps its name but returns the raw response object, and the v9 behavior (`Channel[]`) is `client.queryChannelsAndHydrate` ([queryChannels](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#query-channels-raw)); `client.queryUsers(filter, sort, options)` → `client.queryUsers({ payload: { filter_conditions, sort, limit } })` ([generated signatures](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#generated-client-signatures)).
- **Node `>=22.18.0`.** `stream-chat@10` declares `engines.node >=22.18.0`, and Yarn 1 refuses to install on older Node. Move `.nvmrc` and every CI `node-version` (GitHub Actions `setup-node`, Docker base images, deploy workflows) to Node 22 before anything else: CI is usually the first thing to break.
- **`dayjs` and `i18next` are no longer dependencies of this package.** It depends on `@stream-io/i18n`, which brings both (`dayjs ^1.11.23`, `i18next ^26`). `stream-chat` v10 depends on neither. If the app declared them only because of this SDK, remove them. If it keeps `dayjs`, its version must dedupe with `@stream-io/i18n`'s, or `import 'dayjs/locale/xx'` registers the locale on a different instance and dates stay English.
- **`@stream-io/state-store` must resolve to exactly one copy.** `stream-chat`, `@stream-io/i18n` and this package hand each other store instances. `StateStore` has `protected` members, so stores from two copies are not assignable to `useStateStore`'s parameter. Check with `yarn why @stream-io/state-store` / `npm ls @stream-io/state-store`. A linked `stream-chat` checkout needs bundler dedupe.
- **New subpath exports:** `stream-chat-react/slot-layout` (`ChatView` and its slot system) and `stream-chat-react/slot-geometry`. `stream-chat-react/ai-components`, `/channel-detail`, `/emojis` and `/mp3-encoder` already existed.

```bash
find . -maxdepth 4 -name dayjs -type d -path '*node_modules*'   # expect exactly one
```

### Imports that moved

| Symbol                                                                                                                                                                                                                                                                                                       | v14 import          | v15 import                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ------------------------------------ |
| `ChatView`, `ChatViewContext`, `useChatViewContext`, `useActiveThread`, `ChatViewSelectorButton`, `ChatViewChannelsSelectorButton`, `ChatViewThreadsSelectorButton`, `ChatViewSelectorEntry`, `ChatViewSelectorItem`, `ChatViewSelectorItemProps`, `ChatViewSelectorProps`, `defaultChatViewSelectorItemSet` | `stream-chat-react` | `stream-chat-react/slot-layout`      |
| `AIStates`                                                                                                                                                                                                                                                                                                   | `stream-chat-react` | `stream-chat`                        |
| `getAttachmentPreviewUrl`, `isUploadConfirmationPending`                                                                                                                                                                                                                                                     | `stream-chat-react` | `stream-chat` (same behavior)        |
| `hasPendingUploadState`                                                                                                                                                                                                                                                                                      | `stream-chat-react` | `isPendingUpload` from `stream-chat` |
| `StateStore`                                                                                                                                                                                                                                                                                                 | `stream-chat`       | `@stream-io/state-store`             |

`stream-chat` v10 no longer exports `StateStore`. The old import still reads as correct but is `undefined` at runtime (`TypeError: StateStore is not a constructor`).

```ts
import {
  getAttachmentPreviewUrl,
  isPendingUpload, // was hasPendingUploadState
  isUploadConfirmationPending,
} from 'stream-chat';
```

### Exports that were removed

Each import below is now a compile error (`TS2305` / `TS2724`) and `undefined` in plain JS. The section named in the right column has the replacement.

| Removed export                                                                                                                                                                   | Replacement                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Window`, `WindowProps`                                                                                                                                                          | [Section 3](#window-and-windowprops-are-removed)                                          |
| `ChannelStateContext`, `ChannelStateContextValue`, `ChannelStateProvider`, `useChannelStateContext`, `ChannelState`, `ChannelNotifications`                                      | [Section 9](#channelstatecontext-and-channelactioncontext-are-removed)                    |
| `ChannelActionContext`, `ChannelActionContextValue`, `ChannelActionProvider`, `useChannelActionContext`, `MarkReadWrapperOptions`, `RetrySendMessage`                            | [Section 9](#channelstatecontext-and-channelactioncontext-are-removed)                    |
| `TypingContext`, `TypingContextValue`, `TypingProvider`, `useTypingContext`                                                                                                      | [Section 9](#typingcontext-is-removed)                                                    |
| `ChannelUnreadUiState`                                                                                                                                                           | [Section 9](#the-unread-snapshot-channelunreaduistate-is-removed)                         |
| `useThreadsViewContext`, `ThreadsViewContextValue`                                                                                                                               | [Section 3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots) |
| `getChannel`                                                                                                                                                                     | [Section 5](#channel-no-longer-watches-the-channel)                                       |
| `useChannelEditMessageHandler`                                                                                                                                                   | [Section 14](#14-request-handlers)                                                        |
| `useChannelMentionsHandler`                                                                                                                                                      | [Section 5](#props-that-moved-off-channel)                                                |
| `ChannelListUI`, `ChannelListUIProps`                                                                                                                                            | [Section 6](#channellistui-is-removed-use-the-list-slots)                                 |
| `usePaginatedChannels`, `useConnectionRecoveredListener`, `CustomQueryChannelParams`, `CustomQueryChannelsFn`, `EffectiveQueryParams`                                            | [Section 6](#channel-list-hooks-types-and-utilities-are-removed)                          |
| `moveChannelUpwards`, `findLastPinnedChannelIndex`, `extractSortValue`, `isChannelPinned`, `isChannelArchived`, `shouldConsiderPinnedChannels`, `shouldConsiderArchivedChannels` | [Section 6](#channel-list-hooks-types-and-utilities-are-removed)                          |
| `useLegacyThreadContext`                                                                                                                                                         | [Section 7](#thread-takes-a-thread-prop-and-renders-its-children)                         |
| `MESSAGE_ACTIONS`, `OPTIONAL_MESSAGE_ACTIONS`, `getMessageActions`, `MessageActionsArray`, `Capabilities`                                                                        | [Section 10](#messageactions-and-message_actions-are-removed)                             |
| `deTranslations` ... `trTranslations`, `enTranslations`, `isLanguageSupported`, `SupportedTranslations`, `DateFormatterOptions`                                                  | [Section 18](#18-i18n)                                                                    |

New root exports: `useMessagePaginator()` returns the active list's paginator (the thread's inside a thread, the channel's otherwise), and `useIsCooldownActive()` tells whether slow mode is counting down.

---

## 2. Client and `<Chat>`

### `useCreateChatClient`: `options` → `config`

`options` is renamed to `config`, and it takes the `stream-chat` configuration tree (`DeepPartial<InstanceConfigTree>`), not `StreamChatOptions`. In TypeScript the old key fails (`TS2353`). In plain JS it is ignored and settings such as `baseURL` stop applying.

```tsx
// v14
const client = useCreateChatClient({
  apiKey,
  options: { baseURL: 'https://chat-proxy.example.com' },
  tokenOrProvider,
  userData: { id: userId },
});
```

```tsx
import { useCreateChatClient } from 'stream-chat-react';

export const useClient = (apiKey: string, userId: string, token: string) =>
  useCreateChatClient({
    apiKey,
    config: {
      // was `isLocalUnreadCountEnabled`: the top-level `channel` key, not `client`
      channel: { readEvents: { localUnreadCountEnabled: true } },
      client: {
        baseURL: 'https://chat-proxy.example.com',
        connectionRecovery: { enabled: true }, // was `recoverStateOnReconnect`
        wsConnection: { enableWSFallback: true }, // was `enableWSFallback`
      },
    },
    tokenOrProvider: token,
    userData: { id: userId },
  });
```

- Client settings go under `client`. The keys it accepts are those of `ClientDeclarativeConfig` in the installed `stream-chat`: `allowServerSideConnect`, `axiosRequestConfig`, `baseURL`, `browser`, `persistUserOnConnectionFailure`, `notificationManager`, and the sub-trees `connectionRecovery`, `messageDelivery`, `networkConnection`, `notifications`, `reminders`, `threads`, `wsConnection`. Check the `.d.ts` before using one.
- v14's `StreamChatOptions` was `AxiosRequestConfig & {...}`, so top-level axios fields such as `timeout` now go under `client.axiosRequestConfig`.
- Four v14 options moved into config sub-trees. Do not drop them: leaving out `enableWSFallback`, for example, silently loses the WebSocket long-poll fallback.

  | v14 option                  | v15 `config` key                             |
  | --------------------------- | -------------------------------------------- |
  | `enableWSFallback`          | `client.wsConnection.enableWSFallback`       |
  | `wsUrlParams`               | `client.wsConnection.urlParams`              |
  | `recoverStateOnReconnect`   | `client.connectionRecovery.enabled`          |
  | `isLocalUnreadCountEnabled` | `channel.readEvents.localUnreadCountEnabled` |

- `device`, `disableCache`, `enableInsights`, `logger` and `warmUp` have no config key. `notifications` (a `NotificationManager` instance) is now `client.notificationManager`. `wsConnection` is a config object, not a connection instance.
- The full v9 → v10 option table is in [`v10-breaking-changes.md`](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md) in stream-chat-js. Do not restate it from memory.
- `userData` is typed `ClientUser`. `config` is read once, on the first render.

### `useChat` and `Chat.defaultLanguage`

- `useChat({ client })` returns `{ getAppSettings, mutes }` only. Its `defaultLanguage` and `i18nInstance` params and its `channel`, `setActiveChannel`, `latestMessageDatesByChannels` and `translators` results are removed.
- Translators come from `useStreami18n({ client, i18nInstance })`, which is what `Chat` itself calls.
- `<Chat defaultLanguage>` is removed. Set the language on the `Streami18n` instance you pass as `i18nInstance` (see [`i18n-v15-migration.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/i18n-v15-migration.md)).

```ts
// v14
const { translators } = useChat({ client, defaultLanguage, i18nInstance });
```

```ts
import type { StreamChat } from 'stream-chat';
import { type Streami18n, useChat, useStreami18n } from 'stream-chat-react';

export const useChatParts = (client: StreamChat, i18nInstance?: Streami18n) => {
  const { getAppSettings, mutes } = useChat({ client });
  const translators = useStreami18n({ client, i18nInstance });
  return { getAppSettings, mutes, translators };
};
```

### `ChatContext` fields

| v14 `useChatContext()` field   | v15                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channel` (the active channel) | Inside the channel subtree: `useChannel()`. Elsewhere: `useWorkspaceNavigation().openChannels`, or `useSlotChannel({ slot })` from `stream-chat-react/slot-layout`. See [section 4](#4-selecting-channels-and-opening-threads-workspace-navigation).                                            |
| `setActiveChannel`             | `useWorkspaceNavigation().openChannel(channel, { event })`. See [section 4](#4-selecting-channels-and-opening-threads-workspace-navigation).                                                                                                                                                    |
| `channelsQueryState`           | The channel list's own query state: `useChannelPaginatorState(paginator)` returns `{ channels, hasMoreHead, hasMoreTail, isLoading, lastQueryError }`; `hasMoreTail` says whether `paginator.toTail()` has another page. `ChannelList` reports `lastQueryError` through `client.notifications`. |
| `latestMessageDatesByChannels` | Slow-mode cooldown: `useCooldownRemaining()` or `useStateStore(channel.cooldownTimer.state, selector)`. The channel's latest message: `channel.messagePaginator.aggregateState` (`latestMessage`). When the current user last posted: not available; track it from `message.new` yourself.      |
| `mutes`                        | Unchanged, but typed `UserMuteResponse[]` (was `Mute[]`).                                                                                                                                                                                                                                       |
| `getAppSettings`               | Returns `ReturnType<StreamChat['getAppSettings']>`.                                                                                                                                                                                                                                             |

`latestMessageDatesByChannels` never held the channel's latest message date: it was filtered to the current user's own messages, to compute slow-mode cooldown, a job `channel.cooldownTimer` now owns. `channelsQueryState` used to drive a loading and error state inside `Channel`; `Channel` renders none now (see [section 5](#channel-requires-channel-and-renders-no-placeholder-loading-or-error-state)).

`ChatContextValue` gained a required `channelManager`. Code that builds a value by hand (a custom `ChatProvider` value, a test mock) must set `channelManager: client.channelManager`. `useChatContext` also lost its argument and throws outside `<Chat>` (see [section 10](#context-hooks-take-no-componentname-argument)).

### The lost-connection notification

- A WebSocket drop on a working network now shows "Reconnecting..." (key `chat.reportLostConnection.reconnecting.text`) instead of "Waiting for network...", which is still used when the device network is down.
- The display delay applies only to WebSocket drops: the banner waits `client.wsConnection.config.offlineNotificationDisplayDelayMs` (5 s by default) and is dropped if the socket returns within that window. A device-network loss shows immediately.
- `connection.changed` was removed from `stream-chat` v10, and nothing in the SDK listens to it. Use `useWSConnectionState()` / `useNetworkConnectionState()` (new root exports), or the `client.wsConnection.state` / `client.networkConnection.state` stores.
- The `system:network:connection:lost` notification type is unchanged.

---

## 3. Layout: `Window` is gone, `ChatView` is rebuilt

### `Window` and `WindowProps` are removed

There is no replacement component. Render `ChannelHeader` / `MessageList` / `MessageComposer` directly inside `<Channel channel={...}>`, and render the thread as a sibling with `<Thread thread={...}>`. `.str-chat__channel` (the `Channel` root) is now the flex column `Window` used to provide. Nothing places the thread beside the channel any more: give the element that holds both `display: flex` ([section 19](#panel-layout)). Multi-panel layouts come from `ChatView` slots (below), or from your own layout. `SlotGeometryProvider` is not a replacement: it only reports which slots are visually obscured.

```tsx
// v14
<Channel>
  <Window>
    <ChannelHeader />
    <MessageList />
    <MessageComposer />
  </Window>
  <Thread />
</Channel>
```

```tsx
import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
} from 'stream-chat-react';

export const ChannelPanel = ({
  channel,
  thread,
}: {
  channel: StreamChannel;
  thread?: StreamThread;
}) => (
  <>
    <Channel channel={channel}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
    {thread && (
      <Thread thread={thread}>
        <ThreadHeader />
        <MessageList />
        <MessageComposer />
      </Thread>
    )}
  </>
);
```

Where the `thread` comes from is [section 4](#4-selecting-channels-and-opening-threads-workspace-navigation). The removed CSS wrappers are in [section 19](#19-css-and-markup).

### `ChatView` moved to `stream-chat-react/slot-layout` and was rebuilt around slots

Import `ChatView` and its selector family from `stream-chat-react/slot-layout` (table in [section 1](#imports-that-moved)). The selector pieces keep their props; `ChatView` itself changed shape:

| v14                                                           | v15                                                                                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<ChatView.Channels>` / `<ChatView.Threads>` gated children   | `<ChatView layouts={...} views={{ channels: <...>, threads: <...> }} slotRenderers={...}>`. `ChatView.Channels` / `.Threads` are `undefined` at runtime ("Element type is invalid"). |
| `<ChatView.ThreadAdapter><Thread /></ChatView.ThreadAdapter>` | `<ThreadSlot slot='...'>` with the thread's contents as children, or `<Slot slot='...' />` with `slotRenderers`                                                                      |
| `useThreadsViewContext().activeThread`                        | `useSlotThread({ slot })`, or `useWorkspaceNavigation().openThreads`                                                                                                                 |
| `useThreadsViewContext().setActiveThread(thread)`             | `useWorkspaceNavigation().openThread(thread)`                                                                                                                                        |
| `useChatViewContext().activeChatView` / `.setActiveChatView`  | `useChatViewContext().activeView` / `.setActiveView`                                                                                                                                 |
| `useActiveThread({ activeThread })`                           | Same signature; it now holds the release function returned by `thread.activate()`                                                                                                    |
| `ChatView.Selector`                                           | Unchanged                                                                                                                                                                            |

`useChatViewContext()` now throws outside `ChatView` (v14 warned and returned `{}`). Children of `ChatView` still render, before the active view.

```tsx
// v14
<Chat client={client}>
  <ChatView>
    <ChatView.Selector iconOnly={false} />
    <ChatView.Channels>
      <ChannelList filters={filters} sort={sort} />
      <Channel>{/* ... */}</Channel>
    </ChatView.Channels>
    <ChatView.Threads>
      <ThreadList />
      <ChatView.ThreadAdapter>
        <Thread />
      </ChatView.ThreadAdapter>
    </ChatView.Threads>
  </ChatView>
</Chat>
```

v15, channels view, as in [`examples/tutorial/src/4-channel-list/App.tsx`](https://github.com/GetStream/stream-chat-react/blob/master/examples/tutorial/src/4-channel-list/App.tsx). The channel list's paginator must be registered first ([section 6](#channellist-is-driven-by-a-channelpaginator)):

```tsx
import type { StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
} from 'stream-chat-react';
import {
  ChatView,
  type ChatViewSlotRenderers,
  Slot,
} from 'stream-chat-react/slot-layout';

// Module scope: both feed the ChatView layout controller and must be referentially stable.
const layouts = [{ id: 'channels' as const, slots: ['left', 'right'] }];

const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => (
    <Channel channel={source}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
  ),
  thread: ({ source }) => (
    <Thread thread={source}>
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
    </Thread>
  ),
};

export const App = ({ client }: { client: StreamChat }) => (
  <Chat client={client}>
    <ChatView
      layouts={layouts}
      slotRenderers={slotRenderers}
      views={{
        channels: (
          <>
            <ChannelNavigation />
            <Slot slot='left' />
            <Slot slot='right' />
          </>
        ),
      }}
    >
      <ChatView.Selector iconOnly={false} />
    </ChatView>
  </Chat>
);
```

#### Channels and threads views

Two views, each with its own layout. The channel kind and the thread kind open into these slots by the rules [below](#where-an-opened-entity-lands):

```tsx
import type { StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  ChannelPlaceholder,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  ThreadList,
} from 'stream-chat-react';
import {
  ChannelSlot,
  ChatView,
  type ChatViewSlotRenderers,
  Slot,
  ThreadSlot,
} from 'stream-chat-react/slot-layout';

// Module scope: layouts, renderers and views must be referentially stable.
const layouts = [
  { id: 'channels' as const, slots: ['channel', 'channel-thread'] },
  { id: 'threads' as const, slots: ['thread'] },
];

// Used by a <Slot> without children, and for layers stacked over any slot.
const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => (
    <Channel channel={source}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
  ),
  thread: ({ source }) => (
    <Thread thread={source}>
      <ThreadHeader />
      <MessageList />
      <MessageComposer focus />
    </Thread>
  ),
};

const views = {
  channels: (
    <>
      <ChannelNavigation />
      {/* Children replace the renderer: this slot also shows UI while no channel is open. */}
      <Slot slot='channel'>
        <ChannelSlot
          fallback={<ChannelPlaceholder>Pick a conversation</ChannelPlaceholder>}
          slot='channel'
        >
          <ChannelHeader />
          <MessageList />
          <MessageComposer />
        </ChannelSlot>
      </Slot>
      {/* No children: renders `slotRenderers.thread` for a reply thread opened from a message. */}
      <Slot slot='channel-thread' />
    </>
  ),
  threads: (
    <>
      <ThreadList />
      <Slot slot='thread'>
        <ThreadSlot slot='thread'>
          <ThreadHeader />
          <MessageList />
          <MessageComposer focus />
        </ThreadSlot>
      </Slot>
    </>
  ),
};

export const App = ({ client }: { client: StreamChat }) => (
  <Chat client={client}>
    <ChatView layouts={layouts} slotRenderers={slotRenderers} views={views}>
      <ChatView.Selector iconOnly={false} />
    </ChatView>
  </Chat>
);
```

- **`<Slot>` children replace the renderer.** A `<Slot>` with children renders them for the slot's own binding; one without children renders the `slotRenderers` entry for the bound kind. Layers stacked over a slot always render through `slotRenderers`, so register a renderer for every kind that can land there.
- **`ChannelSlot` / `ThreadSlot`** resolve the entity bound to their slot and render `<Channel>` / `<Thread>` around their children. Without one bound they render `fallback`. UI that used to live inside `<Channel>` but must show while no channel is open (an empty state, a "create channel" panel) goes in `ChannelSlot`'s `fallback`, wrapped in `ChannelPlaceholder` so it fills the same column.
- **`ThreadSlot` hides its slot while empty.** `hideIfEmpty` defaults to `true`: with no thread bound it calls `layoutController.hide(slot)`, which marks that `<Slot>` section `str-chat__chat-view__slot--hidden`, and unhides it when a thread opens. Pass `hideIfEmpty={false}` to keep the slot visible (for example to show a `fallback`).
- [`examples/vite/src/ChatLayout/Panels.tsx`](https://github.com/GetStream/stream-chat-react/blob/master/examples/vite/src/ChatLayout/Panels.tsx) (`ChannelsPanels`, `ThreadsPanels`) is a complete app layout built this way, with resizable side panels.

#### Where an opened entity lands

`openChannel` / `openThread` (and the SDK components that call them) bind the entity into a slot of a view:

1. **The view.** The `channel` kind belongs to the `channels` view: opening a channel from the threads view switches to the channels view first. A `thread` declares no view and opens in the active view, so a reply opened from a message in the channels view stays there.
2. **The slot**, in that view's layout, in this order:
   1. an explicit `slot` option, if the layout has it;
   2. the slot already holding the same kind, so selecting another channel replaces the open one (skipped for an additive open, `{ additive: true }`);
   3. the first free non-persistent slot;
   4. the first free slot;
   5. the last non-persistent slot, evicting a secondary panel, never the primary.

   Persistent slots (the `channelList` / `threadList` kinds) are never an implicit target. If no slot qualifies, the open is rejected and nothing changes.

3. **Replace or stack.** The primary slot (the first non-persistent slot in the layout) always replaces its content. A secondary slot that is already occupied gets the entity stacked as a layer on top, and closing it reveals what was beneath.

In the example: selecting a channel binds it to `channel`, replacing the open one; a reply opened from a message goes to the free `channel-thread`; clicking a `ThreadList` row binds the thread to `thread`. Each view keeps its own slot state when you switch between them.

**The inactive view unmounts.** `ChatView` renders only the active view's element, so everything in `views.channels` (the channel list, its sidebar, your hooks) unmounts when the user switches to threads and mounts fresh on return. Only the slot bindings survive. Component state, refs and effects inside a view start over on every switch, so state that must outlive one (a `ChannelPaginator`, an "already opened the first channel" guard) lives above `ChatView` ([section 6](#v14-list-defaults-that-changed)). v14 kept the active channel in `ChatContext`, outside the view, so a remount lost nothing.

`ThreadList` rows open additively on ⌘/ctrl-click. Channel rows only forward the click event, so opening a channel _beside_ the current one is opt-in: pass `ChatView` a `deriveWorkspaceNavigation` whose `openChannel` sets `additive` from the event's modifier keys. With it, that channel lands in `channel-thread`.

**`ThreadSlot` and `ChannelSlot` wrap their children.** They resolve the entity bound to a slot and hand it to `<Thread>` / `<Channel>`, so their `children` are the thread's or channel's contents, not a substitute for the whole panel. Anything that has to sit outside the thread container (a panel shell your layout sizes) moves outside the slot; anything that needs the thread context must sit inside.

CSS on `.str-chat__chat-view__channels` / `__threads` now matches only when `ChatView` is given `views` ([section 19](#19-css-and-markup)).

---

## 4. Selecting channels and opening threads: workspace navigation

In v14, `ChatContext.setActiveChannel` selected a channel and `ChannelActionContext.openThread` (set up by `Channel`) opened a thread. Both are removed. Every SDK component that selects or opens something now calls `useWorkspaceNavigation()` (root export):

- `ChannelListItem` (a channel-list row): `openChannel(channel, { event })`; it shows as active when `isChannelActive(cid)` is true
- channel, message and user search results: `openChannel`
- `ThreadList` rows: `openThread(thread)`; active when `isThreadActive(id)`
- a message's reply action and reply-count button, "also sent in channel": `openThread({ channel, message })`
- `ThreadHeader`'s close button, `useCloseThread()`: `closeThread(threadId)`
- `ChannelHeader` / `ThreadHeader` back and close buttons: `canGoBack`, `goBack`, `isChannelDismissable`, `isThreadDismissable`
- `ChannelListHeader` shows `HeaderEndContent` only while `openChannels` is non-empty

The channel-detail "send direct message" member action and the pinned-message entry (from `stream-chat-react/channel-detail`) call `openChannel(channel)` too.

**Outside `ChatView` the default navigation is an inert no-op**, so all of the above does nothing: clicking a row opens nothing, no row is marked active, and the header buttons do not render. This is the most common silent break of the upgrade. Each operation (`openChannel`, `openThread`, `closeChannel`, `closeThread`, `goBack`) logs a one-time console warning when it runs with no navigation provided. `defaultWorkspaceNavigation` itself stays silent, so a provider built by spreading it does not warn.

### Inside `ChatView`

Nothing to wire. `ChatView` provides the navigation and binds what is opened into a layout slot. To customize it (for example, open beside the current channel on ⌘/ctrl-click), pass `deriveWorkspaceNavigation`, which receives the SDK-derived navigation and returns the members to override. It must be referentially stable.

### Without `ChatView`

Hold what is open in your own state and provide `WorkspaceNavigationProvider` with the navigation `createWorkspaceNavigation` (root export) builds from it. It models one channel panel with one thread panel beside it and derives every member the SDK reads, so list rows are marked active and the thread header's close button renders. Spread its result to override members.

A layout with more panels needs a navigation of its own, built from `defaultWorkspaceNavigation`. Every member you do not override keeps its inert default (`false`, a no-op, an empty list). Override:

- always: `openChannel`, `isChannelActive` and `openChannels`;
- if you render threads: `openThread`, `closeThread`, `openThreads`, `isThreadActive`, and `isThreadDismissable` if you render the default `ThreadHeader`, whose close button shows only when it returns `true`;
- if you render the default `ChannelHeader` and want its buttons: `isChannelDismissable` with `closeChannel` (close), and `canGoBack` with `goBack` (back). Leave them out for a single channel panel; the buttons then render nothing.

```tsx
// v14
<Chat client={client}>
  <ChannelList filters={filters} sort={sort} />
  <Channel>
    <Window>
      <MessageList />
      <MessageComposer />
    </Window>
    <Thread />
  </Channel>
</Chat>
```

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  type Channel as StreamChannel,
  type ChannelFilters,
  ChannelPaginator,
  type SortParamRequest,
  type StreamChat,
  type Thread as StreamThread,
} from 'stream-chat';
import {
  Channel,
  ChannelList,
  ChannelPlaceholder,
  Chat,
  createWorkspaceNavigation,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  WorkspaceNavigationProvider,
} from 'stream-chat-react';

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

export const App = ({ client, userId }: { client: StreamChat; userId: string }) => {
  const [activeChannel, setActiveChannel] = useState<StreamChannel>();
  const [activeThread, setActiveThread] = useState<StreamThread>();

  const paginator = useMemo(() => {
    const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
    return new ChannelPaginator({ client, filters, id: 'channels:default', sort });
  }, [client, userId]);

  useEffect(() => {
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client, paginator]);

  const navigation = useMemo(
    () =>
      createWorkspaceNavigation({
        channel: activeChannel,
        setChannel: setActiveChannel,
        setThread: setActiveThread,
        thread: activeThread,
      }),
    [activeChannel, activeThread],
  );

  return (
    <Chat client={client}>
      <WorkspaceNavigationProvider value={navigation}>
        <ChannelList paginator={paginator} />
        {activeChannel ? (
          <Channel channel={activeChannel}>
            <MessageList />
            <MessageComposer />
          </Channel>
        ) : (
          <ChannelPlaceholder />
        )}
        {activeThread && (
          <Thread thread={activeThread}>
            <ThreadHeader />
            <MessageList />
            <MessageComposer />
          </Thread>
        )}
      </WorkspaceNavigationProvider>
    </Chat>
  );
};
```

- An `openThread` target is either a `Thread` or `{ channel, message }`. `createWorkspaceNavigation` turns the latter into a registered `Thread` with `client.threads.ensure({ channel, parentMessage })`; a navigation of your own has to do the same.
- Opening a different channel closes the thread, and closing the channel closes both. `canGoBack` is always `false`: nothing is stacked.
- Instead of a navigation provider, `ChannelListItem` and the search result items take an `onSelect` prop that replaces their selection handler. That covers selection only: thread opening and the header buttons still read the navigation.
- **Drop held channels on `disconnectUser()`.** It disposes the user's channels, and a disposed channel throws `Channel <cid> is pending disposal and cannot be used` from `getClient()`, so rendering it (as `activeChannel` above, after a logout or a user switch) throws. Clear the state that holds channels and threads when you disconnect, or re-`ensure` them on the new connection. This also shows up in development when Fast Refresh keeps a stale channel in state across a reconnect.

### Opening a channel programmatically

- `useWorkspaceNavigation().openChannel(channel)`.
- To also add it to the matching channel lists without a re-query: `client.channelManager.ingestChannel(channel)`.
- v14's `setActiveChannel(channel, watchers)` `watchers` argument: watch the channel yourself before opening it with the same options, `await channel.watch({ watchers: { limit: 10 } })` (it sends nothing when the channel is already watched and loaded).

### Search results

- `stream-chat` v10 queries channel search results with `watch: false`. The SDK's result items watch on open (`watch()`, or `jumpToMessage(id, { watchChannel: true })` for a message result). **A custom search result component that only opens the channel now opens an unwatched channel**: no events, possibly empty. Call `channel.watch()` when opening.
- Default result items call `openChannel` and `client.channelManager.ingestChannel(channel)` instead of `setActiveChannel` and `ChannelListContext.setChannels`.
- Selecting a message result jumps with `channel.messagePaginator.jumpToMessage(...)`. The "jumped here" marker reads `messagePaginator.messageFocusSignal`, not `SearchController._internalState.focusedMessage`.

### `Message.openThread` and the lists' `openThread`

- `MessageList.openThread`, `VirtualizedMessageList.openThread` and `VirtuosoContext.openThread` are removed.
- `Message.openThread` remains, typed `(message: LocalMessage, event: BaseSyntheticEvent) => void` (the event is now required: a caller passing no event fails with `TS2554`). Lists no longer drill it, so it applies only to a `<Message>` you render yourself. There, both the reply action and the reply-count button honor it: `MessageRepliesCountButton` without an `onClick` calls the message's `handleOpenThread`. Without an override, both open the thread through workspace navigation.

---

## 5. Providing a channel to `<Channel>`

`Channel` takes exactly one prop, `channel`. It activates the channel on mount, releases it on unmount, seeds the paginator's unread snapshot and re-queries on `user.deleted`. Everything else it did in v14 moved to the code that chooses the channel.

### `Channel` requires `channel` and renders no placeholder, loading or error state

- `ChannelProps.channel` is required (`TS2741` without it). `Channel` no longer picks the channel up from `ChatContext`; in plain JS a missing channel crashes (`channel.activate` of `undefined`).
- `EmptyPlaceholder` is removed, and `Channel` no longer renders `EmptyStateIndicator` (`listType='message'`) when nothing is selected, nor `LoadingIndicator` / `LoadingErrorIndicator`. The `ComponentContext.LoadingErrorIndicator` slot is removed (a compile error in `WithComponents` overrides); the `LoadingErrorIndicator` component is still exported for your own error UI.
- Guard at the call site, and render the new `ChannelPlaceholder` (the same `.str-chat__channel` column, `children` allowed) while nothing is selected. Render loading and error UI yourself, around `Channel`.

```tsx
// v14
<Channel EmptyPlaceholder={<NoChannelSelected />}>
  <MessageList />
  <MessageComposer />
</Channel>
```

```tsx
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  ChannelPlaceholder,
  MessageComposer,
  MessageList,
} from 'stream-chat-react';

const NoChannelSelected = () => <p>Pick a conversation</p>;

export const Main = ({ activeChannel }: { activeChannel?: StreamChannel }) =>
  activeChannel ? (
    <Channel channel={activeChannel}>
      <MessageList />
      <MessageComposer />
    </Channel>
  ) : (
    <ChannelPlaceholder>
      <NoChannelSelected />
    </ChannelPlaceholder>
  );
```

### `Channel` no longer watches the channel

`Channel` used to call `channel.watch()` on mount. That call, `initializeOnMount`, `channelQueryOptions` and the `getChannel` util are removed. **An uninitialized channel passed to `Channel` renders as an empty channel, with no error, and receives no events.** If a channel renders blank, check `channel.initialized` first.

What to change depends on whether the app already watched the channel, and on whether the channel has an id:

- **Channels from `ChannelList` or any `queryChannels` call arrive watched.** Nothing changes for them.
- **The app already watches a channel it created by id** (`client.channel(type, id)` + `await channel.watch()`): **nothing changes.** `client.channel(...)` and `channel.watch(options)` still exist with the same roles; `client.channel()` is the public way to get a channel (it calls the internal `channelManager.ensure()`). Do not rewrite these calls. The only edit at such call sites is the `stream-chat` v10 input shape ([below](#channel-input-shape)).
- **Members-only channels** (`client.channel(type, { members })`, no id, as most "start a direct message" flows create): keep `client.channel()`, but **render the instance `watch()` resolves with**, not the one you created. The created instance is provisional until the server assigns the id, and the client may already hold a channel with that id (event routing can store it while the request is in flight). The store then keeps its own instance and marks yours superseded (`state.supersededBy` set, `watchStatus: NotWatching`), and yours receives no events. `watch()` resolves with the surviving instance, so code that keeps the created instance renders a channel that silently stops updating. `ChatView` swaps superseded channels in its slots, so this bites when the app holds the channel itself.
- **The app relied on `Channel` to watch** (rendered an instance it never watched, possibly with `channelQueryOptions`): watch it before rendering: `await channel.watch(options)`. It fits where the call can repeat, such as an effect: it sends nothing for a channel already watched and loaded and joins an in-flight watch with the same options, so an effect that runs twice still sends one query. It resolves with the channel; refresh a watched channel with `channel.reload()`.
- **`channelQueryOptions`** → pass them to that watch call (`ChannelGetOrCreateRequest`: `messages`, `members`, `watchers`, `presence`, `state`, `watch`, `data`, ...).
- **`getChannel({ client, id, type })`** → `await client.channel(type, id).watch()`.

A members-only channel the app already watched: keep `client.channel()`, take the instance from `watch()`, and fix the member shape:

```tsx
// v14
const channel = client.channel('messaging', { members: [userId, otherUserId] });
await channel.watch();
setActiveChannel(channel);
```

```tsx
// v15
const channel = await client
  .channel('messaging', { members: [{ user_id: userId }, { user_id: otherUserId }] })
  .watch(); // the surviving instance; the created one can be superseded
openChannel(channel); // useWorkspaceNavigation(), section 4
```

A channel created by id that the app already watched (`client.channel('messaging', 'general')` + `await channel.watch()`) needs no change.

`Channel` did the watching, so the watch moves to the app, with the options that were on `Channel`:

```tsx
// v14
const channel = client.channel('messaging', 'general');

<Channel channel={channel} channelQueryOptions={{ messages: { limit: 30 } }}>
  {/* ... */}
</Channel>;
```

```tsx
// v15, before rendering
const channel = client.channel('messaging', 'general');
await channel.watch({ messages: { limit: 30 } });

<Channel channel={channel}>{/* ... */}</Channel>;
```

```ts
// v14
const channel = await getChannel({ client, id: 'general', type: 'messaging' });
```

```ts
// v15
const channel = await client.channel('messaging', 'general').watch();
```

<a id="channel-input-shape"></a>

**Channel input shape (`stream-chat` v10).** The third argument of `client.channel()` is `ChannelInput`. `members` is `ChannelMemberRequest[]`, `{ user_id }` objects instead of an id list, and custom fields such as `name` go under `custom` (`{ custom: { name } }`). Plain ids now fail to compile (`TS2769`), though the API still accepts them at runtime (checked with `stream-chat@10.0.0-rc.22`), so this is a type fix, not a behavior change.

[`examples/vite`](https://github.com/GetStream/stream-chat-react/tree/master/examples/vite) and the tutorial steps show the full flow.

### Channel lifecycle: activation, no remount, no reload, no search jump

These keep the same signature and change behavior:

- **No remount per channel.** `Channel` no longer keys its subtree on `channel.cid`. Switching the `channel` prop keeps children mounted. A custom child that relied on remounting to reset local state or re-run a mount effect must depend on the `channel` instance instead (not on `channel.cid`). Nothing fails to compile. The common case is state seeded from the channel: `useState(channel.data?.custom?.name)` runs its initializer once, so after a switch the header still shows the previous channel's name. Reset it when the channel changes:

  ```tsx
  import { useEffect, useState } from 'react';
  import type { ChannelStateData } from 'stream-chat';
  import { useChannel, useStateStore } from 'stream-chat-react';

  // `name` is custom data in stream-chat v10; declare it once, app-wide (section 17).
  declare module 'stream-chat' {
    interface CustomChannelData {
      name?: string;
    }
  }

  const dataSelector = ({ data }: ChannelStateData) => ({ data });

  export const ChannelNameInput = () => {
    const channel = useChannel();
    const { data } = useStateStore(channel.state, dataSelector);
    const savedName = data?.custom?.name ?? '';
    // v14 remounted this per channel; in v15 `useState(savedName)` alone keeps the first channel's name.
    const [draft, setDraft] = useState(savedName);
    useEffect(() => setDraft(savedName), [channel, savedName]);
    return <input onChange={(event) => setDraft(event.target.value)} value={draft} />;
  };
  ```

- **Activation.** `Channel` calls `channel.activate()` on mount and the returned release on unmount (refcounted, so several consumers can hold one instance). While a channel is active, the client skips re-seeding its message list on channel-list hydration, which would perturb a larger scrolled-back window. A custom channel surface that does not render `Channel` must activate the channel itself, or the client re-seeds its list and `client.channelManager.releaseUnusedChannels()` may drop it.
- **No reload on reconnect.** `Channel` no longer calls `channel.reload()` on `connection.recovered`. The client reloads active channels itself after a reconnect, so a custom surface needs only the activation:

  ```ts
  import { useEffect } from 'react';
  import type { Channel } from 'stream-chat';

  export const useActiveChannel = (channel: Channel) => {
    useEffect(() => channel.activate(), [channel]);
  };
  ```

- **No search jump.** `Channel` no longer scrolls to a message focused from search (`SearchController._internalState.focusedMessage`). Call `channel.messagePaginator.jumpToMessage(id)` where the message is chosen (`thread.messagePaginator` for a thread reply); `MessageSearchResultItem` does. Pass `{ watchChannel: true }` to watch an unwatched channel with the request that loads the window. A jump restored from elsewhere, such as URL parameters on page load, is the same call: the focus signal waits until a list renders it.
- `Channel` no longer provides `ChannelStateContext`, `ChannelActionContext` or `TypingContext` ([section 9](#9-reading-channel-state)).

### `Channel` no longer writes `document.title`

`Channel` set `document.title` to `(3) Your app` when a message arrived while the tab was hidden, and `activeUnreadHandler` intercepted that. Both are removed, with no SDK replacement. Write the title in application code; [`examples/vite/src/DocumentTitleManager`](https://github.com/GetStream/stream-chat-react/tree/master/examples/vite/src/DocumentTitleManager) is a complete implementation (a component inside `Chat` that subscribes to the unread counts and restores the previous title on unmount).

When writing your own: the counts are user-scoped (the unread message total from the connection's `me` payload and `total_unread_count` on events; the unread thread count from `client.threads`), and they are different units, messages versus threads, so do not add them. The v14 behavior counted only the open channel and never restored the title.

### `markReadOnMount` is removed; the list marks read

`Channel` no longer marks the channel read when it mounts. `MessageList` / `VirtualizedMessageList` mark it read (`useMarkRead`) while the list is at the bottom, showing the live head, the tab is visible and the channel is not flagged unread. **A `Channel` rendered without a message list is never marked read**; call `channel.markRead()` yourself there. `markReadOnMount={false}` has no direct equivalent. To change how read requests go out, register a `markReadRequest` handler ([section 14](#14-request-handlers)).

### Props that moved off `Channel`

| Removed `ChannelProps`                                                                                     | v15                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `giphyVersion`, `imageAttachmentSizeHandler`, `videoAttachmentSizeHandler`, `shouldGenerateVideoThumbnail` | The same props on `Attachment`, applied app-wide through an `Attachment` override (below)  |
| `onMentionsClick`, `onMentionsHover` (and `useChannelMentionsHandler`)                                     | The same props on `MessageList` or `Message`                                               |
| `doSendMessageRequest`, `doUpdateMessageRequest`, `doDeleteMessageRequest`, `doMarkReadRequest`            | Handlers on `client.config` ([section 14](#14-request-handlers))                           |
| `skipMessageDataMemoization`                                                                               | None; it tuned the removed React channel reducer                                           |
| `allowConcurrentAudioPlayback`                                                                             | None ([section 12](#allowconcurrentplayback-is-removed-one-voice-message-plays-at-a-time)) |
| `activeUnreadHandler`, `markReadOnMount`, `initializeOnMount`, `channelQueryOptions`, `EmptyPlaceholder`   | Sections above                                                                             |

**Attachment props.** `Attachment` builds its own `AttachmentContextProvider` from its props and the defaults, so an outer `AttachmentContextProvider` does not reach the default attachments. Set them through the `Attachment` slot:

```tsx
// v14
<Channel channel={channel} giphyVersion='original' shouldGenerateVideoThumbnail={false}>
  {/* ... */}
</Channel>
```

```tsx
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Attachment,
  type AttachmentProps,
  Channel,
  MessageList,
  WithComponents,
} from 'stream-chat-react';

const CustomAttachment = (props: AttachmentProps) => (
  <Attachment {...props} giphyVersion='original' shouldGenerateVideoThumbnail={false} />
);

export const ChannelWithAttachments = ({ channel }: { channel: StreamChannel }) => (
  <WithComponents overrides={{ Attachment: CustomAttachment }}>
    <Channel channel={channel}>
      <MessageList />
    </Channel>
  </WithComponents>
);
```

Inside an attachment component, read them with `useAttachmentContext()`.

**Mention handlers.** The handler type is `(event, mentioned_users, message)`; the second argument is `@deprecated`, read the metadata from `message`. `VirtualizedMessageList` has no such prop (v14 virtualized lists got the handlers only from `Channel`), so a virtualized list needs a custom message UI to handle mention clicks.

```tsx
// v14
<Channel channel={channel} onMentionsClick={handleMentionClick}>
  <MessageList />
</Channel>
```

```tsx
<Channel channel={channel}>
  <MessageList onMentionsClick={handleMentionClick} />
</Channel>
```

---

## 6. Channel list

### `ChannelList` is driven by a `ChannelPaginator`

`ChannelList` props are now `{ paginator: ChannelPaginator; loadMoreDebounceMs?; loadMoreThresholdPx? }`. Every query, event and render prop is removed, and `ChannelList` no longer renders the list header, the search bar or the channel-list `NotificationList`.

| Removed `ChannelListProps`                                                                                                                                                                                                                           | v15                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters`, `sort`, `options`, `watchers`, `customQueryChannels`, `recoveryThrottleIntervalMs`                                                                                                                                                        | `new ChannelPaginator({ client, filters, sort, id, requestOptions?, paginatorOptions?, sortComparatorFactory? })` from `stream-chat`, registered with `client.channelManager.insertPaginator({ paginator })` so it receives WebSocket updates. `sort` is `SortParamRequest[]` (`[{ field, direction }]`). |
| `onAddedToChannel`, `onChannelDeleted`, `onChannelHidden`, `onChannelTruncated`, `onChannelUpdated`, `onChannelVisible`, `onMessageNew`, `onMessageNewHandler`, `onRemovedFromChannel`, `allowNewMessagesFromUnfilteredChannels`, `lockChannelOrder` | The `ChannelManager` (`client.channelManager.addEventHandler(...)`, its ownership resolver) and the paginator's `sortComparatorFactory`, in `stream-chat`                                                                                                                                                 |
| `customActiveChannel`, `setActiveChannelOnMount`                                                                                                                                                                                                     | Open a channel through workspace navigation ([section 4](#opening-a-channel-programmatically)). `setActiveChannelOnMount` defaulted to `true`: see [below](#v14-list-defaults-that-changed)                                                                                                               |
| `showChannelSearch`                                                                                                                                                                                                                                  | `<ChannelNavigation />` renders the header, search and every registered list. Search is always shown; hide it with a `Search: () => null` override.                                                                                                                                                       |
| `EmptyStateIndicator`, `Paginator`, `renderChannels`, `channelRenderFilterFn`, `sendChannelsToList`                                                                                                                                                  | The list slots ([below](#channellistui-is-removed-use-the-list-slots))                                                                                                                                                                                                                                    |
| `getLatestMessagePreview`                                                                                                                                                                                                                            | [Below](#channellistitem-props)                                                                                                                                                                                                                                                                           |

```tsx
// v14
const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
const sort: ChannelSort = { last_message_at: -1 };
const options: ChannelOptions = { limit: 10 };

<ChannelList filters={filters} options={options} showChannelSearch sort={sort} />;
```

```tsx
import { useEffect, useMemo } from 'react';
import {
  type ChannelFilters,
  ChannelPaginator,
  type SortParamRequest,
  type StreamChat,
} from 'stream-chat';
import { ChannelNavigation } from 'stream-chat-react';

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

// Call once, in the component that renders <Chat>, above ChatView.
export const useChannelPaginator = (client: StreamChat, userId: string) => {
  const paginator = useMemo(() => {
    const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
    return new ChannelPaginator({ client, filters, id: 'channels:default', sort });
  }, [client, userId]);

  useEffect(() => {
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client, paginator]);

  return paginator;
};

// Header, search and one ChannelList per registered paginator.
export const Sidebar = () => <ChannelNavigation />;
```

- **Create and register the paginator above `ChatView`**, not in the component that renders the list. `ChatView` unmounts the inactive view ([section 3](#where-an-opened-entity-lands)), so a paginator created inside `views.channels` is re-created and re-queried every time the user comes back from the threads view. A paginator that outlives the view keeps its loaded pages, and a remounted `ChannelList` queries only a paginator that was never loaded.
- `ChannelNavigation` finds every registered paginator through `client.channelManager`, so it takes no prop. Pass the paginator down only to code that needs it, such as `useOpenFirstChannel` [below](#v14-list-defaults-that-changed). If `views` then depends on it, build `views` with `useMemo`, since it must stay referentially stable.

A single list can still be rendered on its own with `<ChannelList paginator={paginator} />`; it has no header or search. Use `<ChannelLists />` for all registered lists without the header.

v14 `options` split in two: `options.limit` (the page size) → `paginatorOptions.pageSize`, and every other query option (`state`, `watch`, `presence`, `message_limit`, `member_limit`, ...) → `requestOptions` (`ChannelPaginatorRequestOptions` omits `limit` and `offset`):

```ts
import { ChannelPaginator, type StreamChat } from 'stream-chat';

export const createPaginator = (client: StreamChat, userId: string) =>
  new ChannelPaginator({
    client,
    filters: { members: { $in: [userId] }, type: 'messaging' },
    id: 'channels:default',
    paginatorOptions: { pageSize: 10 }, // was options.limit
    requestOptions: { message_limit: 30, presence: true }, // the rest of options
    sort: [{ direction: -1, field: 'last_message_at' }],
  });
```

### v14 list defaults that changed

These hit apps that never passed the props, because they were v14 defaults:

- **No channel opens on load.** `setActiveChannelOnMount` defaulted to `true`, so every v14 app opened the first channel. v15 has no default selection: nothing is open until you call `useWorkspaceNavigation().openChannel(channel)`. To keep the v14 behavior, open the paginator's first item when its first page loads:

  ```tsx
  import { useEffect, useRef } from 'react';
  import type { ChannelPaginator } from 'stream-chat';
  import { ChannelNavigation, useWorkspaceNavigation } from 'stream-chat-react';

  export const useOpenFirstChannel = (paginator: ChannelPaginator) => {
    const { openChannel, openChannels } = useWorkspaceNavigation();
    // Read when a page loads. The navigation changes with every open and close, and resubscribing
    // on it would replay a page that already loaded.
    const navigation = useRef({ hasOpenChannel: openChannels.length > 0, openChannel });
    useEffect(() => {
      navigation.current = { hasOpenChannel: openChannels.length > 0, openChannel };
    });

    useEffect(() => {
      // Each load counts once, so a channel that later moves to the top is not opened.
      // `items === undefined` means "never queried", where `client.disconnectUser()` resets the
      // list, so the next user's first load counts again.
      let awaitingLoad = true;
      return paginator.state.subscribeWithSelector(
        ({ items }) => ({ first: items?.[0], isUnloaded: items === undefined }),
        ({ first, isUnloaded }) => {
          if (isUnloaded) {
            awaitingLoad = true;
            return;
          }
          if (!awaitingLoad) return;
          awaitingLoad = false;
          // Check what is open, not a flag of this hook: a remount (a `ChatView` view switch
          // unmounts the list) must not replace the channel the user picked.
          if (first && !navigation.current.hasOpenChannel) {
            navigation.current.openChannel(first);
          }
        },
      );
    }, [paginator]);
  };

  // In `views.channels`; the paginator comes from useChannelPaginator, above ChatView.
  export const ChannelsSidebar = ({ paginator }: { paginator: ChannelPaginator }) => {
    useOpenFirstChannel(paginator);
    return <ChannelNavigation />;
  };
  ```

  - Call it below the navigation provider (inside `ChatView`, or inside your `WorkspaceNavigationProvider`), where `openChannel` does something.
  - Inside `ChatView`, call it in the channels view, not in an always-rendered `ChatView` child. `openChannels` lists the active view's channels only, so it is empty in the threads view, and opening a channel from there switches the user back to the channels view.
  - It opens once per load of the list: closing the last channel, or a channel moving to the top, opens nothing. After `client.disconnectUser()` resets the list, the next load opens its first channel again.
  - Create the paginator above `ChatView` too ([above](#channellist-is-driven-by-a-channelpaginator)); one created inside the view is replaced on every switch, and the hook then subscribes to a fresh, unloaded paginator.

- **Unfiltered channels no longer join the list.** `allowNewMessagesFromUnfilteredChannels` defaulted to `true`: a new message in a channel that was not in the list added it, whatever the list's filters. In v15 the paginator adds a channel only if it matches the paginator's own filters, and there is no opt-out. If channels used to appear this way, widen the filters to cover them.
- **Infinite scroll, not "Load more".** `Paginator` defaulted to `LoadMorePaginator` (a button). The v15 `ChannelList` always scrolls infinitely, loading the next page near the end of the list. To keep a button, render your own list:

  ```tsx
  import { useEffect } from 'react';
  import type { ChannelPaginator } from 'stream-chat';
  import {
    ChannelListItem,
    LoadMorePaginator,
    useChannelPaginatorState,
  } from 'stream-chat-react';

  export const ButtonPagedList = ({ paginator }: { paginator: ChannelPaginator }) => {
    const { channels, hasMoreTail, isLoading } = useChannelPaginatorState(paginator);
    // `undefined` means "never queried": on mount, and again after `disconnectUser` resets the list.
    useEffect(() => {
      if (channels === undefined) void paginator.toTail();
    }, [channels, paginator]);
    return (
      <LoadMorePaginator
        hasNextPage={hasMoreTail}
        isLoading={isLoading}
        loadNextPage={() => paginator.toTail()}
      >
        {channels?.map((channel) => (
          <ChannelListItem channel={channel} key={channel.cid} />
        ))}
      </LoadMorePaginator>
    );
  };
  ```

  `ChannelList` runs that first query itself; a list of your own has to, as above.

### `ChannelListUI` is removed; use the list slots

`ChannelListUI`, `ChannelListUIProps` and the `ComponentContext.ChannelListUI` slot are removed. `ChannelList` renders an `InfiniteScrollPaginator` and reads these `ComponentContext` slots instead (only `ChannelList` reads them today):

| Slot                        | Props                   | Default                   |
| --------------------------- | ----------------------- | ------------------------- |
| `EmptyListIndicator`        | none                    | the empty state           |
| `EndReachedIndicator`       | `{ hasEnded, reached }` |                           |
| `FirstPageLoadingIndicator` | none                    | `LoadingChannels`         |
| `ListItem`                  | `{ item }`              | renders `ChannelListItem` |
| `LoadingNextPageIndicator`  | `{ isLoading? }`        |                           |

`ComponentContext.LoadingIndicator` no longer affects the channel list (the `LoadingErrorIndicator` slot is removed, [section 5](#channel-requires-channel-and-renders-no-placeholder-loading-or-error-state)), and query errors are reported as a notification. For a fully custom list, read `useChannelPaginatorState(paginator)` and render your own.

```tsx
// v14
const CustomListUI = ({ children, loading }: PropsWithChildren<ChannelListUIProps>) =>
  loading ? <Spinner /> : <div className='my-list'>{children}</div>;

<WithComponents overrides={{ ChannelListUI: CustomListUI }}>
  <ChannelList filters={filters} />
</WithComponents>;
```

```tsx
import type { Channel } from 'stream-chat';
import { ChannelListItem, ChannelNavigation, WithComponents } from 'stream-chat-react';

const Spinner = () => <div className='my-spinner' />;

export const Sidebar = () => (
  <WithComponents
    overrides={{
      EmptyListIndicator: () => <p>No conversations</p>,
      FirstPageLoadingIndicator: Spinner,
      ListItem: ({ item }) => (
        <ChannelListItem channel={item as Channel} className='my-row' />
      ),
    }}
  >
    <ChannelNavigation />
  </WithComponents>
);
```

### Channel list hooks, types and utilities are removed

- **`usePaginatedChannels`** and the `CustomQueryChannelParams` / `CustomQueryChannelsFn` / `EffectiveQueryParams` types: the `ChannelPaginator` owns querying, pagination, reconnect recovery and the effective query (`paginator.effectiveFilters`, `paginator.effectiveSort`). Read it with `useChannelPaginatorState(paginator)`. Custom query functions: configure or subclass `ChannelPaginator` in `stream-chat`.
- **`useConnectionRecoveredListener(forceUpdate)`** only wrapped `client.on('connection.recovered', ...)`, which still fires in v10 (after the lists are re-queried and active channels reloaded). Use `const { unsubscribe } = client.on('connection.recovered', handler)`, or `useWSConnectionState()` for the raw socket status.
- **`moveChannelUpwards`, `findLastPinnedChannelIndex`, `extractSortValue`, `isChannelPinned`, `isChannelArchived`, `shouldConsiderPinnedChannels`, `shouldConsiderArchivedChannels`**: no export replaces them. Ordering is the paginator's comparator (`sortComparatorFactory`). Pinned and archived state is on the membership: `useChannelMembershipState(channel).pinned_at` / `.archived_at` (or `channel.state.membership`).

### `ChannelListContext` lost `channels`, `hasNextPage`, `loadNextPage` and `setChannels`

The context now carries `paginator` (optional; the primary registered `ChannelPaginator`) and is provided by `ChannelLists` (so by `ChannelNavigation`), not by a standalone `ChannelList`.

| v14              | v15                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `channels`       | `useChannelPaginatorState(paginator).channels`                                                                                   |
| `hasNextPage`    | `useChannelPaginatorState(paginator).hasMoreTail`                                                                                |
| `loadNextPage()` | `paginator.toTail()` (`next()` is removed in `stream-chat` v10)                                                                  |
| `setChannels`    | `paginator.setItems({ valueOrFactory })`; to add a channel to the matching lists, `client.channelManager.ingestChannel(channel)` |

```tsx
import type { ChannelPaginator } from 'stream-chat';
import { useChannelListContext, useChannelPaginatorState } from 'stream-chat-react';

const Count = ({ paginator }: { paginator: ChannelPaginator }) => {
  const { channels } = useChannelPaginatorState(paginator);
  return <span>{channels?.length ?? 0}</span>;
};

// Rendered inside ChannelNavigation / ChannelLists.
export const ChannelCount = () => {
  const { paginator } = useChannelListContext();
  return paginator ? <Count paginator={paginator} /> : null;
};
```

### `ChannelListItem` props

| v14                                                                                                                      | v15                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lastMessage` (on `ChannelListItemUIProps` and `ChannelListItemTimestamp`)                                               | `previewedMessage`. `ChannelListItem` also takes `previewedMessage` to preview a specific message (a search result previewing the match); it defaults to `channel.messagePaginator.aggregateState.lastMessage`.                                    |
| `latestMessagePreview` (`ChannelListItemUIProps`), `getLatestMessagePreview` (`ChannelListItem` and `ChannelList` props) | Render `<SummarizedMessagePreview latestMessage={previewedMessage} ... />`, or override the `SummarizedMessagePreview` slot with `WithComponents` (`SummarizedMessagePreviewProps`: `{ latestMessage, messageDeliveryStatus, participantCount }`). |
| `setActiveChannel`, `watchers`                                                                                           | `useWorkspaceNavigation().openChannel(channel, { event })`, or the `onSelect` prop ([section 4](#4-selecting-channels-and-opening-threads-workspace-navigation))                                                                                   |
| `channelUpdateCount`, `key`                                                                                              | None; the item subscribes to the channel's stores                                                                                                                                                                                                  |
| `active`                                                                                                                 | Unchanged prop; it now defaults to `useWorkspaceNavigation().isChannelActive(cid)`. `ChannelListItem` passes the resolved value to `ChannelListItemUI` as `active`, so a custom row UI reads `props.active` to highlight itself                    |

The `getLatestMessagePreview` and `getLatestMessagePreviewText` utilities are still exported; only their `t` / `userLanguage` parameter types changed. Prefer `WithComponents` for the slot override: it merges over the parent context, while `ComponentProvider` replaces it. Neither `Chat` nor `Channel` takes component props.

The preview now honors the channel's `skip_last_msg_update_for_system_msgs` config (a system message does not become the previewed message), so preview and sort position agree.

```tsx
// v14
const CustomItem = ({
  channel,
  displayTitle,
  latestMessagePreview,
  setActiveChannel,
}: ChannelListItemUIProps) => (
  <button onClick={() => setActiveChannel?.(channel)}>
    <strong>{displayTitle}</strong>
    <span>{latestMessagePreview}</span>
  </button>
);
```

```tsx
import {
  type ChannelListItemUIProps,
  SummarizedMessagePreview,
  useWorkspaceNavigation,
} from 'stream-chat-react';

export const CustomItem = ({
  channel,
  displayTitle,
  messageDeliveryStatus,
  previewedMessage,
}: ChannelListItemUIProps) => {
  const { openChannel } = useWorkspaceNavigation();
  return (
    <button onClick={(event) => openChannel(channel, { event })}>
      <strong>{displayTitle}</strong>
      <SummarizedMessagePreview
        latestMessage={previewedMessage}
        messageDeliveryStatus={messageDeliveryStatus}
      />
    </button>
  );
};
```

---

## 7. Threads

### `Thread` takes a `thread` prop and renders its children

`Thread` no longer reads the thread from context or renders a header, list and composer of its own. It takes the `stream-chat` `Thread` instance as a required `thread` prop, provides it to its subtree, loads it, scopes audio playback, and renders the children you compose. It does **not** register the thread with the `ThreadManager`: `client.threads.ensure()` or `thread.activate()` does that.

- `<Thread />` without `thread` is a compile error (`TS2741`). In plain JS a `<Thread>` with no children renders an empty container.
- `useLegacyThreadContext` is removed. Threads are `stream-chat` `Thread` instances only; there is no message-based "legacy" thread.
- `Thread` no longer remounts its subtree per thread, and renders nothing when the channel has replies disabled or the parent message is missing.
- Get the instance from `client.threads.ensure({ channel, parentMessage })` / `client.threads.get(...)`, from a `ThreadSlot`, or from workspace navigation.

| Removed `ThreadProps`                   | v15                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `additionalMessageComposerProps`        | Props on your `MessageComposer` child                                                                |
| `additionalMessageListProps`            | Props on your `MessageList` child                                                                    |
| `additionalVirtualizedMessageListProps` | Props on your `VirtualizedMessageList` child                                                         |
| `additionalParentMessageProps`          | A `ThreadHead` override on `ComponentContext` (typed `ComponentType<MessageProps>`)                  |
| `autoFocus` (default `true`)            | `<MessageComposer focus />` in every thread that should focus, whether or not you passed `autoFocus` |
| `enableDateSeparator`                   | `withDateSeparator` on the list                                                                      |
| `Message`                               | A `MessageUI` override scoped with `WithComponents`                                                  |
| `messageActions`                        | Removed ([section 10](#messageactions-and-message_actions-are-removed))                              |
| `virtualized`                           | Render the list you want                                                                             |

**Defaults changed.** A `MessageList` inside a thread now shows date separators unless you pass `withDateSeparator={false}` (v14's `Thread` turned them off). `autoFocus` defaulted to `true`, so every v14 thread focused its composer on open, not only threads that passed the prop; in v15 the composer is focused only if you render `<MessageComposer focus />`. The parent message is rendered by the message list, inside the scroll container; both lists resolve it from the thread context.

```tsx
// v14
<Thread
  additionalMessageComposerProps={{ audioRecordingEnabled: true }}
  additionalMessageListProps={{ onUserClick }}
  autoFocus
/>
```

```tsx
import type { Thread as StreamThread } from 'stream-chat';
import { MessageComposer, MessageList, Thread, ThreadHeader } from 'stream-chat-react';

export const ThreadPanel = ({
  onUserClick,
  thread,
}: {
  onUserClick: () => void;
  thread: StreamThread;
}) => (
  <Thread thread={thread}>
    <ThreadHeader />
    <MessageList onUserClick={onUserClick} withDateSeparator={false} />
    <MessageComposer audioRecordingEnabled focus />
  </Thread>
);
```

### `ThreadHeader` lost `closeThread` and `thread`

- `ThreadHeaderProps` is now `{ overrideTitle?, StartContent?, EndContent? }` ([section 8](#8-channel-and-thread-headers)). The `closeThread` and `thread` props are removed (`TS2339`).
- `ComponentContext.ThreadHeader` is removed: `Thread` renders no header, so the override is ignored. Render your header as a child of `<Thread>`.
- **Do not follow the compiler's hint.** A stale `ThreadHeader:` override key fails with `TS2561 ... Did you mean to write 'ThreadHead'?`. `ThreadHead` is the parent-message slot, so renaming the key renders your header as the thread's first message.
- Read the thread with `useThreadContext()` and its parent message from `thread.state`. Close it with the new `useCloseThread()` hook, or `useWorkspaceNavigation().closeThread(thread.id)`. Both close through workspace navigation, so they do nothing outside `ChatView` or a `WorkspaceNavigationProvider`.
- `useCloseThread()` returns `(options?: WorkspaceNavigationOptions) => void`, not a click handler: pass the event as `{ event }`. Its type is `WorkspaceNavigationTriggerEvent` (`React.MouseEvent | React.KeyboardEvent | React.TouchEvent`), narrower than the `React.BaseSyntheticEvent` that v14's `closeThread` took, so a handler typed `(event: React.BaseSyntheticEvent) => void` no longer fits; type it with the event it handles (`React.MouseEvent<HTMLButtonElement>`).

```tsx
// v14
const CustomThreadHeader = ({ closeThread, thread }: ThreadHeaderProps) => (
  <div>
    <span>{thread.user?.name}</span>
    <button onClick={closeThread}>Close</button>
  </div>
);

<WithComponents overrides={{ ThreadHeader: CustomThreadHeader }}>
  <Thread />
</WithComponents>;
```

```tsx
import type { Thread as StreamThread, ThreadState } from 'stream-chat';
import {
  MessageComposer,
  MessageList,
  Thread,
  useCloseThread,
  useStateStore,
  useThreadContext,
} from 'stream-chat-react';

const parentSelector = ({ parentMessage }: ThreadState) => ({ parentMessage });

const CustomThreadHeader = () => {
  const thread = useThreadContext();
  const { parentMessage } = useStateStore(thread?.state, parentSelector) ?? {};
  const closeThread = useCloseThread();
  return (
    <div>
      <span>{parentMessage?.user?.name}</span>
      <button onClick={(event) => closeThread({ event })}>Close</button>
    </div>
  );
};

export const ThreadPanel = ({ thread }: { thread: StreamThread }) => (
  <Thread thread={thread}>
    <CustomThreadHeader />
    <MessageList />
    <MessageComposer />
  </Thread>
);
```

### `ThreadProvider` no longer wraps its children in a `Channel`

v14's `<ThreadProvider thread={t}>` rendered `<Channel channel={t.channel}>` around its children, so it brought the `.str-chat__channel` container and the channel contexts. v15 provides only the thread context. Thread-scoped UI rendered with `ThreadProvider` alone loses the channel container and `ChannelInstanceContext` (`useChannel()` still resolves the thread's channel).

- Do not wrap `<Thread>` in `ThreadProvider`; `Thread` provides the thread.
- Keep `ThreadProvider` only for thread-scoped UI outside a `Thread`, and add `<Channel channel={thread.channel}>` yourself if that UI needs the channel subtree.

### `ThreadList`

- Mounting `ThreadList` calls `client.threads.reload({ force: true })` every time. v14 reloaded only when the manager was not ready, had unseen threads or a stale order.
- Clicking a row calls `useWorkspaceNavigation().openThread(thread)`, and a row is active when `isThreadActive(id)` ([section 4](#4-selecting-channels-and-opening-threads-workspace-navigation)). v14 used `ThreadsViewContext`.
- The list reads `client.threads.paginator.state`. Code reading `client.threads.state.threads` / `.pagination` breaks for `stream-chat` v10 reasons; read the paginator.

---

## 8. Channel and thread headers

`ComponentContext.HeaderStartContent` is removed (`TS2561`; in JS the custom content, often a sidebar toggle, silently disappears). `ChannelHeader` and `ThreadHeader` take the content as props:

| Prop           | Default                          | Shows                                                                                      |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `StartContent` | `WorkspaceNavigationBackButton`  | Back, when the channel or thread is stacked over other content in its panel                |
| `EndContent`   | `WorkspaceNavigationCloseButton` | Close, for a dismissable panel: a channel opened beside the primary one, or a thread panel |

- The v14 thread close button is now `ThreadHeader`'s `EndContent` default. It still renders as `str-chat__close-thread-button`, only for threads the navigation reports as dismissable. `ChannelHeader` gains the same pair (`str-chat__close-channel-button`, `str-chat__channel-header__back-button`).
- The buttons act on the panel they render in. A layout that renders its own panels declares them with `WorkspacePanelProvider`. Without a workspace navigation (outside `ChatView`, with no provider), nothing can be dismissed, so they render nothing.
- Passing a component replaces the default button. Render `WorkspaceNavigationBackButton` / `WorkspaceNavigationCloseButton` inside yours to keep it.
- `ComponentContext.HeaderEndContent` is unchanged and still feeds `ChannelListHeader` / `ThreadListHeader`, but `ChannelListHeader` shows it only while a channel is open in the workspace.

```tsx
// v14
<WithComponents overrides={{ HeaderStartContent: SidebarToggle }}>
  <Channel channel={channel}>
    <ChannelHeader />
  </Channel>
</WithComponents>
```

```tsx
import type { Channel as StreamChannel } from 'stream-chat';
import { Channel, ChannelHeader, WorkspaceNavigationBackButton } from 'stream-chat-react';

// `SidebarToggle` stands for a control of your own.
const SidebarToggle = () => <button>Menu</button>;

const HeaderStart = () => (
  <>
    <WorkspaceNavigationBackButton />
    <SidebarToggle />
  </>
);

export const ChannelPanel = ({ channel }: { channel: StreamChannel }) => (
  <Channel channel={channel}>
    <ChannelHeader StartContent={HeaderStart} />
  </Channel>
);
```

---

## 9. Reading channel state

`stream-chat` v10 owns message, thread and composer state; the React SDK subscribes to it. There is no React reducer and no context that copies channel state. Read the channel with `useChannel()` (thread's channel first, then the `Channel` subtree's; throws outside both) or `useChannelInstanceContext()` (returns `{}` when there is no channel), then read or act on the instance. Subscribe with `useStateStore(store, selector)`, with the selector defined at module scope.

### `ChannelStateContext` and `ChannelActionContext` are removed

`ChannelStateContext`, `ChannelActionContext`, their providers, `useChannelStateContext`, `useChannelActionContext`, and the `ChannelState`, `ChannelNotifications`, `MarkReadWrapperOptions` and `RetrySendMessage` types are removed.

The message paginator has two ends: the **tail** is the oldest loaded message, the **head** the newest. `toTail()` loads older messages and `toHead()` newer ones. `next()` / `prev()` and `hasNext` / `hasPrev` are removed in `stream-chat` v10; use `toTail()` / `toHead()` and `hasMoreTail` / `hasMoreHead`.

**Reading state** (was `useChannelStateContext`):

| v14                                                                                                            | v15                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channel`                                                                                                      | `useChannel()`                                                                                                                                                                                              |
| `messages`                                                                                                     | `channel.messagePaginator.state` → `items`                                                                                                                                                                  |
| `hasMore` (older)                                                                                              | `messagePaginator.state` → `hasMoreTail` (also the getter `messagePaginator.hasMoreTail`)                                                                                                                   |
| `hasMoreNewer`                                                                                                 | `messagePaginator.state` → `hasMoreHead` (getter `messagePaginator.hasMoreHead`)                                                                                                                            |
| `loading`, `loadingMore`, `loadingMoreNewer`                                                                   | `messagePaginator.state` → `isLoading`                                                                                                                                                                      |
| `error`                                                                                                        | `messagePaginator.state` → `lastQueryError`                                                                                                                                                                 |
| `members`, `read`, `watchers`, `watcherCount` / `watcher_count`                                                | `useStateStore(channel.state, selector)` (keys `members`, `read`, `watchers`, `watcherCount`), or the non-reactive getters `channel.state.members` / `.read` / `.watchers` / `.watcher_count`               |
| `pinnedMessages`                                                                                               | `channel.pinnedMessagesPaginator.state`                                                                                                                                                                     |
| `thread`, `threadMessages`, `threadHasMore`, `threadLoadingMore`                                               | `useThreadContext()` (the `Thread` instance) and `thread.messagePaginator`                                                                                                                                  |
| `channelCapabilities`                                                                                          | `useChannelCapabilities({ cid })` (a `Set<string>`), or `ownCapabilities` from `channel.state`                                                                                                              |
| `channelConfig`                                                                                                | Resolved gates: `channel.configState` ([below](#channel-configuration-channelconfig--channelconfigstate)). The raw server flags: `channel.serverConfig` (a non-reactive getter, `undefined` until queried). |
| `imageAttachmentSizeHandler`, `videoAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, `giphyVersion`     | `useAttachmentContext()` ([section 5](#props-that-moved-off-channel))                                                                                                                                       |
| `channelUnreadUiState`                                                                                         | `channel.messagePaginator.unreadStateSnapshot` ([below](#the-unread-snapshot-channelunreaduistate-is-removed))                                                                                              |
| `mutes`                                                                                                        | `useChatContext().mutes`                                                                                                                                                                                    |
| `notifications`                                                                                                | None; notifications go through `client.notifications`                                                                                                                                                       |
| `suppressAutoscroll`, `threadSuppressAutoscroll`, `highlightedMessageId`, `loadingMoreForJumpToChannelMessage` | None; internal to the message lists. The highlight follows `messagePaginator.messageFocusSignal`.                                                                                                           |

**Actions** (was `useChannelActionContext`):

| v14                                                                          | v15                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadMore` (older) / `loadMoreNewer`                                         | `channel.messagePaginator.toTail()` / `.toHead()`. `MessageList` uses exactly these: `toTail` on scroll to the top, `toHead` on scroll to the bottom.                                                     |
| `loadMoreThread`                                                             | `thread.messagePaginator.toTail()`                                                                                                                                                                        |
| `jumpToMessage(id)` / `jumpToLatestMessage()` / `jumpToFirstUnreadMessage()` | `messagePaginator.jumpToMessage(id)` / `.jumpToTheLatestMessage()` / `.jumpToTheFirstUnreadMessage()`                                                                                                     |
| `sendMessage`                                                                | `messageComposer.send()`, or `useMessageComposerSubmitFn()` in a composer UI. Lower level: `channel.messageOperations.send({ localMessage, message, options })`                                           |
| `retrySendMessage`                                                           | `channel.messageOperations.retry({ localMessage })`, or `handleRetry` from `useMessageContext()`                                                                                                          |
| `editMessage`                                                                | `messageComposer.update()`, or `channel.messageOperations.update({ localMessage, options })`                                                                                                              |
| `deleteMessage`                                                              | `channel.messageOperations.delete({ localMessage, options })`, or `handleDelete` from `useMessageContext()`                                                                                               |
| `updateMessage` / `removeMessage` (local-only list writes)                   | `messagePaginator.ingestItem(message)` / `.removeItem({ id })`. Normally unnecessary: the client applies WebSocket events itself.                                                                         |
| `markRead`                                                                   | `channel.markRead()`. The unread UI snapshot is separate state on the paginator; there is no `updateChannelUiUnreadState` option.                                                                         |
| `setChannelUnreadUiState`                                                    | `channel.messagePaginator.setUnreadSnapshot(partial)`                                                                                                                                                     |
| `openThread` / `closeThread`                                                 | `useWorkspaceNavigation().openThread({ channel, message })` / `.closeThread(threadId)`; inside a thread, `useCloseThread()` ([section 4](#4-selecting-channels-and-opening-threads-workspace-navigation)) |
| `onMentionsClick` / `onMentionsHover`                                        | The props on `MessageList` / `Message`                                                                                                                                                                    |
| `dispatch`                                                                   | None; there is no React reducer                                                                                                                                                                           |

`channel.messageOperations` and `thread.messageOperations` perform the optimistic local update and then the request, honoring the request handlers registered on `client.config` ([section 14](#14-request-handlers)). For a thread reply, use `thread.messageOperations` / `thread.messagePaginator`: thread replies are an independent paginator, not part of the channel's list.

```tsx
// v14
export const LoadOlder = () => {
  const { channel, hasMore, messages } = useChannelStateContext();
  const { loadMore } = useChannelActionContext();

  if (!hasMore) return null;

  return (
    <button onClick={() => loadMore()}>
      Load older ({messages?.length ?? 0} loaded in {channel.cid})
    </button>
  );
};
```

```tsx
import type { MessagePaginatorState } from 'stream-chat';
import { useChannel, useStateStore } from 'stream-chat-react';

const paginatorSelector = (state: MessagePaginatorState) => ({
  hasMoreOlder: state.hasMoreTail,
  messages: state.items,
});

export const LoadOlder = () => {
  const channel = useChannel();
  const { hasMoreOlder, messages } = useStateStore(
    channel.messagePaginator.state,
    paginatorSelector,
  );

  if (!hasMoreOlder) return null;

  return (
    <button onClick={() => channel.messagePaginator.toTail()}>
      Load older ({messages?.length ?? 0} loaded in {channel.cid})
    </button>
  );
};
```

### `TypingContext` is removed

`TypingContext`, `TypingContextValue`, `TypingProvider` and `useTypingContext` are removed. Subscribe to the channel's own store: `typing` is `Record<string, Event>` keyed by user id. The non-reactive snapshot is `channel.state.typing`. The SDK's own `TypingIndicator`, `TypingIndicatorHeader`, `ChannelHeader` and `ThreadHeader` read this slice and filter it by `parent_id` for threads. The text composer keeps no copy: `TextComposerState` has no `typing` in `stream-chat` v10, so a custom indicator written against a v15 release candidate that read `messageComposer.textComposer.state` reads `channel.state` instead, in a thread too.

```tsx
// v14
export const TypingCount = () => {
  const { typing } = useTypingContext();
  return <span>{Object.keys(typing ?? {}).length} typing</span>;
};
```

```tsx
import type { ChannelStateData } from 'stream-chat';
import { useChannel, useStateStore } from 'stream-chat-react';

const typingSelector = ({ typing }: ChannelStateData) => ({ typing });

export const TypingCount = () => {
  const channel = useChannel();
  const { typing } = useStateStore(channel.state, typingSelector);
  return <span>{Object.keys(typing).length} typing</span>;
};
```

**Reading who is typing needs a type guard.** The slice is typed `Record<string, Event>`, and `Event` is a discriminated union in `stream-chat` v10, so `event.user` does not compile on it (`TS2339`). The client stores only `typing.start` events there; narrow to that member:

```tsx
// v14
const { typing } = useTypingContext();
const names = Object.values(typing ?? {}).map(({ user }) => user?.name);
```

```tsx
import type { ChannelStateData, Event, EventPayload } from 'stream-chat';
import { useChannel, useChatContext, useStateStore } from 'stream-chat-react';

const typingSelector = ({ typing }: ChannelStateData) => ({ typing });

const isTypingStart = (event: Event): event is EventPayload<'typing.start'> =>
  event.type === 'typing.start';

export const TypingUsers = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { typing } = useStateStore(channel.state, typingSelector);
  const names = Object.values(typing)
    .filter(isTypingStart)
    .filter(({ user }) => user?.id !== client.user?.id)
    .map(({ user }) => user?.name ?? user?.id);
  return names.length ? <span>{names.join(', ')} typing</span> : null;
};
```

If the installed `stream-chat` types the slice as `Record<string, EventPayload<'typing.start'>>`, the guard is unnecessary: read `event.user` directly.

For a thread-scoped indicator, compare each event's `parent_id` with the thread's parent message (`useStateStore(useThreadContext()?.state, selector)`). The `typing_events` gate is `typingEvents.enabled` on `channel.configState` (below).

### The unread snapshot: `ChannelUnreadUiState` is removed

The unread UI state (v14's `channelUnreadUiState` / `setChannelUnreadUiState`) lives on the message paginator, with a camel-cased shape:

| v14 `ChannelUnreadUiState` | v15 `UnreadSnapshotState` (from `stream-chat`) |
| -------------------------- | ---------------------------------------------- |
| `last_read`                | `lastReadAt: TimestampNS \| null`              |
| `last_read_message_id`     | `lastReadMessageId: string \| null`            |
| `unread_messages`          | `unreadCount: number`                          |
| `first_unread_message_id`  | `firstUnreadMessageId: string \| null`         |

Read it with `useStateStore(channel.messagePaginator.unreadStateSnapshot, selector)` and write it with `channel.messagePaginator.setUnreadSnapshot(partial)`.

### Channel configuration: `channelConfig` → `channel.configState`

In v14 a component read the channel type's raw server flags from `ChannelStateContext.channelConfig` (`ChannelConfigWithInfo`). Configuration now lives on the channel as a reactive store of **resolved** values: each gate is the server flag ANDed with what the integrator registered through `client.config`.

```ts
// v14
const { channelConfig } = useChannelStateContext();
if (channelConfig?.typing_events) {
  /* ... */
}
```

```tsx
import type { ChannelConfig } from 'stream-chat';
import { useChannel, useStateStore } from 'stream-chat-react';

const configStateSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

export const useTypingEventsEnabled = () => {
  const channel = useChannel();
  return useStateStore(channel.configState, configStateSelector).typingEventsEnabled;
};
```

| v14 (raw server flag)                   | v15 (resolved, on `channel.configState`) |
| --------------------------------------- | ---------------------------------------- |
| `channelConfig?.typing_events`          | `typingEvents.enabled`                   |
| `channelConfig?.read_events`            | `readEvents.enabled`                     |
| `channelConfig?.replies`                | `replies.enabled`                        |
| `channelConfig?.user_message_reminders` | `userMessageReminders.enabled`           |
| `channelConfig?.commands`               | `availableCommands`                      |

- `availableCommands` is the server's list, unchanged in shape. Whether a command is usable right now is `messageComposer.isCommandDisabled(command)`.
- Select only the settings you use; a narrow selector means an unrelated configuration change does not re-render you.
- `channel.config` holds the same resolved value as a plain getter. It does not subscribe, so a later `client.config.set()` will not reach the screen.
- Fields of `ChannelConfigWithInfo` with no client-side counterpart are not on the resolved configuration. Read them from `channel.serverConfig`, which is the server's half only.

### `stream-chat` v10 store changes you will meet here

These are `stream-chat` changes, documented in its own migration notes. They are listed because React code that read channel state hits them immediately.

- **`channel.getConfig()` → `channel.serverConfig`**, a getter returning the same value (drop the parentheses). In tests, a getter cannot be replaced with `vi.fn()`; use `Object.defineProperty(channel, 'serverConfig', { get: ... })`.
- **One store per channel.** `readStore`, `typingStore`, `membersStore`, `watcherStore`, `ownCapabilitiesStore` and `mutedUsersStore` are gone. `channel.state` is itself a `StateStore<ChannelStateData>`, subscribed to like `thread.state`. The selector does not change: delete the `.<X>Store` segment.

  ```ts
  // v14
  useStateStore(channel.state.ownCapabilitiesStore, ownCapabilitiesSelector);
  // v15
  useStateStore(channel.state, ownCapabilitiesSelector);
  ```

- The state gained channel-level slices UI code used to derive by hand: `data`, `membership`, `muteStatus`, `initialized` / `offlineMode` / `pendingDisposal`, `active`, `aiState`, `watchStatus`, `memberCount`. `messagePaginator`, `pinnedMessagesPaginator`, `messageComposer` and `configState` stay separate.
- **`WatcherState` → `ChannelWatchState`.** **`channel.disconnected` → `channel.pendingDisposal`**, read-only and terminal; `channel.disconnect()` sets it. `getClient()` throws on such a channel, so guard `reload()` and other requests on `pendingDisposal`.
- **The convenience getters are not reactive.** `channel.state.members` / `.read` / `.typing` / `.watchers` return a snapshot; use `useStateStore(channel.state, selector)` for anything that must re-render. Selectors must be at module scope, and must return direct slice references (`(s) => ({ read: s.read })`), not freshly computed values (`Object.values(s.members)` re-renders forever). Drive unread badges off `read`: `unreadCount` is a non-reactive getter derived from it.
- `useIsChannelMuted` reads `muteStatus` instead of subscribing to `notification.channel_mutes_updated`.

---

## 10. Customizing components

### Removed `ComponentContext` slots

A stale key in `WithComponents overrides` is a compile error (`TS2353` / `TS2561`). In plain JS or behind `any` it is ignored with no warning, and the default UI renders (or nothing, for `HeaderStartContent`).

| Removed slot            | v15                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Message`               | `MessageUI` ([below](#message-ui-overrides-consolidate-on-the-messageui-slot))                                                                                    |
| `ThreadHeader`          | Render `<ThreadHeader />` (or your own) as a child of `<Thread>` ([section 7](#threadheader-lost-closethread-and-thread))                                         |
| `HeaderStartContent`    | `StartContent` on `ChannelHeader` / `ThreadHeader` ([section 8](#8-channel-and-thread-headers))                                                                   |
| `ChannelListUI`         | The list slots ([section 6](#channellistui-is-removed-use-the-list-slots))                                                                                        |
| `LoadingErrorIndicator` | Render the exported `LoadingErrorIndicator` yourself, around `Channel` ([section 5](#channel-requires-channel-and-renders-no-placeholder-loading-or-error-state)) |

TypeScript suggests `ThreadHead` for a stale `ThreadHeader` key. Do not follow it: `ThreadHead` is the thread's parent-message slot ([section 7](#threadheader-lost-closethread-and-thread)).

`WithComponents` merges over the parent context and merges `icons` slot by slot. `Channel`, `Thread`, the message lists and `MessageComposer` take no component overrides of their own.

### Message UI overrides consolidate on the `MessageUI` slot

`ComponentContext.Message` (deprecated in v14) and every `Message` prop that took a message UI component are removed.

| v14                                                                                                                        | v15                                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `ComponentContext.Message`                                                                                                 | `ComponentContext.MessageUI`                                     |
| `<Message Message={Custom} />`, `<MessageList Message={Custom} />`                                                         | `MessageUI` override                                             |
| `<VirtualizedMessageList Message={Custom} />`                                                                              | `VirtualMessage` override (falls back to `MessageUI`)            |
| `<Thread Message={Custom} />`                                                                                              | `MessageUI` override, scoped to the thread with `WithComponents` |
| `additionalMessageListProps` / `additionalVirtualizedMessageListProps` / `additionalParentMessageProps` carrying `Message` | `MessageUI` override                                             |

- `VirtualMessage` still takes precedence inside `VirtualizedMessageList`, and only there. It is applied as the `MessageUI` slot of the list's own subtree, so it also applies to any `Message` rendered inside that list, including the thread head.
- A message UI receives no props of its own. Read everything from `useMessageContext()`.
- In TypeScript, `Message={...}` fails with `TS2322` and a `Message:` key with `TS2561` (`Did you mean to write 'MessageUI'?`). In plain JS both are ignored. Grep for `Message=` and `Message:`.

```tsx
// v14
<>
  <MessageList Message={CustomMessage} />
  <VirtualizedMessageList Message={CustomMessage} />
</>
```

```tsx
import type { Thread as StreamThread } from 'stream-chat';
import {
  MessageList,
  Thread,
  useMessageContext,
  VirtualizedMessageList,
  WithComponents,
} from 'stream-chat-react';

const CustomMessage = () => {
  const { message } = useMessageContext();
  return <div>{message.text}</div>;
};

export const Lists = () => (
  <WithComponents overrides={{ MessageUI: CustomMessage, VirtualMessage: CustomMessage }}>
    <MessageList />
    <VirtualizedMessageList />
  </WithComponents>
);

// Only a thread's messages (was <Thread Message={...} />):
export const ThreadWithCustomMessages = ({ thread }: { thread: StreamThread }) => (
  <WithComponents overrides={{ MessageUI: CustomMessage }}>
    <Thread thread={thread}>
      <MessageList />
    </Thread>
  </WithComponents>
);
```

### Context hooks take no `componentName` argument

`useChatContext`, `useTranslationContext`, `useMessageContext`, `useComponentContext`, `useMessageComposerContext`, `useMessageListContext` and `useMessageBounceContext` no longer take an argument. TypeScript flags each call (`TS2554 Expected 0 arguments`); in plain JS the argument is ignored.

```tsx
// v14
const { t } = useTranslationContext('CustomEmojiPicker');
const { textareaRef } = useMessageComposerContext('CustomEmojiPicker');
```

```tsx
import { useMessageComposerContext, useTranslationContext } from 'stream-chat-react';

export const useEmojiPickerParts = () => {
  const { t } = useTranslationContext();
  const { textareaRef } = useMessageComposerContext();
  return { t, textareaRef };
};
```

### Required context hooks throw outside their provider

In v14 these hooks logged a `console.warn` (or nothing) and returned `{}` or `undefined`, so a misplaced component rendered blank and failed later with `Cannot read properties of undefined`. In v15 they throw `<hook> was called outside of <Provider>` at the call site. This is a runtime error, not a compile error.

| Hook                               | Must be rendered within                                     |
| ---------------------------------- | ----------------------------------------------------------- |
| `useChatContext`                   | `<Chat>`                                                    |
| `useMessageContext`                | `MessageProvider` (a rendered message)                      |
| `useMessageComposerContext`        | `MessageComposerContextProvider` (inside `MessageComposer`) |
| `useMessageListContext`            | `MessageListContextProvider`                                |
| `useVirtualizedMessageListContext` | `VirtualizedMessageListContextProvider`                     |
| `useMessageBounceContext`          | `MessageBounceProvider`                                     |
| `usePollContext`                   | `PollProvider`                                              |
| `useDialogManager`                 | `DialogManagerProvider` (its own message)                   |
| `useSearchContext`                 | `SearchContextProvider`                                     |
| `useSearchSourceResultsContext`    | `SearchSourceResultsProvider`                               |
| `useContextMenuContext`            | `ContextMenu`                                               |
| `useChannelListItemContext`        | `ChannelListItemUI`                                         |
| `useGalleryContext`                | `Gallery`                                                   |
| `useChatViewContext`               | `ChatView` (from `stream-chat-react/slot-layout`)           |
| `useChannel`                       | a `Channel`, a `Thread` or a `ChannelInstanceProvider`      |

**What to look for:** a custom message UI or attachment component rendered outside a message; a loading or empty state mounted outside `<Chat>`; a component calling `useMessageComposerContext()`, or `<EmojiPicker />` from `stream-chat-react/emojis`, mounted outside `MessageComposer`. Move it inside the provider, or wrap it.

- To probe whether a composer context exists, use the new `useIsWithinMessageComposerContext()`.
- `useMessageComposerController()` still needs a `Channel` or `Thread` subtree (v14 crashed outside a `Channel` too). It now also resolves inside a `Thread` with no `Channel` around it.

These still work outside a provider: `useTranslationContext` (renders the inline English copy), `useComponentContext` (an empty override map), `useChannelInstanceContext`, `useModalContext`, `useAriaLiveAnnouncer`, `useMessageTranslationViewContext`.

Related type changes:

- `useChannelInstanceContext()` returns `Partial<ChannelInstanceContextValue>`, so `channel` may be `undefined`. Use `useChannel()` when a channel is required.
- `ChatViewContext` has no default value, so `useContext(ChatViewContext)` may be `undefined`.
- `MessageComposerContext` is `MessageComposerContextValue | undefined` (its value type changed from `UseMessageComposerBindingsParams`).

### `messageActions` and `MESSAGE_ACTIONS` are removed

The `messageActions` prop on `Message`, `MessageList`, `VirtualizedMessageList` and `Thread` is removed, along with `MESSAGE_ACTIONS`, `OPTIONAL_MESSAGE_ACTIONS`, `MessageActionsArray`, `Capabilities`, the `getMessageActions()` util, and the `getMessageActions` / `actionsEnabled` fields of `MessageContextValue` (also on `MessageUIComponentProps`, `SharedMessageProps` and `VirtuosoContext`).

**If your custom message UI calls `getMessageActions()` or checks `MESSAGE_ACTIONS`** (for example to show a reply or react button only when allowed), it has to change: read the permissions from `useUserRole(message)` instead (example at the end of this section). The call fails to compile, and in untyped code throws `TypeError: getMessageActions is not a function`.

Otherwise there is little to do. The prop had already stopped working in v14: `getMessageActions` was written into `MessageContext`, but none of the SDK's own components read it, so passing `messageActions={['delete']}` in v14 changed nothing on screen, and the default rendering does not change now.

Choose the actions on `MessageActions` through `messageActionSet` (filter or extend `defaultMessageActionSet`) and install it with the `MessageActions` slot. `MessageActionSetItem` is a union, and its dropdown-toggle member has no `type`, so guard with `'type' in item`:

```tsx
// v14
<MessageList messageActions={['edit', 'react', 'reply']} />
```

```tsx
import {
  defaultMessageActionSet,
  MessageActions,
  MessageList,
  WithComponents,
} from 'stream-chat-react';

const allowed = new Set<string>(['edit', 'react', 'reply']);

const CustomMessageActions = () => (
  <MessageActions
    messageActionSet={defaultMessageActionSet.filter(
      // the dropdown-toggle item has no `type`; keep it
      (item) => !('type' in item) || allowed.has(item.type),
    )}
  />
);

export const List = () => (
  <WithComponents overrides={{ MessageActions: CustomMessageActions }}>
    <MessageList />
  </WithComponents>
);
```

- Action names are typed by the exported `DefaultMessageActionType` union; a custom action may use any string.
- Permission and message-state filtering stays in `useBaseMessageActionSetFilter`: an action the user cannot perform, or that a thread reply does not support, is dropped whether or not you list it. Pass `disableBaseMessageActionSetFilter` to take that over.
- There is no `actionsEnabled` replacement. The base filter already drops actions on deleted, bounced and failed messages.
- **A custom `MessageUI` that gated its own buttons** on `getMessageActions()` / `MESSAGE_ACTIONS` (for example showing a react or reply button only when allowed) reads the permission from `useUserRole(message)`, which returns `canReact`, `canReply`, `canPin`, `canEdit`, `canDelete`, `canFlag`, `canMute`, `canQuote`, `canMarkUnread`, `canBlockUser`, `canSendMessage`, `isMyMessage` and the role flags:

  ```tsx
  import { useMessageContext, useUserRole } from 'stream-chat-react';

  export const ReplyButton = () => {
    const { handleOpenThread, message } = useMessageContext();
    const { canReply } = useUserRole(message);
    return canReply ? <button onClick={handleOpenThread}>Reply</button> : null;
  };
  ```

- Adding an action means adding an item with a `Component` and a `placement` of `quick`, `dropdown` or `quick-dropdown-toggle`.

---

## 11. Message lists

Both lists drive themselves from `(thread ?? channel).messagePaginator`.

### The `messages` prop is removed

`MessageList.messages` and `VirtualizedMessageList.messages` are removed (a compile error). **Both lists always render the active paginator's items**; a custom array (filtered, reordered or synthetic) has no prop to go through.

- To change what is rendered: `reviewProcessedMessage` (still applied by both lists), `hideDeletedMessages`, or a custom `renderMessages` (`MessageList`).
- To change the data: act on the paginator (`messagePaginator.ingestItem(message)` / `removeItem({ id })`).
- Do not reorder; the paginator owns the sort order.

### Pagination and state props are removed

| Prop                                                                                                                                                                                | v15                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MessageList`: `loadMore`, `loadMoreNewer`, `loadingMoreForJumpToChannelMessage`, `hasMore`, `jumpToLatestMessage`, `loadingMoreNewer`, `messageLimit`                              | Removed                                                                                                                                                                                                     |
| `MessageList.loadingMore`                                                                                                                                                           | Kept. The `LoadingIndicator` above the messages shows while an older page loads; pass `loadingMore={false}` to hide it                                                                                      |
| `MessageList.internalInfiniteScrollProps`                                                                                                                                           | Now feeds `InfiniteScrollPaginator`: `hasNextPage`, `hasPreviousPage`, `head`, `initialLoad`, `isLoading`, `loader`, `loadNextPage`, `loadPreviousPage`, `reverse` and `LoadingIndicator` no longer compile |
| `VirtualizedMessageList`: `hasMore`, `hasMoreNewer`, `loadingMore`, `loadingMoreNewer`, `loadMore`, `loadMoreNewer`, `messageLimit`, `highlightedMessageId`, `channelUnreadUiState` | Removed                                                                                                                                                                                                     |

Code that drove these props uses the paginator:

- older / newer page: `messagePaginator.toTail()` / `.toHead()`
- has more: `messagePaginator.hasMoreTail` / `.hasMoreHead`
- loading: `useStateStore(messagePaginator.state, selector)` → `isLoading`
- jump: `messagePaginator.jumpToMessage(id)`, `.jumpToTheLatestMessage()`, `.jumpToTheFirstUnreadMessage()`. The highlight follows `messagePaginator.messageFocusSignal` (replaces `highlightedMessageId`).
- unread UI state: `messagePaginator.unreadStateSnapshot`
- page size: `client.config.set({ channel: { messagePaginator: { pageSize } } })` (and `thread.messagePaginator` for replies); there is no per-list `messageLimit` (see [`instance-configuration.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/instance-configuration.md))

### `threadList` and `head` are removed; lists detect the thread

- `MessageList.threadList`, `VirtualizedMessageList.threadList`, `VirtuosoContext.threadList`, `TypingIndicatorProps.threadList` and `ScrollToLatestMessageButtonProps.threadList` are removed. The SDK no longer passes `threadList` to custom `TypingIndicator` / `ScrollToLatestMessageButton` overrides; in untyped code it is `undefined`, so a thread-aware override behaves as if it were in the channel list. Detect the thread with `const isThreadList = !!useThreadContext();`.
- `MessageList.head` and `VirtualizedMessageList.head` are removed. Both lists render the parent message from the thread context. Override it with a `ThreadHead` slot (`ComponentType<MessageProps>`). On `VirtualizedMessageList`, `additionalVirtuosoProps.components.Header` still replaces the whole header slot.
- `Message` / `MessageContext` still have a `threadList` field; only the list-level prop is gone.

### `disableDateSeparator` → `withDateSeparator`

Both lists take `withDateSeparator` (inverted). `Thread.enableDateSeparator` is removed ([section 7](#thread-takes-a-thread-prop-and-renders-its-children)).

| Component                | v14 default                    | v15 default                 |
| ------------------------ | ------------------------------ | --------------------------- |
| `MessageList`            | `disableDateSeparator={false}` | `withDateSeparator={true}`  |
| `VirtualizedMessageList` | `disableDateSeparator={true}`  | `withDateSeparator={false}` |

In untyped code `disableDateSeparator` is ignored and the default applies. The rename also reaches `processMessages` and the `context` handed to `reviewProcessedMessage` (`enableDateSeparator` → `withDateSeparator`; reading the old field yields `undefined`), `useEnrichedMessages`, `FloatingDateSeparator`, `useFloatingDateSeparator` and `useFloatingDateSeparatorMessageList`.

```tsx
// v14
<>
  <MessageList disableDateSeparator />
  <VirtualizedMessageList disableDateSeparator={false} />
</>
```

```tsx
import { MessageList, VirtualizedMessageList } from 'stream-chat-react';

export const Lists = () => (
  <>
    <MessageList withDateSeparator={false} />
    <VirtualizedMessageList withDateSeparator />
  </>
);
```

### Custom `renderMessages` gets different options

- `RenderMessagesOptions.channel: Channel` is new and required.
- `channelUnreadUiState` is now required and typed `UnreadSnapshotState` (`firstUnreadMessageId`, `lastReadAt`, `lastReadMessageId`, `unreadCount`); `focusedMessageId?` is new. Reading the v14 snake_case fields yields `undefined`, so a hand-rolled unread separator never renders.
- `getIsFirstUnreadMessage` takes `UnreadSnapshotState & { channel?, isFirstMessage, message, previousMessage? }` (`lastReadDate` → `lastReadAt`, `unreadMessageCount` → `unreadCount`) and returns `false` without a `channel` or inside a thread.
- The default renderer no longer places the unread separator before a system message.

### `VirtuosoContext` (the context of `additionalVirtuosoProps.components`)

- Removed: `Message`, `messageActions`, `openThread`, `threadList`.
- New and required: `channel: Channel`. New: `focusedMessageId?`.
- `head`, `firstUnreadMessageId` and `lastReadMessageId` are `... | null` (checks written as `=== undefined` miss them); `lastReadDate` is `TimestampNS | null` (unix nanoseconds); `loadingMore: boolean`; `unreadMessageCount: number`.

### `headerPosition` and `insertIntro` take unix nanoseconds

`MessageList.headerPosition` and `insertIntro(messages, headerPosition)` are compared against `message.created_at`, so they are `TimestampNS`, not epoch milliseconds. A millisecond `number` no longer compiles; with a cast, the header lands in the wrong place. Pass `message.created_at` or `msToNs(ms)` from `stream-chat`.

### `DateSeparatorMessage`

The `DateSeparatorMessage` member of the `RenderedMessage` union lost `type` (it was never populated at runtime) and `unread` is optional (set only by the unread separator). Narrow with `isDateSeparatorMessage(message)` rather than checking either field.

### Low-level list hooks and utils

Only code that calls these directly (custom list implementations) is affected:

- `useEnrichedMessages({ withDateSeparator, headerPosition?: TimestampNS, ... })`
- `useNewMessageNotification(messages, currentUserId)` (no `hasMoreNewer`)
- `useScrollLocationLogic`: no `disableAutoScrollToBottom` / `disableScrollManagement`; `listElement: HTMLElement | null`; `suppressAutoscroll?` optional; `scrollToBottom(options?: { behavior?: ScrollBehavior })`
- `areMessagePropsEqual` no longer compares `Message`, `messageActions` or `mutes`
- `MessageListContextValue.listElement: HTMLElement | null`

### The "New Messages!" notification shows only for messages that arrived

In v14 both message lists also showed `NewMessageNotification` whenever newer messages existed than
the loaded window — for example after jumping to an old message — even if nothing had arrived. Now
`showNotification` is true only when a message from someone else arrived while the reader was
scrolled up. Being in an older window is signalled by `ScrollToLatestMessageButton` alone.

- **A custom `NewMessageNotification`** that relied on `showNotification` for the jumped-to-history
  state should read `channel.messagePaginator.hasMoreHead` instead (via `useStateStore` on
  `messagePaginator.state`).

### `ScrollToLatestMessageButton` shows the channel's unread count

In a channel, the number on `ScrollToLatestMessageButton` is now the current user's unread count for
the channel, `channel.state.read[userId].unread_messages` (what `channel.countUnread()` returns),
rather than a count of `message.new` events received while scrolled up.

- **It includes more messages:** those that were already unread when the channel opened, and those a
  reconnect brought in. It clears once the channel is marked read, and it also shows at the bottom of
  an older message set.
- **It follows the read state's counting rules:** no number for muted channels, messages from muted
  users, silent or shadowed messages, or channels without read events (unless
  `readEvents.localUnreadCountEnabled` is set). The old event counter counted these.
- **In a thread** the number still counts the replies other users posted while scrolled up; it no
  longer starts from the channel's unread count.

### Loading older messages keeps your place; `loadNextDebounceMs` rate-limits the check

- **`MessageList` keeps the reader's place when an older page loads**, including when loading
  starts at the very top of the list. It no longer shows the top of the newly loaded page.
- **A switch to the newest messages shows the bottom.** When the shown messages are replaced by the
  newest page (e.g. a reconnect across a gap, or jumping to the latest message from an older
  window), `MessageList` scrolls to the bottom at once. A jump to a message still positions the
  list itself.
- **`InfiniteScrollPaginator`'s `loadNextDebounceMs` is now the minimum interval between checks
  while scrolling**, not the wait after scrolling stops. The same applies to `ChannelList`'s and
  `SearchSourceResultList`'s `loadMoreDebounceMs`, which pass it on. The next page starts loading
  as soon as the scroll position comes within `threshold` of an edge, and the check also runs at
  once on mount and on resize, so `loadNextOnScrollToTop` and `loadNextOnScrollToBottom` are
  called earlier and more often: a custom loader must ignore calls while a page is loading.
  `listenToScroll` is called while scrolling too.
- **`useMessageListScrollManager`:** the `onScrollToTop` parameter is removed. The optional
  `hasMoreNewer` and `focusedMessageId` parameters are new, and `useScrollLocationLogic` takes an
  optional `focusedMessageId`.

---

## 12. Messages

### A standalone `<Message>` needs a channel in context

`Message` resolves its channel with `useChannel()`, which throws when there is no `Channel`, `Thread` or `ChannelInstanceProvider` ancestor. In v14 the missing contexts only warned. Wrapping a preview `<Message>` in `ChannelStateProvider` / `ChannelActionProvider` no longer compiles.

- Wrap it in `<ChannelInstanceProvider value={{ channel }}>`, with any real `stream-chat` `Channel` (for example `client.channel(type, id)`), or render it inside `<Channel>` / `<Thread>`. [`examples/vite/src/AppSettings/tabs/Reactions/ReactionsTab.tsx`](https://github.com/GetStream/stream-chat-react/blob/master/examples/vite/src/AppSettings/tabs/Reactions/ReactionsTab.tsx) is the reference.
- `highlighted` is no longer derived from `ChannelStateContext.highlightedMessageId`. Pass `highlighted` yourself (`MessageProps.highlighted?: boolean`).

```tsx
import type { LocalMessage, StreamChat } from 'stream-chat';
import { ChannelInstanceProvider, Message } from 'stream-chat-react';

export const MessagePreview = ({
  client,
  message,
}: {
  client: StreamChat;
  message: LocalMessage;
}) => (
  <ChannelInstanceProvider
    value={{
      channel: client.channel('messaging', 'preview'),
    }}
  >
    <Message message={message} />
  </ChannelInstanceProvider>
);
```

### `MessageContext.mutes` and `messageIsUnread` are removed

- `mutes` → `useChatContext().mutes` (now `UserMuteResponse[]`), for example `isUserMuted(message, useChatContext().mutes)`. In untyped code the removed field is `undefined`, so `isUserMuted(message, mutes)` returns `false`.
- `messageIsUnread` has no successor. Derive it from the channel's read state, for example `!isMyMessage() && (channel.lastRead() == null || message.created_at > channel.lastRead())`, with `channel` from `useChannel()`. `channel.lastRead()` returns `TimestampNS | null | undefined` and is not reactive; to re-render on read changes, subscribe to `read` on `channel.state`.

### `retrySendMessage` and `useRetryHandler`

- The `retrySendMessage` prop on `Message`, `MessageList` and `SharedMessageProps` is removed. To change the retry request, register `retrySendMessageRequest` on the client ([section 14](#14-request-handlers)).
- `useRetryHandler()` takes no argument and returns `RetryHandler = (params: Omit<OperationParams<'retry'>, 'message'>) => Promise<void>`. Call it as `retry({ localMessage: message })`. At runtime, v14's `retry(message)` passes a message where `{ localMessage }` is expected.
- Inside a message UI, `useMessageContext().handleRetry(message)` still works. Its return type widened to `Promise<void> | void`, so chaining `.then` on it no longer compiles.

```tsx
// v14
const retry = useRetryHandler();
<button onClick={() => retry(message)}>Retry</button>;
```

```tsx
import { useMessageContext, useRetryHandler } from 'stream-chat-react';

export const RetryButton = () => {
  const { message } = useMessageContext();
  const retry = useRetryHandler();
  return <button onClick={() => retry({ localMessage: message })}>Retry</button>;
};
```

### `usePinHandler` no longer returns `canPin`

`usePinHandler(message, notifications?)` returns `{ handlePin }`. Read `canPin` from `useUserRole(message).canPin`. In untyped code the removed field is `undefined`, so a pin button gated on it never shows.

### `AIStates` moved to `stream-chat`

`import { AIStates } from 'stream-chat'`. The values are unchanged, but it is now `as const`, so an inferred array of its members no longer accepts the wide `AIState` that `useAIState` returns (`.includes(aiState)` fails to compile). Widen the array:

```tsx
import { type AIState, AIStates, type Channel } from 'stream-chat';
import { useAIState } from 'stream-chat-react';

const STOPPABLE: readonly AIState[] = [AIStates.Thinking, AIStates.Generating];

export const Stop = ({ channel }: { channel: Channel }) => {
  const { aiState } = useAIState(channel);
  return STOPPABLE.includes(aiState) ? <button>Stop</button> : null;
};
```

`useAIState(channel)` keeps its signature and `{ aiState }` shape. It now reads the `aiState` slice of `channel.state` instead of its own event subscriptions (v14 already handled `ai_indicator.update` / `.clear` / `.stop`). New: it also resets to `Idle` when the client drops the connection or the channel is unwatched.

### `allowConcurrentPlayback` is removed; one voice message plays at a time

`WithAudioPlaybackProps.allowConcurrentPlayback` and `ChannelProps.allowConcurrentAudioPlayback` are removed, with no replacement. Delete the prop.

- Playback is exclusive across every surface inside a `Chat`: a channel and a thread side by side no longer play together, even if you passed `true` before. Starting a player pauses whichever was playing.
- `useActiveAudioPlayer()` reports the app-wide active player, not the calling surface's.
- Switching channels stops that channel's audio: `Channel` passes its channel as `WithAudioPlayback`'s new `playbackScope`, whose change clears the pool.
- A custom `WithAudioPlayback` joins the shared arbiter that `Chat` provides automatically. Pass `playbackScope` if the provider outlives the entity it plays for.

### The gallery header renders the `MessageTimestamp` override for items that carry their message

The gallery renders outside any message, so its header reads the current item. When `ComponentContext.MessageTimestamp` is overridden and the item carries its `message` (a new optional `GalleryItem` field), the header renders the override with `customClass='str-chat__gallery__timestamp'`. Otherwise it renders its own timestamp through the `timestamp.GalleryTimestamp` key.

- `ModalGallery` (attachments in a message) and the channel-detail media view fill `message`; set it yourself on gallery items you build.
- To change only the format, customize `timestamp.GalleryTimestamp`.
- `MessageTimestamp` renders from its `message` prop outside a `MessageProvider`; without the prop it still requires one.

---

## 13. Message composer

### `overrideSubmitHandler` is removed

`MessageComposer.overrideSubmitHandler` (and the same field on `MessageComposerContextValue`) is removed. In plain JS it is ignored, so the custom send path stops running and messages go out through the default request.

Submitting is `messageComposer.send()`, which composes, releases the composer and sends through `messageOperations.send()` of the submit target (the channel, or the thread for a reply). Depending on what the override did:

- **Replace or wrap the outgoing request** → register a `sendMessageRequest` handler on the channel request handlers ([section 14](#14-request-handlers)). It also covers thread replies. Call `defaultRequest(params)`, its second argument, to fall through to the default request, offline queue included. The cid is `params.localMessage.cid`.
- **Change the composed message** → register composition middleware on the composer (unchanged `stream-chat` API).

Differences from the v14 override:

1. The v14 override replaced the whole send, so the integrator also owned the optimistic insert. The v15 handler replaces only the request: the client still inserts the message optimistically and reconciles it.
2. Registration is per client, not per mounted `MessageComposer`.
3. As in v14, the handler does not see edits. Edits go through `updateMessageRequest`.

```tsx
// v14
const overrideSubmitHandler: MessageComposerProps['overrideSubmitHandler'] = async ({
  cid,
  localMessage,
  message,
  sendOptions,
}) => {
  await myBackend.send({ cid, localMessage, message, sendOptions });
};

<MessageComposer overrideSubmitHandler={overrideSubmitHandler} />;
```

```tsx
import type { MessageRequest, StreamChat } from 'stream-chat';
import { MessageComposer } from 'stream-chat-react';

declare const myBackend: {
  audit: (cid: string, message?: MessageRequest) => Promise<void>;
};

// once, where the client is created
export const registerSendHandler = (client: StreamChat) =>
  client.config.set({
    channel: {
      requestHandlers: {
        sendMessageRequest: async (params, defaultRequest) => {
          await myBackend.audit(params.localMessage.cid, params.message);
          return defaultRequest(params); // or return { message } from your own request
        },
      },
    },
  });

export const Composer = () => <MessageComposer />;
```

### `handleSubmit` is removed

`handleSubmit` is gone from `MessageComposerContext` and from `useMessageComposerBindings` (params and result). In plain JS it is `undefined`, so a custom send button wired to it does nothing. Custom composer UIs that submitted with `useChannelActionContext().sendMessage(composition)` / `editMessage(...)` lose that path too.

- `useMessageComposerSubmitFn()` (root export) returns `() => Promise<MessageComposerSubmitResult>`. It calls `messageComposer.update()` while a message is being edited and `messageComposer.send()` otherwise, decided at submit time. The default send button and the Enter key use it, and it is assignable to `SendButton`'s `sendMessage` prop.
- Code that holds the composer can call `messageComposer.send()` / `.update()` directly. Both compose, release the composer, send, never reject, and resolve to `'sent' | 'nothing-to-send' | 'failed'`.

```tsx
// v14
const { handleSubmit } = useMessageComposerContext();
<SendButton sendMessage={handleSubmit} />;
```

```tsx
import {
  SendButton,
  TextareaComposer,
  useMessageComposerSubmitFn,
} from 'stream-chat-react';

export const CompactInput = () => {
  const submit = useMessageComposerSubmitFn();
  return (
    <div className='compact-input'>
      <TextareaComposer />
      <SendButton sendMessage={submit} />
    </div>
  );
};
```

### A failed send or edit no longer restores the composer

This affects every `MessageComposer`, with no code change on your side.

- v14: a send cleared the composer and, when the request failed, restored the full pre-send state (text, attachments, link previews, poll, custom data) and showed an error notification. A failed edit stayed in the composer.
- v15: the composer is released before the request, for sends and edits alike, and **nothing is put back**. The failed message (or edit) stays in the message list marked `failed`, where the user retries it.
- The error notification now comes from `stream-chat` (`client.notifications.addError`, types `api:message:send:failed` / `api:message:update:failed`), translated through `notification.messageSendFailed` / `notification.messageUpdateFailed`.
- A custom UI that reopens or restores state after submitting must branch on the `MessageComposerSubmitResult`: on `'nothing-to-send'` the composer keeps its content; on `'failed'` the composer is already released and the content is on the failed message.

### `preventClearingOnUnmount` is removed

`MessageComposer` no longer clears a composer supplied through `MessageComposerControllerProvider` when it unmounts (v14 cleared it unless this prop was set). That composer belongs to whoever supplied it. Drop the prop; if you relied on the unmount clearing a supplied composer, call `composer.clear()` once your UI is done with it.

On unmount, `MessageComposer` saves a draft for every composer (`createDraft()` skips edits and draft-disabled composers) and clears only the thread's or channel's own. `MessageComposerControllerProvider` keeps its signature (`{ messageComposerController?: MessageComposer }`).

```tsx
import type { MessageComposer as Composer } from 'stream-chat';
import { MessageComposer, MessageComposerControllerProvider } from 'stream-chat-react';

export const InlineEditor = ({ composer }: { composer: Composer }) => (
  <MessageComposerControllerProvider messageComposerController={composer}>
    <MessageComposer />
  </MessageComposerControllerProvider>
);
// When the edit is abandoned, discard it yourself: composer.clear();
```

### `setMessageComposerSetupFunction` is deprecated

`client.setMessageComposerSetupFunction(fn)` still works in `stream-chat` v10 but is deprecated. Register composer setup (emoji or giphy middleware, composer config) with `client.config.setSetupFunction('messageComposer', fn)`; `fn` receives the same `{ composer }` and may return a teardown ([`instance-configuration.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/instance-configuration.md#setup-functions-for-behaviour)).

### Attachment and poll availability

`AttachmentSelector` used to decide which actions to offer from the channel type's raw server flags. It now reads the composer's resolved configuration (server flags ANDed with `client.config`). No React API changed, but the actions offered differ:

- **File:** v14 required `upload-file` capability, `channelConfig.uploads` and `isUploadEnabled`. v15 requires only `attachmentManager.isUploadEnabled`, which is `attachments.enabled && hasAvailableUploadSlots && (customCdn || hasUploadPermission)`.
  - With `customCdn: true`, the File action now appears for users without `upload-file`; v14 always hid it from them.
  - With a custom `doUploadRequest` and `customCdn` unset, uploads the v14 client let through without `upload-file` are now blocked, for example paste, which skipped the capability check when `doUploadRequest` was set. The File action itself was already hidden in v14.
- **Poll:** reads the resolved `polls.enabled` instead of `channelConfig.polls`.
- **Location:** reads the resolved `location.enabled` instead of `channelConfig.shared_locations`.
- **Commands:** read `availableCommands` from `channel.configState` instead of `channel.getConfig().commands`.
- So `client.config.set({ messageComposer: { attachments | polls | location: { enabled: false } } })` now hides the matching action.

If your `doUploadRequest` stores files outside Stream, declare it. If it still posts to Stream (a wrapper adding headers, a proxy), leave `customCdn` unset:

```ts
client.config.set({
  messageComposer: { attachments: { customCdn: true } },
});
```

`SimpleAttachmentSelector` still requires `upload-file` regardless. `isUploadEnabled` still does not re-render on an `own_capabilities` change; subscribe with `useChannelCapabilities` where that matters.

### `useAttachmentManagerState`: `hasCustomDoUploadRequest` → `customCdn`

`hasCustomDoUploadRequest` was only consulted as a proxy for "do uploads bypass Stream's storage rules", and an upload function that still posts to Stream stays subject to them. Read `customCdn`, the flag that decides. In plain JS the removed field is `undefined`, so a branch on it always takes the "no custom upload" path. To ask whether a custom upload function is installed, read `messageComposer.attachmentManager.hasCustomDoUploadRequest`.

```ts
// v14
const { hasCustomDoUploadRequest } = useAttachmentManagerState();
```

```ts
import { useAttachmentManagerState } from 'stream-chat-react';

export const useUploadsBypassStream = () => useAttachmentManagerState().customCdn;
```

The hook also returns `attachmentsEnabled`, `locationEnabled`, `pollsEnabled` and `maxNumberOfFilesPerMessage` (the resolved gates), and re-renders when the composer configuration changes. Only code that builds or mocks its return type is affected by the new fields.

### Upload helpers moved to `stream-chat`

`getAttachmentPreviewUrl`, `isUploadConfirmationPending` and `hasPendingUploadState` (now `isPendingUpload`) are imported from `stream-chat` ([section 1](#imports-that-moved)). `useAttachmentUploadState` / `useAttachmentsUploadState` stay in `stream-chat-react`.

### Composer types that follow `stream-chat` v10

See [section 17](#17-other-stream-chat-v10-data-shapes): `CommandChip` / `CommandItem` commands, suggestion-list entities, `getQuotedMessageAuthor`, geolocation and link previews, and the attachment fields that moved under `custom`.

### New: `UnsupportedAttachmentPreview` and `RemoveAttachmentPreviewButton` are exported

Not a break. The composer lists a custom attachment type it has no preview for as unsupported, and `AttachmentPreviewList` takes the component for those as its `UnsupportedAttachmentPreview` prop. v14 exported only the prop types; both components are now exported from the root. If your app copied either out of the v14 source, import it instead:

```tsx
import type { ReactNode } from 'react';
import {
  AttachmentPreviewList,
  type AttachmentPreviewListProps,
  RemoveAttachmentPreviewButton,
  UnsupportedAttachmentPreview,
  type UnsupportedAttachmentPreviewProps,
  WithComponents,
} from 'stream-chat-react';

const ProductPreview = (props: UnsupportedAttachmentPreviewProps) => {
  const { attachment, removeAttachments } = props;
  if (attachment.type !== 'product') return <UnsupportedAttachmentPreview {...props} />;

  return (
    <div style={{ position: 'relative' }}>
      {attachment.title}
      <RemoveAttachmentPreviewButton
        onClick={() => removeAttachments([attachment.localMetadata.id])}
      />
    </div>
  );
};

const PreviewList = (props: AttachmentPreviewListProps) => (
  <AttachmentPreviewList {...props} UnsupportedAttachmentPreview={ProductPreview} />
);

export const ComposerPreviews = ({ children }: { children: ReactNode }) => (
  <WithComponents overrides={{ AttachmentPreviewList: PreviewList }}>
    {children}
  </WithComponents>
);
```

---

## 14. Request handlers

The `doSendMessageRequest`, `doUpdateMessageRequest`, `doDeleteMessageRequest` and `doMarkReadRequest` props on `Channel` are removed (v14 `Thread` never had them), and so is `useChannelEditMessageHandler`. In plain JS the props are ignored and the default requests are sent. Register handlers once on the client:

```tsx
// v14
<Channel
  channel={channel}
  doSendMessageRequest={(channel, message, options) =>
    channel.sendMessage(message, options)
  }
>
  {/* ... */}
</Channel>
```

```tsx
import type { StreamChat } from 'stream-chat';

export const registerRequestHandlers = (client: StreamChat) =>
  client.config.set({
    channel: {
      requestHandlers: {
        sendMessageRequest: async (params, defaultRequest) => {
          // inspect or rewrite params.message here
          return defaultRequest(params);
        },
        updateMessageRequest: (params, defaultRequest) => defaultRequest(params),
      },
    },
  });

// <Channel channel={channel}>...</Channel> takes no handler props.
```

| Handler under `channel.requestHandlers` | Replaces                                        | Type                                                                                       |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `sendMessageRequest`                    | `doSendMessageRequest`, `overrideSubmitHandler` | `OperationRequestFn<'send'>`                                                               |
| `updateMessageRequest`                  | `doUpdateMessageRequest`                        | `OperationRequestFn<'update'>`                                                             |
| `deleteMessageRequest`                  | `doDeleteMessageRequest`                        | `OperationRequestFn<'delete'>`                                                             |
| `retrySendMessageRequest`               | the `retrySendMessage` prop                     | `OperationRequestFn<'retry'>`                                                              |
| `markReadRequest`                       | `doMarkReadRequest`                             | `CustomMarkReadRequestFn`, receives `{ channel, options }`, returns the response or `null` |

- **The signature is `stream-chat`'s.** A message handler takes `(params: { localMessage, message?, options? }, defaultRequest)` and must return `Promise<{ message }>`. Call `defaultRequest(params)` (with the params as given, or changed) to send the default way, offline queueing included. The v14 props took positional arguments and tolerated a `void` return.
- **Thread replies use the channel's handlers.** Send, update, delete and retry for a thread reply go through `thread.messageOperations`, which reads the parent channel's request handlers. The `thread` request handlers (`client.config.set({ thread: { requestHandlers } })`) hold only `markReadRequest`, for marking a thread read; a message handler registered under `thread` does not type-check and is never called.
- **Registration is per client**, not per mounted `<Channel>`. If behavior has to differ between channels, branch inside one handler on `params.localMessage.cid`.
- `useChannelEditMessageHandler` applied `doUpdateMessageRequest` to the edit path; register `updateMessageRequest` instead. `messageComposer.update()` and `channel.messageOperations.update()` route through it.

More on `client.config`: [`instance-configuration.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/instance-configuration.md).

---

## 15. Configuration: components read the resolved config

The client combines each server flag with what the integrator registers through `client.config`, and enforces that combined value. Components used to read only the server's half, so a UI could offer an action the client had already disabled. v15 components read the resolved value everywhere:

- the composer's attachment, poll and location actions ([section 13](#attachment-and-poll-availability))
- the channel's typing, read, replies, reminders and commands gates ([section 9](#channel-configuration-channelconfig--channelconfigstate))
- `useMarkRead` reads the resolved `readEvents.enabled`, so it honors `client.config.set({ channel: { readEvents: { enabled: false } } })` and re-runs when that changes

`channel.serverConfig` (the renamed `channel.getConfig()`) has no callers left in the SDK. Either side can switch a feature off; neither can widen it.

---

## 16. Dates on response types are unix-nanosecond numbers

`stream-chat` types every server-sent date (`created_at`, `updated_at`, `last_read`, ... on every response and event) as the unix-nanosecond number the API puts on the wire. It is not a `Date` and not an ISO string. The type is **`TimestampNS`**, a branded `number`. Reading, comparing, sorting and subtracting work as with any number.

Caught at compile time:

- **`new Date(timestamp)` is a type error.** `stream-chat` augments the global `DateConstructor`, because a nanosecond value is out of `Date`'s range and yields an Invalid Date whose `.toISOString()` throws.
- **A plain `number` or a `Date` is not assignable to a `TimestampNS` prop.** Mint one with `nowNs()`, `msToNs(ms)`, `dateToNs(date)`, or `asTimestampNS(n)` for a value already in nanoseconds. Arithmetic drops the brand; wrap the result in `asTimestampNS`.
- `.getTime()` on a timestamp fails.

Not caught:

- **Date libraries** read a bare number as milliseconds: `dayjs(created_at).format()` returns the string `Invalid Date` and renders it.
- **Fallbacks and derived values**: `new Date(ts ?? Date.now())` and `new Date(Math.max(a, b))` compile. Convert first, then fall back.
- **Unit mix-ups**: comparing a timestamp with `Date.now()`, or adding a millisecond duration to one.
- **`t('timestamp.X', { timestamp })`** is not type-checked; a raw timestamp renders `Invalid Date`.

### React types that changed

| Type                                                                                                     | v14                   | v15                               |
| -------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------- |
| `MessageList.headerPosition`, `insertIntro(messages, headerPosition)`                                    | `number` (epoch ms)   | `TimestampNS`                     |
| `ProcessMessagesParams.lastRead`                                                                         | `Date \| null`        | `TimestampNS \| null`             |
| `VirtualizedMessageList` render-prop context `lastReadDate`                                              | `Date \| undefined`   | `TimestampNS \| null`             |
| `getIsFirstUnreadMessage` params                                                                         | `lastReadDate?: Date` | `lastReadAt: TimestampNS \| null` |
| `RenderedMessage.created_at` / `updated_at` / `deleted_at` / `pinned_at`                                 | `Date`                | `TimestampNS`                     |
| `useChannelMembershipState()` dates, `RenderTextMentionEntity` / `DefaultSuggestionListItemEntity` dates | `string`              | `TimestampNS`                     |

Compare and sort the raw numbers:

```ts
// v14
if (new Date(a.created_at).getTime() < new Date(b.created_at).getTime()) { … }

// v15
if (a.created_at < b.created_at) { … }
```

### Presentational props still take `Date`

Components that exist to render a date are unchanged: `DateSeparator.date: Date`, `formatDate?: (date: Date) => string`, `Timestamp.timestamp?: Date | string`. Convert at that boundary with `convertTimestampToDate(ts)`, which returns `Date | undefined` (`undefined` for an absent or non-finite value). **Handle the `undefined`; do not cast it away.** `isDateSeparatorMessage` gates on `isDate(message.date)`, so a laundered `undefined` turns the separator into an ordinary, empty message row with no error.

```tsx
// v14
<DateSeparator date={new Date(message.created_at)} />
```

```tsx
import { convertTimestampToDate, type LocalMessage } from 'stream-chat';
import { DateSeparator } from 'stream-chat-react';

export const DayDivider = ({ message }: { message: LocalMessage }) => {
  const createdAt = convertTimestampToDate(message.created_at);
  return createdAt ? <DateSeparator date={createdAt} /> : null;
};
```

```tsx
// WRONG: the cast launders `undefined` into a required `Date`.
<DateSeparator date={convertTimestampToDate(message.created_at) as Date} />
// WRONG: invents "now", labelling a months-old message "Today".
<DateSeparator date={convertTimestampToDate(message.created_at) ?? new Date()} />
```

`nsToDate` / `nsToMs` are exported alongside it for values known to be present. **Outgoing request** date fields stay `Date` (filter bounds like `created_at_before`, `remind_at`, `message_timestamp`); use `nsToDate` when handing a server-sent timestamp back to the API.

---

## 17. Other `stream-chat` v10 data shapes

React props typed with `stream-chat` types change with them. The React APIs are unchanged; build and read the values with the v10 shapes.

**Channel, chat context and search:**

- **Channel `name` and `image` are custom data.** A `stream-chat` v10 channel response carries them under `custom`, with no top-level `name`, so `channel.data?.name` (the most common read, in every channel header and preview) is `undefined`. Read `channel.data?.custom?.name` / `.image`. To type them, augment `CustomChannelData`. `name` is still a top-level **filter** key (`{ name: { $autocomplete: q } }`); other custom fields filter as `'custom.<key>'`. Writes go under `data.custom`, and `channel.update({ data: { custom } })` replaces the whole custom object, so spread the existing `custom` (or use `channel.updatePartial`) to keep the other fields. The full mapping is in [`v10-breaking-changes.md`](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md) in stream-chat-js.

  ```tsx
  import type { Channel, ChannelFilters } from 'stream-chat';

  declare module 'stream-chat' {
    interface CustomChannelData {
      image?: string;
      name?: string;
    }
  }

  export const channelTitle = (channel: Channel) =>
    channel.data?.custom?.name ?? channel.id;

  export const byNameAndDemo = (query: string): ChannelFilters => ({
    'custom.demo': 'team',
    name: { $autocomplete: query },
  });

  export const rename = (channel: Channel, name: string) =>
    channel.update({ data: { custom: { ...channel.data?.custom, name } } });
  ```

- `useChannelMembershipState(channel)`: dates are `TimestampNS`; `banned`, `channel_role`, `created_at`, `notifications_muted`, `shadow_banned`, `updated_at` are now required; `channel_role` is `string`; `custom` is added.
- `ChatContextValue.mutes` / `useChat().mutes`: `UserMuteResponse[]`. `getAppSettings`: `ReturnType<StreamChat['getAppSettings']>`.
- `MessageSearchResultItem` / `ChannelByMessageSearchResultItemProps.item`: `MessageResponse & { channel?: ChannelResponse }`.

**Messages:**

- **Reaction sort:** `reactionDetailsSort` (on `Message`, `MessageList`, `VirtualizedMessageList`, `MessageContext`, `MessageReactions`, `MessageReactionsDetail`, `VirtuosoContext`), `MessageReactionsDetail.sort`, and the `sort` argument of `handleFetchReactions` / `useReactionsFetcher`: `ReactionSort` → `SortParamRequest[]` (`[{ field: 'created_at', direction: -1 }]`).
- **Delete options:** `handleDelete` / `useDeleteHandler` take `{ delete_for_me?, hard? }` (was `{ deleteForMe?, hardDelete? }`).
- **Mutes:** `isUserMuted(message, mutes)` takes `UserMuteResponse[]` (`target` is optional).
- **Moderation:** `isMessageBounced` / `isMessageBlocked` read only `message.moderation`; `moderation_details` is gone from `LocalMessage`.
- **Attachments:** `CardProps` / `AttachmentActionsProps` lose `duration`, `file_size`, `mime_type`, `waveform_data`, `latitude` and `longitude`, gain a required `custom`, and `giphy` is `Images`. Read `attachment.custom.duration` / `.file_size` / `.mime_type` / `.waveform_data`.
- **Location:** `Attachment.attachments`, `AttachmentContainerProps.attachment`, `Geolocation.location`, `GeolocationContainer.location`, `GeolocationAttachmentMapPlaceholderProps.location`: `SharedLocationResponse` → `SharedLocationResponseData` (no `type`, `latitude` or `longitude` on the union).
- **Polls:** `PollOptionSelector.option`: `PollOptionResponseData`; `PollVote.vote`, `PollVoteListing.votes`, `usePollOptionVotesPagination().votes`, `usePollAnswerPagination().answers`: `PollVoteResponseData`.
- **Rendered messages:** `RenderedMessage` and `EventComponent.message` follow `LocalMessage` (`args`, `before_message_send_failed`, `channel`, `command_info`, `moderation_details` removed; `user` and `text` required). `RenderTextMentionEntity` follows `UserResponse` (`username`, `anon`, `shadow_banned`, `privacy_settings`, `push_notifications`, `notifications_muted`, `channel_last_read_at` removed).
- `calendar` / `calendarFormats` on `DateSeparator`, `EventComponent`, `MessageTimestamp`, `MessageEditedIndicator`, `TimestampProps` were widened; not breaking for callers.

```tsx
// v14
<button onClick={() => handleDelete({ deleteForMe: true })}>Delete for me</button>
```

```tsx
import { useMessageContext } from 'stream-chat-react';

export const DeleteForMe = () => {
  const { handleDelete } = useMessageContext();
  return (
    <button onClick={() => handleDelete({ delete_for_me: true })}>Delete for me</button>
  );
};
```

**Composer:**

- `CommandChip.command`, `CommandItem.entity`, `MessageComposerCommand.command`: `CommandResponse` → `Command`, where `args`, `description` and `set` are required.
- `DefaultSuggestionListItemEntity`: `anon`, `channel_last_read_at`, `notifications_muted`, `privacy_settings`, `push_notifications`, `shadow_banned` and `username` are gone (v10 user custom fields live in `entity.custom`); dates are `TimestampNS`; `teams_role` is `Record<string, string>`.
- `getQuotedMessageAuthor` (on `QuotedMessagePreview` and its props): `(message: LocalMessage | MessageResponse) => string`. A callback typed with `LocalMessage` only is rejected under `strictFunctionTypes`. `QuotedMessagePreviewUI.quotedMessage`: `LocalMessage | MessageResponse`.
- `GeolocationPreviewProps.location`, `useAttachmentsForPreview().location`: `StaticLocationPreview`.
- `LinkPreviewCard.linkPreview`: `LinkPreview` extends the v10 `Attachment`, whose `custom` is required.
- Attachment previews and the recorder's voice recording: `duration`, `file_size`, `mime_type` and `waveform_data` moved under `attachment.custom` (custom `AttachmentPreviewList` parts; `recordingController.recording.custom.duration` / `.custom.waveform_data`).

**Calls that replacements of the default components make:** the defaults call these `stream-chat` v10 methods with one request object. A custom component that makes the same call with bare values fails to compile.

- Poll creation fields (custom `NameField`, `OptionFieldSet`, `MultipleAnswersField` or switches): `pollComposer.updateFields({ data: { name } })`; errors your field produces go in the same object, `updateFields({ data, injectedFieldErrors })`. Was `updateFields({ name })` / `updateFields(data, errors)`.
- Member actions (leave channel, add or remove members): `channel.addMembers({ members: userIds })`, `channel.removeMembers({ members: userIds })`. Was `addMembers(userIds)`.
- Flagging a message: `client.moderation.flagMessage({ message_id: message.id })`. Was `client.flagMessage(message.id)`.
- Fetching a thread to open it: `client.getThreadAndHydrate({ message_id: parentId }, { watch: true })`, which returns the `Thread` already registered in `client.threads` when there is one. Was `client.getThread(parentId, options)`.

```tsx
import { useChannel, useChatContext } from 'stream-chat-react';

export const LeaveChannelButton = () => {
  const channel = useChannel();
  const { client } = useChatContext();
  if (!client.userID) return null;
  const userId = client.userID;
  return (
    <button onClick={() => channel.removeMembers({ members: [userId] })}>Leave</button>
  );
};
```

Other `stream-chat` v10 type changes an app may hit (the attachment `Action` type requires `text` and `type`, `unBlockUser` → `unblockUser`, `ReminderResponse` → `ReminderResponseData`, `User` no longer accepting `name` / `image` (type user data as `ClientUser`), channel `members` as `{ user_id }` objects, `ChannelState.messages` replaced by `channel.messagePaginator`) are documented in `stream-chat`'s own migration notes.

---

## 18. i18n

Full detail: [`i18n-v15-migration.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/i18n-v15-migration.md). The breaks, all of which fail **silently** unless the app's dictionaries are typed:

1. **English is the only bundled language.** The `de`, `es`, `fr`, `hi`, `it`, `ja`, `ko`, `nl`, `pt`, `ru` and `tr` dictionaries are removed with their dayjs calendar formats, and so are the `deTranslations` ... `trTranslations` / `enTranslations` exports, `isLanguageSupported` (use `i18n.registeredLanguages.has(lang)`) and `SupportedTranslations`.
2. **Keys are namespaced identifiers**, not the English text. `t('Send')` → `t('messageComposer.sendButton.send.ariaLabel', 'Send')`. An unrenamed key never matches, and the English copy renders. Every old key maps to one new key in [`i18n-v15-key-map.json`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/i18n-v15-key-map.json).
3. **`t` is strictly typed** (`StreamTFunction`). `t('English text')` and `t(someString)` no longer compile (`TS2769`). App-owned strings and runtime keys go through `asDynamicKey`: `t(asDynamicKey('myApp.removeMembers.ariaLabel'), 'Remove channel members')`.
   For each `t('...')` call and each dictionary key, look the string up in the key map's `keys`. Found: use its `key`. Not found: the string was never an SDK key (for example `t('Message Failed · Click to try again')` in a custom message UI), so it is app-owned. Give it a key of your own through `asDynamicKey`, with the English copy inline, and keep its translations in your dictionaries: `t(asDynamicKey('myApp.message.failed.text'), 'Message Failed · Click to try again')`.
4. **`Streami18n`'s API changed:** `getTranslators()` → `init()`; `setLanguage()` returns `void`; `t` is read-only (`overrideTFunction(fn)`); `registerSetLanguageCallback` → `i18n.state.subscribeWithSelector(...)`; `getAvailableLanguages()` → `registeredLanguages`; `geti18Instance()` → `i18nInstance`; custom formatter factories receive a `FormatterContext`, not the `Streami18n` instance.

| Symptom                                                          | Cause                                              | Fix                                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `registerTranslation(...)` / `translationsForLanguage` present   | keys are the old English strings                   | Rename every key; type the dictionary `TranslationDictionary` so stale keys fail to compile |
| `language: 'de'` (or any non-`en`) with no dictionary registered | the built-in one is gone                           | Register a dictionary                                                                       |
| non-English dates render in English                              | the dayjs locale is no longer bundled              | `import 'dayjs/locale/de.js'` + `dayjsLocaleConfigForLanguage`                              |
| imports of `deTranslations` etc.                                 | exports removed                                    | Recover from a v14 tag, then rename                                                         |
| `t('...')` / `t(variable)` compile errors                        | strict `t`                                         | Namespaced key with inline default, or `asDynamicKey`                                       |
| a dictionary declares `'channel.channelMissing.text'`            | the key is removed (the state it labelled is gone) | Delete the entry (`TS2353` in a `TranslationDictionary`)                                    |

```tsx
// v14
<button aria-label={t('Remove channel members')}>{t(label)}</button>
```

```tsx
import { asDynamicKey, useTranslationContext } from 'stream-chat-react';

export const RemoveButton = ({ label }: { label: string }) => {
  const { t } = useTranslationContext();
  return (
    <button
      aria-label={t(
        asDynamicKey('myApp.removeMembers.ariaLabel'),
        'Remove channel members',
      )}
    >
      {t(asDynamicKey(label))}
    </button>
  );
};
```

Four formatter keys carry English day words inside their `calendarFormats` (`timestamp.DateSeparator`, `timestamp.ReminderNotification`, `timestamp.ChannelPreviewTimestamp`, `timestamp.ChannelDetailPinnedMessageTimestamp`) and must be overridden to translate Today / Tomorrow / Yesterday / Last; `dayjsLocaleConfigForLanguage` does not reach them.

---

## 19. CSS and markup

| v14 markup or class                                                                                                        | v15                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `div.str-chat__main-panel` (+ `--thread-open`), rendered by `Window`                                                       | Gone. `Channel` renders `div.str-chat__channel` as the content column (flex column with header, list, composer). Target `.str-chat__thread-container` / `.str-chat__thread` for the thread panel. The v14 getting-started CSS on `#root .str-chat__main-panel` matches nothing.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `div.str-chat__container` inside `Channel` (or `customClasses.chatContainer`)                                              | Gone, and `customClasses.chatContainer` is removed from the type. Use `customClasses.channel` for the `.str-chat__channel` column.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `.str-chat__channel-list-inner`, `.str-chat__channel-list-inner__main` (from `ChannelListUI`, which held `role="listbox"`) | Gone. Target `.str-chat__channel-list .str-chat__infinite-scroll-paginator` (the `role="listbox"` scroll container, inside `ChannelNavigation`) and `.str-chat__infinite-scroll-paginator__content`. A bare `<ChannelList>` has no `.str-chat__channel-list` ancestor.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| The channel list root carried `str-chat <theme> str-chat__channel-list` and `customClasses.channelList`                    | Inside `ChatView` the `str-chat <theme>` scope comes from the `ChatView` root, and the channel list adds none of its own: a nested `.str-chat` would reset the tokens you override on the `ChatView` root. Outside `ChatView`, `ChannelNavigation`'s root renders `str-chat <theme> str-chat__channel-list`, and a bare `<ChannelList>` wraps itself in `div.str-chat.<theme>.str-chat__theme-scope` (`display: contents`). `customClasses.chat` replaces `str-chat` where the scope is applied; `customClasses.channelList` replaces `str-chat__channel-list` on `ChannelNavigation`'s root. App CSS that targeted the list root as a `.str-chat` element no longer matches it inside `ChatView`. |
| `.str-chat__chat-view__channels` / `.str-chat__chat-view__threads`                                                         | Rendered only when `ChatView` is given `views`. With the built-in workspace layout, content sits in `.str-chat__chat-view__workspace-layout`, `.str-chat__chat-view__workspace-layout-slots`, `.str-chat__chat-view__slot` (`--hidden`) and `.str-chat__chat-view__slot-layer`.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `.str-chat__thread--virtualized` on the thread container                                                                   | Not applied. Scope by the list you render (`.str-chat__thread .str-chat__virtual-list`, or your own class).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.str-chat__quoted-message-preview` text inherited the surrounding colour                                                  | It sets `color: var(--str-chat__chat-text-incoming)`, and `--own` `var(--str-chat__chat-text-outgoing)`, matching the bubble backgrounds. In the default light theme your own quotes change to the outgoing bubble's text colour. Remove contrast workarounds written for v14; theme with those two tokens.                                                                                                                                                                                                                                                                                                                                                                                        |

Find every app rule that uses a removed class. They also hide inside combinators and pseudo-classes, where a rule does more than style the element: `.create-channel-panel + .str-chat__main-panel { display: none }` hid the channel while another panel was open, and without it both render side by side. Nothing reports such a rule; it simply stops matching.

```bash
grep -rnE "str-chat__(main-panel(--[a-z-]+)?|container|channel-list-inner(__main)?|thread--virtualized)([^a-z0-9_-]|$)" \
  --include='*.css' --include='*.scss' --include='*.sass' --include='*.less' \
  --exclude-dir=node_modules --exclude-dir=build --exclude-dir=dist .
```

The pattern skips `.str-chat__main-panel-inner` and `.str-chat__thread-container`, which still exist. Replace each match per the table above, or move the rule to app-owned markup. A CSS-in-JS app also searches its `.ts` / `.tsx` / `.js` sources.

Consumers keep overriding through CSS layers (see [`README.md`](https://github.com/GetStream/stream-chat-react/blob/master/README.md)); never edit compiled CSS.

### Panel layout

v14 laid the thread beside the channel inside `Channel` itself: `.str-chat__channel` held a `.str-chat__container` flex **row** with `Window`'s `.str-chat__main-panel` and the `Thread`. v15 has no row inside the channel. `.str-chat__channel` is the content column (header, list, composer), and `<Thread>` is a sibling you render.

- **Without `ChatView`**, a sibling `<Thread>` stacks **below** the channel unless its container is a row. Give the element that holds both `display: flex` (row), and size the panels there.
- **Inside `ChatView`**, every panel rendered through `<Slot>` (and every panel of the built-in workspace layout) is a `section.str-chat__chat-view__slot` with `data-slot="<slot name>"`. Slots are `display: flex; flex: 1 1 0` siblings, so open panels share the width equally, and an empty slot is hidden. v14 sizing rules on `.str-chat__thread` / `.str-chat__channel` (for example `max-width: 45%` or `flex: 0 1 330px`) now apply **inside** the slot and compound, which can crush a panel to a narrow column. Move panel sizing to the slot:

```css
.str-chat__chat-view__slot[data-slot='thread'] {
  flex: 0 0 min(400px, 45%);
}
```

A panel your layout renders without `<Slot>` (for example a `ThreadSlot` placed directly in a view, as [`examples/vite`](https://github.com/GetStream/stream-chat-react/tree/master/examples/vite) does) has no slot section; size the element you wrap it in.

---

## 20. Tests

**Mock real stores.** `channel.state` is a `StateStore` now, so a plain-object mock crashes the `useStateStore` hooks with `getLatestValue is not a function`. Build a real channel (`client.channel(...)`) and seed state on it. Build a `Thread` mock from a real `client.threads` instance too.

| v14 mock                          | v15                                                                       |
| --------------------------------- | ------------------------------------------------------------------------- |
| `vi.spyOn(channel, 'muteStatus')` | seed `channel.state.partialNext({ muteStatus })`                          |
| `channel.disconnected = true`     | `channel.state.partialNext({ pendingDisposal: true })` (it has no setter) |
| `vi.fn()` for `getConfig`         | `Object.defineProperty(channel, 'serverConfig', { get: ... })`            |
| a hand-built `ChatContextValue`   | add `channelManager: client.channelManager`                               |

**Fixtures model the wire.** A fixture that hands the SDK a `Date` diverges from runtime behavior. Generate timestamps as `TimestampNS` (`dateToNs(new Date(...))`, `msToNs(...)`, or `asTimestampNS(...)` for a literal such as `created_at: asTimestampNS(0)`).

**Render inside the providers.** Components that call the required context hooks throw outside them ([section 10](#required-context-hooks-throw-outside-their-provider)); render them inside `<Chat>` and the relevant `Channel`, `Thread`, message or composer.

---

## Index of breaking changes

`BC-###` IDs refer to [`ai-docs/v15-breaking-changes.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/v15-breaking-changes.md).

| ID     | Change                                                                         | Section                                                                                                     |
| ------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| BC-001 | `stream-chat` ^10, dependencies, single `@stream-io/state-store`, new subpaths | [1](#packages)                                                                                              |
| BC-002 | Timestamps are `TimestampNS`                                                   | [16](#16-dates-on-response-types-are-unix-nanosecond-numbers)                                               |
| BC-003 | `ChannelStateContext` / `ChannelActionContext` removed                         | [9](#channelstatecontext-and-channelactioncontext-are-removed)                                              |
| BC-004 | `TypingContext` removed                                                        | [9](#typingcontext-is-removed)                                                                              |
| BC-005 | `ComponentContext` slots removed                                               | [10](#removed-componentcontext-slots)                                                                       |
| BC-006 | Context hooks take no `componentName`                                          | [10](#context-hooks-take-no-componentname-argument)                                                         |
| BC-007 | Required context hooks throw                                                   | [10](#required-context-hooks-throw-outside-their-provider)                                                  |
| BC-008 | `useMessageComposerContext` takes no argument and throws                       | [10](#required-context-hooks-throw-outside-their-provider)                                                  |
| BC-009 | `ChannelUnreadUiState` removed                                                 | [9](#the-unread-snapshot-channelunreaduistate-is-removed)                                                   |
| BC-010 | `Window` removed                                                               | [3](#window-and-windowprops-are-removed)                                                                    |
| BC-011 | `ChatView` moved to `slot-layout`                                              | [1](#imports-that-moved), [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots) |
| BC-012 | `ChatView` rebuilt around slots                                                | [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots)                           |
| BC-013 | `setActiveChannel` / `channel` removed; workspace navigation                   | [2](#chatcontext-fields), [4](#4-selecting-channels-and-opening-threads-workspace-navigation)               |
| BC-014 | `ChatContext.channelsQueryState` removed                                       | [2](#chatcontext-fields)                                                                                    |
| BC-015 | `ChatContext.latestMessageDatesByChannels` removed                             | [2](#chatcontext-fields)                                                                                    |
| BC-016 | `useChatContext` argument, throws, `channelManager`                            | [2](#chatcontext-fields), [10](#context-hooks-take-no-componentname-argument)                               |
| BC-017 | `useChat` params and results; `Chat.defaultLanguage`                           | [2](#usechat-and-chatdefaultlanguage)                                                                       |
| BC-018 | `useCreateChatClient` `options` → `config`                                     | [2](#usecreatechatclient-options--config)                                                                   |
| BC-019 | `Channel.channel` required, `EmptyPlaceholder` removed                         | [5](#channel-requires-channel-and-renders-no-placeholder-loading-or-error-state)                            |
| BC-020 | `Channel` no longer watches; `getChannel` removed                              | [5](#channel-no-longer-watches-the-channel)                                                                 |
| BC-021 | `document.title`, `activeUnreadHandler`                                        | [5](#channel-no-longer-writes-documenttitle)                                                                |
| BC-022 | `markReadOnMount` removed                                                      | [5](#markreadonmount-is-removed-the-list-marks-read)                                                        |
| BC-023 | `do*Request` props, `useChannelEditMessageHandler`                             | [14](#14-request-handlers)                                                                                  |
| BC-024 | Attachment props moved to `Attachment`                                         | [5](#props-that-moved-off-channel)                                                                          |
| BC-025 | Mention handlers moved to the lists                                            | [5](#props-that-moved-off-channel)                                                                          |
| BC-026 | `skipMessageDataMemoization` removed                                           | [5](#props-that-moved-off-channel)                                                                          |
| BC-027 | `Channel` lifecycle behavior                                                   | [5](#channel-lifecycle-activation-no-remount-no-reload-no-search-jump)                                      |
| BC-028 | `ChannelList` takes a `ChannelPaginator`                                       | [6](#channellist-is-driven-by-a-channelpaginator)                                                           |
| BC-029 | `ChannelListUI` removed                                                        | [6](#channellistui-is-removed-use-the-list-slots)                                                           |
| BC-030 | `usePaginatedChannels`, `useConnectionRecoveredListener`, query types removed  | [6](#channel-list-hooks-types-and-utilities-are-removed)                                                    |
| BC-031 | Channel-list utilities removed                                                 | [6](#channel-list-hooks-types-and-utilities-are-removed)                                                    |
| BC-032 | `ChannelListContext` fields removed                                            | [6](#channellistcontext-lost-channels-hasnextpage-loadnextpage-and-setchannels)                             |
| BC-033 | `ChannelListItem` props                                                        | [6](#channellistitem-props)                                                                                 |
| BC-034 | `HeaderStartContent` → `StartContent` / `EndContent`                           | [8](#8-channel-and-thread-headers)                                                                          |
| BC-035 | `Thread` takes `thread`, renders children                                      | [7](#thread-takes-a-thread-prop-and-renders-its-children)                                                   |
| BC-036 | `ThreadHeader` props, `ComponentContext.ThreadHeader`                          | [7](#threadheader-lost-closethread-and-thread)                                                              |
| BC-037 | `ThreadProvider` no longer mounts a `Channel`                                  | [7](#threadprovider-no-longer-wraps-its-children-in-a-channel)                                              |
| BC-038 | `ThreadList` reload and selection                                              | [7](#threadlist), [4](#4-selecting-channels-and-opening-threads-workspace-navigation)                       |
| BC-039 | Search results not watched; selection through navigation                       | [4](#search-results)                                                                                        |
| BC-040 | Lost-connection notification                                                   | [2](#the-lost-connection-notification)                                                                      |
| BC-041 | `messageActions` and related exports removed                                   | [10](#messageactions-and-message_actions-are-removed)                                                       |
| BC-042 | Message UI overrides on `MessageUI`                                            | [10](#message-ui-overrides-consolidate-on-the-messageui-slot)                                               |
| BC-043 | `MessageContext.mutes` / `messageIsUnread` removed                             | [12](#messagecontextmutes-and-messageisunread-are-removed)                                                  |
| BC-044 | `retrySendMessage`, `useRetryHandler`                                          | [12](#retrysendmessage-and-useretryhandler)                                                                 |
| BC-045 | Opening a thread from a message                                                | [4](#messageopenthread-and-the-lists-openthread)                                                            |
| BC-046 | List pagination and state props                                                | [11](#pagination-and-state-props-are-removed)                                                               |
| BC-047 | `messages` prop removed                                                        | [11](#the-messages-prop-is-removed)                                                                         |
| BC-048 | `threadList` / `head` removed                                                  | [11](#threadlist-and-head-are-removed-lists-detect-the-thread)                                              |
| BC-049 | `withDateSeparator`                                                            | [11](#disabledateseparator--withdateseparator)                                                              |
| BC-050 | `AIStates` from `stream-chat`                                                  | [12](#aistates-moved-to-stream-chat)                                                                        |
| BC-051 | One voice message at a time                                                    | [12](#allowconcurrentplayback-is-removed-one-voice-message-plays-at-a-time)                                 |
| BC-052 | `usePinHandler` no `canPin`                                                    | [12](#usepinhandler-no-longer-returns-canpin)                                                               |
| BC-053 | `VirtuosoContext` reshaped                                                     | [11](#virtuosocontext-the-context-of-additionalvirtuosopropscomponents)                                     |
| BC-054 | `RenderMessagesOptions`                                                        | [11](#custom-rendermessages-gets-different-options)                                                         |
| BC-055 | Low-level list hooks and utils                                                 | [11](#low-level-list-hooks-and-utils)                                                                       |
| BC-056 | `headerPosition` / `insertIntro` in nanoseconds                                | [11](#headerposition-and-insertintro-take-unix-nanoseconds)                                                 |
| BC-057 | `DateSeparatorMessage`                                                         | [11](#dateseparatormessage)                                                                                 |
| BC-058 | Standalone `Message` needs a channel                                           | [12](#a-standalone-message-needs-a-channel-in-context)                                                      |
| BC-059 | Gallery header timestamp                                                       | [12](#the-gallery-header-renders-the-messagetimestamp-override-for-items-that-carry-their-message)          |
| BC-060 | `overrideSubmitHandler` removed                                                | [13](#overridesubmithandler-is-removed)                                                                     |
| BC-061 | `preventClearingOnUnmount` removed                                             | [13](#preventclearingonunmount-is-removed)                                                                  |
| BC-062 | `handleSubmit` removed                                                         | [13](#handlesubmit-is-removed)                                                                              |
| BC-063 | Failed sends do not restore the composer                                       | [13](#a-failed-send-or-edit-no-longer-restores-the-composer)                                                |
| BC-064 | `hasCustomDoUploadRequest` → `customCdn`                                       | [13](#useattachmentmanagerstate-hascustomdouploadrequest--customcdn)                                        |
| BC-065 | `AttachmentSelector` follows resolved config                                   | [13](#attachment-and-poll-availability)                                                                     |
| BC-066 | Upload helpers moved to `stream-chat`                                          | [1](#imports-that-moved), [13](#upload-helpers-moved-to-stream-chat)                                        |
| BC-067 | English-only bundle, namespaced keys                                           | [18](#18-i18n)                                                                                              |
| BC-068 | Strict `t`                                                                     | [18](#18-i18n)                                                                                              |
| BC-069 | `Streami18n` API                                                               | [18](#18-i18n)                                                                                              |
| BC-070 | Channel and navigation types follow v10                                        | [17](#17-other-stream-chat-v10-data-shapes)                                                                 |
| BC-071 | Message-area types follow v10                                                  | [17](#17-other-stream-chat-v10-data-shapes)                                                                 |
| BC-072 | Composer types follow v10                                                      | [17](#17-other-stream-chat-v10-data-shapes)                                                                 |
| BC-073 | `Window` / `str-chat__main-panel` / `str-chat__container` CSS                  | [19](#19-css-and-markup)                                                                                    |
| BC-074 | Channel list CSS                                                               | [19](#19-css-and-markup)                                                                                    |
| BC-075 | `ChatView` view wrappers                                                       | [19](#19-css-and-markup)                                                                                    |
| BC-076 | `str-chat__thread--virtualized`                                                | [19](#19-css-and-markup)                                                                                    |
| BC-077 | Quote and edit preview colours                                                 | [19](#19-css-and-markup)                                                                                    |
