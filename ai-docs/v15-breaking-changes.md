# React v15 Breaking Changes

Last updated: 2026-10-17

## Scope

This file tracks confirmed v14 to v15 breaking changes in the public API of `stream-chat-react`: exported components, hooks, contexts, utilities and types, plus package-level, behavior, CSS and i18n changes. It is the source of truth for the v14 -> v15 migration guides (`ai-migration-v14-v15.md`, `i18n-v15-migration.md`) and for the docs update.

- Baseline: `release-v14` (v14.13.2 plus unreleased fixes)
- Head: `master` (v15 release candidates)
- Out of scope: changes to `stream-chat` (the LLC) itself. They are documented in `stream-chat-js`. A React prop or type that changed _because_ it is typed with a `stream-chat` v10 type is in scope; see the umbrella entries.
- i18n keys are not listed one by one. See `i18n-v15-key-map.json` and the i18n section.

## Audit Reference

- Baseline: `release-v14` @ `a61c0c419` (`fix(Attachment): render giphy attachments in their own group with uni… (#3325)`)
- Branch point: `0fb5ac306` (`chore(release): 14.12.0`)
- Audited head: `master` @ `557ffcb3c` (`feat!: pass the stream-chat configuration tree through useCreateChatClient (#3321)`), resolved against `stream-chat@10.0.0-rc.22`
- Future mining starting point: diff `557ffcb3c..HEAD` first, then re-run the surface diff below against `release-v14` and resolve every new gated change.

Evidence was gathered four ways, and each confirmed entry rests on at least one of them:

1. **Surface diff**: `scripts/api-surface.mts` dumps every export of every entry point in `package.json` `exports` (kind, call signatures, props / members with optionality and type text, a fingerprint of the referenced types, prop defaults, literal const values, package metadata, CSS classes and custom properties) for both checkouts and diffs them.
2. **Consumer corpus**: the 564 code blocks of the v14 docs (`getstream.io/content/docs/chat-sdk/react/v14-latest`) and the v14 `examples/vite` and `examples/tutorial` sources, typechecked against v14 and against v15. Only errors new under v15 count (322).
3. **History**: every commit and PR description in `0fb5ac306..557ffcb3c`, and the hand-migrated `examples/` diff.
4. **Source review** of both checkouts for behavior changes that keep the same signature.

Only confirmed items should move from this file into the migration guides.

## How To Re-run

```bash
git worktree add ../scr-v14 origin/release-v14
```

```bash
(cd ../scr-v14 && yarn install && yarn build-styling) && yarn build-styling
```

```bash
yarn api-surface dump --root ../scr-v14 --out v14.json --css
```

```bash
yarn api-surface dump --root . --out v15.json --css
```

```bash
yarn api-surface diff --base v14.json --head v15.json --out diff.json --md diff.md
```

```bash
yarn api-surface check --doc ai-docs/v15-breaking-changes.md --diff diff.json
```

`check` fails when a removed export, a removed or newly required prop or member, a changed hook or function signature, a changed default, or a changed constant value is not mentioned in this file. It also fails when an export that moved to another entry point is not named in the same section as its new import path (for example `stream-chat-react/slot-layout`), when a removed dependency or entry point is not named as a whole word, and when a changed dependency or peer range is not stated with its new value in the same section as the package name. Non-gated type-text changes (mostly `stream-chat` v10 type shifts) are reported by `diff` for triage only.

## Status Legend

- `confirmed`: verified in source on both branches
- `likely`: strong signal, but part of the claim (usually its visual or runtime impact) still needs confirmation
- `ruled-out`: investigated and determined not to be a v14 to v15 breaking change (see the coverage map)

## Index

77 entries.

| ID                | Title                                                                                                                                                                                                                         | Group                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [BC-001](#bc-001) | package: `stream-chat` peer is `^10`; `dayjs` / `i18next` are no longer dependencies; `@stream-io/i18n` and `@stream-io/state-store` are added and must resolve to one copy; new subpath exports                              | Package and runtime                                  |
| [BC-002](#bc-002) | server timestamps are `TimestampNS` (branded unix-nanosecond number), not `Date`, in React types that carry response data                                                                                                     | Package and runtime                                  |
| [BC-003](#bc-003) | `ChannelStateContext` / `ChannelActionContext` and their hooks, providers and types are removed                                                                                                                               | Contexts and customization                           |
| [BC-004](#bc-004) | `TypingContext`, `TypingProvider` and `useTypingContext` are removed                                                                                                                                                          | Contexts and customization                           |
| [BC-005](#bc-005) | `ComponentContext` slots `Message`, `ThreadHeader`, `HeaderStartContent` and `ChannelListUI` are removed                                                                                                                      | Contexts and customization                           |
| [BC-006](#bc-006) | context hooks no longer accept a `componentName` argument                                                                                                                                                                     | Contexts and customization                           |
| [BC-007](#bc-007) | required context hooks throw outside their provider                                                                                                                                                                           | Contexts and customization                           |
| [BC-008](#bc-008) | `useMessageComposerContext` takes no argument and throws outside its provider                                                                                                                                                 | Contexts and customization                           |
| [BC-009](#bc-009) | `ChannelUnreadUiState` type is removed                                                                                                                                                                                        | Contexts and customization                           |
| [BC-010](#bc-010) | `Window` and `WindowProps` were removed                                                                                                                                                                                       | Chat, ChatView and layout                            |
| [BC-011](#bc-011) | `ChatView` and its selector helpers moved to the `stream-chat-react/slot-layout` entry point                                                                                                                                  | Chat, ChatView and layout                            |
| [BC-012](#bc-012) | `ChatView` was rebuilt around layout slots: `ChatView.Channels` / `ChatView.Threads` / `ChatView.ThreadAdapter`, `useThreadsViewContext` and `ThreadsViewContextValue` were removed, and `ChatViewContext` renamed its fields | Chat, ChatView and layout                            |
| [BC-013](#bc-013) | `ChatContext.setActiveChannel` / `ChatContext.channel` were removed; selecting a channel or thread now goes through workspace navigation, which does nothing outside `ChatView`                                               | Chat, ChatView and layout                            |
| [BC-014](#bc-014) | `ChatContext.channelsQueryState` was removed                                                                                                                                                                                  | Chat, ChatView and layout                            |
| [BC-015](#bc-015) | `ChatContext.latestMessageDatesByChannels` was removed                                                                                                                                                                        | Chat, ChatView and layout                            |
| [BC-016](#bc-016) | `useChatContext` lost its `componentName` argument, throws outside `<Chat>`, and `ChatContextValue` gained a required `channelManager`                                                                                        | Chat, ChatView and layout                            |
| [BC-017](#bc-017) | `useChat` lost its i18n params and return fields; `Chat.defaultLanguage` was removed                                                                                                                                          | Chat, ChatView and layout                            |
| [BC-018](#bc-018) | `useCreateChatClient`'s `options` was renamed to `config` and takes the stream-chat configuration tree                                                                                                                        | Chat, ChatView and layout                            |
| [BC-019](#bc-019) | `ChannelProps.channel` is required and `EmptyPlaceholder` was removed; `Channel` renders no loading, error or empty state                                                                                                     | Channel                                              |
| [BC-020](#bc-020) | `Channel` no longer watches the channel: `initializeOnMount` and `channelQueryOptions` were removed, and so was `getChannel`                                                                                                  | Channel                                              |
| [BC-021](#bc-021) | `Channel` no longer writes `document.title`; `activeUnreadHandler` was removed                                                                                                                                                | Channel                                              |
| [BC-022](#bc-022) | `markReadOnMount` was removed; `Channel` no longer marks the channel read when it mounts                                                                                                                                      | Channel                                              |
| [BC-023](#bc-023) | `doSendMessageRequest`, `doUpdateMessageRequest`, `doDeleteMessageRequest`, `doMarkReadRequest` and `useChannelEditMessageHandler` were removed                                                                               | Channel                                              |
| [BC-024](#bc-024) | `giphyVersion`, `imageAttachmentSizeHandler`, `videoAttachmentSizeHandler` and `shouldGenerateVideoThumbnail` moved from `Channel` to `Attachment`                                                                            | Channel                                              |
| [BC-025](#bc-025) | `Channel.onMentionsClick` / `onMentionsHover` and `useChannelMentionsHandler` were removed                                                                                                                                    | Channel                                              |
| [BC-026](#bc-026) | `Channel.skipMessageDataMemoization` was removed                                                                                                                                                                              | Channel                                              |
| [BC-027](#bc-027) | `Channel` behavior changes with the same signature: no remount per channel, activation, no reload on reconnect, no search jump                                                                                                | Channel                                              |
| [BC-028](#bc-028) | `ChannelList` is driven by a `ChannelPaginator`: `paginator` is required and every query, event and render prop was removed                                                                                                   | Channel list                                         |
| [BC-029](#bc-029) | `ChannelListUI`, `ChannelListUIProps` and `ComponentContext.ChannelListUI` were removed                                                                                                                                       | Channel list                                         |
| [BC-030](#bc-030) | `usePaginatedChannels`, `useConnectionRecoveredListener` and the `CustomQueryChannelParams` / `CustomQueryChannelsFn` / `EffectiveQueryParams` types were removed                                                             | Channel list                                         |
| [BC-031](#bc-031) | the channel-list utilities were removed: `moveChannelUpwards`, `findLastPinnedChannelIndex`, `extractSortValue`, `isChannelPinned`, `isChannelArchived`, `shouldConsiderPinnedChannels`, `shouldConsiderArchivedChannels`     | Channel list                                         |
| [BC-032](#bc-032) | `ChannelListContext` lost `channels`, `hasNextPage`, `loadNextPage` and `setChannels`                                                                                                                                         | Channel list                                         |
| [BC-033](#bc-033) | `ChannelListItem` / `ChannelListItemUI` / `ChannelListItemTimestamp` props changed: `lastMessage` -> `previewedMessage`, `latestMessagePreview` and `getLatestMessagePreview` removed, selection props removed                | Channel list                                         |
| [BC-034](#bc-034) | `ComponentContext.HeaderStartContent` was removed; `ChannelHeader` and `ThreadHeader` take `StartContent` / `EndContent` and render navigation buttons by default                                                             | Headers, threads and search                          |
| [BC-035](#bc-035) | `Thread` takes a required `thread` prop and renders its children; its composition props and `useLegacyThreadContext` were removed                                                                                             | Headers, threads and search                          |
| [BC-036](#bc-036) | `ThreadHeader` lost its `closeThread` and `thread` props; `ComponentContext.ThreadHeader` was removed                                                                                                                         | Headers, threads and search                          |
| [BC-037](#bc-037) | `ThreadProvider` no longer wraps its children in a `Channel`                                                                                                                                                                  | Headers, threads and search                          |
| [BC-038](#bc-038) | `ThreadList` reloads the thread list on every mount and selects through workspace navigation                                                                                                                                  | Headers, threads and search                          |
| [BC-039](#bc-039) | search results are no longer watched, and selecting one opens it through workspace navigation                                                                                                                                 | Headers, threads and search                          |
| [BC-040](#bc-040) | the lost-connection notification reads connection stores and changes copy for socket drops                                                                                                                                    | Headers, threads and search                          |
| [BC-041](#bc-041) | `messageActions` prop, `MESSAGE_ACTIONS`, `OPTIONAL_MESSAGE_ACTIONS`, `getMessageActions`, `MessageActionsArray`, `Capabilities` and `MessageContext.getMessageActions` / `actionsEnabled` removed                            | Messages and message lists                           |
| [BC-042](#bc-042) | message UI component overrides consolidate on the `MessageUI` slot (`ComponentContext.Message` and the `Message` prop removed)                                                                                                | Messages and message lists                           |
| [BC-043](#bc-043) | `MessageContext.mutes` and `MessageContext.messageIsUnread` removed                                                                                                                                                           | Messages and message lists                           |
| [BC-044](#bc-044) | `retrySendMessage` prop removed; `useRetryHandler` takes no argument and returns a params-object handler                                                                                                                      | Messages and message lists                           |
| [BC-045](#bc-045) | opening a thread from a message goes through workspace navigation; `openThread` is gone from the lists and does nothing without a navigation provider                                                                         | Messages and message lists                           |
| [BC-046](#bc-046) | list pagination and state props removed; the lists read the message paginator                                                                                                                                                 | Messages and message lists                           |
| [BC-047](#bc-047) | `MessageList.messages` / `VirtualizedMessageList.messages` are removed                                                                                                                                                        | Messages and message lists                           |
| [BC-048](#bc-048) | thread-specific list props `threadList` and `head` removed; lists detect the thread from context                                                                                                                              | Messages and message lists                           |
| [BC-049](#bc-049) | `disableDateSeparator` renamed to `withDateSeparator` (inverted)                                                                                                                                                              | Messages and message lists                           |
| [BC-050](#bc-050) | `AIStates` is exported by `stream-chat`, not `stream-chat-react`                                                                                                                                                              | Messages and message lists                           |
| [BC-051](#bc-051) | `WithAudioPlayback.allowConcurrentPlayback` removed; one voice message plays at a time, app-wide                                                                                                                              | Messages and message lists                           |
| [BC-052](#bc-052) | `usePinHandler` no longer returns `canPin`                                                                                                                                                                                    | Messages and message lists                           |
| [BC-053](#bc-053) | `VirtuosoContext` (context of `additionalVirtuosoProps.components`) reshaped                                                                                                                                                  | Messages and message lists                           |
| [BC-054](#bc-054) | custom `renderMessages` receives a different `RenderMessagesOptions`; `ChannelUnreadUiState` removed                                                                                                                          | Messages and message lists                           |
| [BC-055](#bc-055) | exported low-level MessageList hooks and utils changed signature                                                                                                                                                              | Messages and message lists                           |
| [BC-056](#bc-056) | `MessageList.headerPosition` / `insertIntro` take unix nanoseconds (`TimestampNS`)                                                                                                                                            | Messages and message lists                           |
| [BC-057](#bc-057) | `DateSeparatorMessage` (in the `RenderedMessage` union) lost `type`; `unread` is optional                                                                                                                                     | Messages and message lists                           |
| [BC-058](#bc-058) | a standalone `<Message>` needs a channel in context; `highlighted` is no longer derived from channel state                                                                                                                    | Messages and message lists                           |
| [BC-059](#bc-059) | the gallery header renders the `MessageTimestamp` override only for items that carry their message                                                                                                                            | Messages and message lists                           |
| [BC-060](#bc-060) | `MessageComposer.overrideSubmitHandler` was removed                                                                                                                                                                           | Message composer                                     |
| [BC-061](#bc-061) | `MessageComposer.preventClearingOnUnmount` was removed; a supplied composer is never cleared on unmount                                                                                                                       | Message composer                                     |
| [BC-062](#bc-062) | `handleSubmit` was removed from `MessageComposerContext` and `useMessageComposerBindings`; submit with `useMessageComposerSubmitFn()` or `messageComposer.send()` / `update()`                                                | Message composer                                     |
| [BC-063](#bc-063) | a failed send or edit no longer restores the composer                                                                                                                                                                         | Message composer                                     |
| [BC-064](#bc-064) | `useAttachmentManagerState().hasCustomDoUploadRequest` was replaced by `customCdn`                                                                                                                                            | Message composer                                     |
| [BC-065](#bc-065) | `AttachmentSelector` actions follow the composer's resolved configuration, and `customCdn` decides whether upload permission applies                                                                                          | Message composer                                     |
| [BC-066](#bc-066) | `getAttachmentPreviewUrl`, `hasPendingUploadState` and `isUploadConfirmationPending` moved to `stream-chat`                                                                                                                   | Message composer                                     |
| [BC-067](#bc-067) | English-only bundle and namespaced keys. Built-in dictionaries, `isLanguageSupported` and `SupportedTranslations` are removed                                                                                                 | i18n                                                 |
| [BC-068](#bc-068) | `t` from `useTranslationContext()` is strictly typed. `t('English text')` and `t(someString)` no longer compile                                                                                                               | i18n                                                 |
| [BC-069](#bc-069) | `Streami18n` public API reshaped: members removed, `setLanguage` returns `void`, `t` is read-only, formatter and date-parser types changed                                                                                    | i18n                                                 |
| [BC-070](#bc-070) | values typed with stream-chat types changed shape in channel/navigation hooks and contexts (umbrella)                                                                                                                         | Types that follow stream-chat v10 (umbrella entries) |
| [BC-071](#bc-071) | message-area props typed with `stream-chat` types change shape with `stream-chat` v10 (umbrella)                                                                                                                              | Types that follow stream-chat v10 (umbrella entries) |
| [BC-072](#bc-072) | composer prop and type changes that follow stream-chat v10 types (umbrella)                                                                                                                                                   | Types that follow stream-chat v10 (umbrella entries) |
| [BC-073](#bc-073) | CSS, channel layout wrappers: `Window` and the `str-chat__main-panel` / `str-chat__container` wrappers are removed                                                                                                            | CSS and markup                                       |
| [BC-074](#bc-074) | CSS, channel list: `ChannelListUI` wrappers removed; the theme scope moves to `ChatView`, with the channel list carrying its own only outside it                                                                              | CSS and markup                                       |
| [BC-075](#bc-075) | CSS, ChatView: `str-chat__chat-view__channels` / `__threads` render only in `views` mode                                                                                                                                      | CSS and markup                                       |
| [BC-076](#bc-076) | CSS, Thread: `str-chat__thread--virtualized` is no longer applied                                                                                                                                                             | CSS and markup                                       |
| [BC-077](#bc-077) | quote and edit previews set their text colour from the matching bubble token                                                                                                                                                  | CSS and markup                                       |

## Package and runtime

### BC-001: package: `stream-chat` peer is `^10`; `dayjs` / `i18next` are no longer dependencies; `@stream-io/i18n` and `@stream-io/state-store` are added and must resolve to one copy; new subpath exports

- Status: confirmed
- Area: package
- User impact:
  - install: the peer range moves from `stream-chat ^9.54.0` to `^10.0.0-rc.20`. v9 no longer satisfies it, and v10 itself is a breaking LLC release.
  - an app that imported `dayjs` / `i18next` without declaring them (relying on them being hoisted from this package) now resolves them only transitively through `@stream-io/i18n`, or not at all. If the app installs `dayjs` itself, its version must dedupe with `@stream-io/i18n`'s `dayjs` (`^1.11.23`), or `import 'dayjs/locale/xx'` registers on a different instance and dates stay English.
  - a second copy of `@stream-io/state-store` breaks type compatibility: `StateStore` has `protected` members, so stores from two copies are not assignable to `useStateStore`'s parameter. `StateStore` must be imported from `@stream-io/state-store`; `stream-chat` v10 no longer exports it.
  - `ChatView` and its selector family moved to `stream-chat-react/slot-layout` (the import path change itself belongs to the ChatView/slot-layout entry). `stream-chat-react/slot-geometry` is new. `ai-components` already existed in v14.
- Old API:
  - `peerDependencies.stream-chat: ^9.54.0`; `dependencies.dayjs: ^1.11.20`; `dependencies.i18next: ^25.10.10`; `sideEffects` listed `dist/es/i18n/Streami18n.mjs` and `dist/es/context/TranslationContext.mjs`
- Replacement: install `stream-chat@^10` (rc). Remove `dayjs` / `i18next` from the app's own dependencies if they were only there for this SDK; if kept, match the ranges `@stream-io/i18n` uses. Make sure the lockfile has exactly one `@stream-io/state-store` (and one `stream-chat`). For example, check that `npm ls @stream-io/state-store` / `yarn why @stream-io/state-store` reports a single version. A linked `stream-chat` checkout needs bundler dedupe (see `resolve.dedupe` in `vitest.config.ts`).
- Evidence:
  - `release-v14:package.json` vs `master:package.json`: `peerDependencies.stream-chat` `^9.54.0` -> `^10.0.0-rc.20` (`master:package.json:147`); `dependencies` lose `dayjs`, `i18next` and gain `@stream-io/i18n ^1.0.2`, `@stream-io/state-store ^1.1.6` (`:107-108`); `exports` gain `./slot-geometry`, `./slot-layout` (`:43-54`); `sideEffects` drops the two i18n modules
  - `stream-chat@10.0.0-rc.22` `package.json` dependencies: `@stream-io/logger`, `@stream-io/state-store ^1.1.6`, `axios`, `linkifyjs` (no `dayjs` / `i18next`)
  - `@stream-io/i18n@1.0.2` `package.json` dependencies: `dayjs ^1.11.23`, `i18next ^26.4.2`
  - `@stream-io/state-store` `dist/esm/state-store.d.ts` `class StateStore` with `protected value / handlers / preprocessors`
  - `master:src/store/hooks/useStateStore.ts:4` `import type { StateStore } from '@stream-io/state-store'` (v14: `from 'stream-chat'`); `master:src/components/Dialog/service/DialogManager.ts` and `master:src/components/InfiniteScrollPaginator/hooks/useCursorPaginator.ts` likewise
  - commits: `99cbe6704` (PR #3237, "BREAKING CHANGE: requires stream-chat v10"); `eb3ae7a5d` (PR #3284); `f68cad332` (PR #3271, drops `i18next` / `dayjs` / `moment-timezone`)
  - corpus: `examples/examples/vite/src/AppSettings/state.ts:1` `'"stream-chat"' has no exported member 'StateStore'` (LLC side of the same move)
- Docs impact:
  - `01-basics/02-installation.md` (peer and dependency list), `04-guides/03-translations.md` (dayjs locale imports), `04-guides/07-sdk-state-management.md` (`StateStore` import)
- Example needed: no

### BC-002: server timestamps are `TimestampNS` (branded unix-nanosecond number), not `Date`, in React types that carry response data

- Status: confirmed
- Area: types (umbrella for every prop and type typed off an LLC response model)
- User impact:
  - compile errors: `new Date(timestamp)` is rejected by `stream-chat`'s `DateConstructor` augmentation; a plain `number` or a `Date` is not assignable to a `TimestampNS` prop; `.getTime()` on a timestamp fails.
  - **silent**: a date library reads a bare number as milliseconds (`dayjs(created_at)` renders `Invalid Date`); `new Date(ts ?? Date.now())` compiles; comparing a timestamp with `Date.now()` is a unit mix-up with no error; a raw timestamp passed through `t('timestamp.X', { timestamp })` is not type-checked.
- Old API (React-side surfaces whose type changed; all other occurrences come from LLC types):
  - `MessageListProps.headerPosition`, `insertIntro(messages, headerPosition)`: `number` (epoch ms) -> `TimestampNS`
  - `ProcessMessagesParams.lastRead`: `Date | null` -> `TimestampNS | null`
  - `VirtualizedMessageList` render-prop context `lastReadDate`: `Date | undefined` -> `TimestampNS | null`. `getIsFirstUnreadMessage` no longer takes `lastReadDate`: its params are now `UnreadSnapshotState & { channel?, isFirstMessage, message, previousMessage? }`, so `lastReadDate?: Date` -> `lastReadAt: TimestampNS | null` and `unreadMessageCount` -> `unreadCount`
  - `RenderedMessage.created_at` / `updated_at` / `deleted_at` / `pinned_at`: `Date` -> `TimestampNS` (via `LocalMessage`)
  - `useChannelMembershipState()` fields, `RenderTextMentionEntity` / `DefaultSuggestionListItemEntity` date fields: `string` -> `TimestampNS` (LLC response types)
  - `ChatContextValue.latestMessageDatesByChannels`: removed outright (ChatContext entry)
- Replacement: compare and sort the raw numbers. Convert at the render boundary with `convertTimestampToDate(ts)` (returns `Date | undefined`; handle the `undefined`), or `nsToDate` / `nsToMs` for values known to be present. Mint values with `nowNs()`, `msToNs(ms)`, `dateToNs(date)`, `asTimestampNS(n)`. All are exported from `stream-chat`. Presentational props still take `Date`: `DateSeparator.date: Date`, `formatDate?: (date: Date) => string`, `Timestamp.timestamp?: Date | string`. Outgoing request fields (filter bounds, `remind_at`) stay `Date`.
- Evidence:
  - `release-v14:src/components/MessageList/utils.ts:34` `lastRead?: Date | null`, `:205` `insertIntro(…, headerPosition?: number)`, `:360` `lastReadDate?: Date`; `release-v14:src/components/MessageList/MessageList.tsx:529` `headerPosition?: number`; `release-v14:src/components/MessageList/VirtualizedMessageList.tsx:134` `lastReadDate?: Date`
  - `master:src/components/MessageList/utils.ts:47` `lastRead?: TimestampNS | null`, `:223` `headerPosition?: TimestampNS`; `master:src/components/MessageList/MessageList.tsx:474` `headerPosition?: TimestampNS`; `master:src/components/MessageList/VirtualizedMessageList.tsx:135` `lastReadDate: TimestampNS | null`
  - `master:src/components/DateSeparator/DateSeparator.tsx:13,17` `date: Date`, `formatDate?: (date: Date) => string`; `master:src/components/Message/Timestamp.tsx:12` `timestamp?: Date | string`
  - `stream-chat@10.0.0-rc.22` `dist/types/utils/time.d.ts:39-85` `asTimestampNS`, `nsToMs`, `msToNs`, `nowNs`, `nsToDate`, `dateToNs`, `convertTimestampToDate`; re-exported at `dist/types/index.d.ts:42`
  - commits: `cb472c35f feat!: move to timestamps in response models` (PR #3278); `aaa7fa31e feat!: adopt stream-chat's branded TimestampNS` (PR #3297)
  - `ai-migration-v14-v15.md` "Dates on response types are unix-nanosecond numbers", "The public React types that changed" and "Presentational props still take `Date`" match the source above
  - corpus: `docs/03-ui-cookbook__11-hide-channel-history-before__1.tsx:22,39,40` (`getTime` on `TimestampNS`, `TS2339` / `TS2740`); `examples/examples/vite/src/AppSettings/ActionsMenu/WebSocketEventPromptDialog/websocketEventTemplates.ts:126,130,136,149,154,218,238,243,249,254` (`string` -> `TimestampNS`); `examples/examples/vite/src/AppSettings/tabs/Reactions/reactionsExampleData.ts:9,120` (`Date` -> `TimestampNS`). All are LLC-model values; listed here because this is the umbrella.
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md` (`headerPosition`), `02-ui-components/08-message/13-date_separator.md`, `03-ui-cookbook/11-hide-channel-history-before.md`, `04-guides/08-date-time-formatting.md`
- Example needed: yes

Before (v14):

```tsx
import { DateSeparator } from 'stream-chat-react';
import type { LocalMessage } from 'stream-chat';

export const DayDivider = ({ message }: { message: LocalMessage }) => (
  <DateSeparator date={new Date(message.created_at)} />
);
```

After (v15):

```tsx
import { convertTimestampToDate } from 'stream-chat';
import type { LocalMessage } from 'stream-chat';
import { DateSeparator } from 'stream-chat-react';

export const DayDivider = ({ message }: { message: LocalMessage }) => {
  const createdAt = convertTimestampToDate(message.created_at);
  return createdAt ? <DateSeparator date={createdAt} /> : null;
};
```

## Contexts and customization

### BC-003: `ChannelStateContext` / `ChannelActionContext` and their hooks, providers and types are removed

- Status: confirmed
- Area: contexts
- User impact: compile error on import (`TS2724` / `TS2305`). In plain JS, the import is `undefined`, so calling it throws at render. Every component that read channel state or called channel actions through these hooks has to be rewritten against the `channel` instance.
- Old API:
  - `ChannelStateContext`, `ChannelStateContextValue`, `ChannelStateProvider`, `useChannelStateContext`
  - `ChannelState` (the React-side state shape), `ChannelNotifications`
  - `ChannelActionContext`, `ChannelActionContextValue`, `ChannelActionProvider`, `useChannelActionContext`
  - `MarkReadWrapperOptions`, `RetrySendMessage`
- Replacement: read the channel with `useChannel()`, which is exported from the root and throws outside a `Channel` or `Thread` subtree. Use `useChannelInstanceContext()` when the channel may be absent. Then read or act on the instance. Subscribe reactively with `useStateStore(store, selector)`, using a selector defined at module scope.

  | v14 (`useChannelStateContext`)                                                                                 | v15                                                                                                                                                                                                                                                                                                     |
  | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `channel`                                                                                                      | `useChannel()`                                                                                                                                                                                                                                                                                          |
  | `messages`                                                                                                     | `channel.messagePaginator.state` -> `items`                                                                                                                                                                                                                                                             |
  | `hasMore` (older) / `hasMoreNewer`                                                                             | `messagePaginator.state` -> `hasMoreTail` / `hasMoreHead` (also the getters `messagePaginator.hasMoreTail` / `.hasMoreHead`)                                                                                                                                                                            |
  | `loading`, `loadingMore`, `loadingMoreNewer`                                                                   | `messagePaginator.state` -> `isLoading`                                                                                                                                                                                                                                                                 |
  | `error`                                                                                                        | `messagePaginator.state` -> `lastQueryError`                                                                                                                                                                                                                                                            |
  | `members`, `read`, `watchers`, `watcherCount` / `watcher_count`                                                | `useStateStore(channel.state, selector)` (keys `members`, `read`, `watchers`, `watcherCount`), or the non-reactive getters `channel.state.members` / `.read` / `.watchers` / `.watcher_count`                                                                                                           |
  | `pinnedMessages`                                                                                               | `channel.pinnedMessagesPaginator.state`                                                                                                                                                                                                                                                                 |
  | `thread`, `threadMessages`, `threadHasMore`, `threadLoadingMore`                                               | `useThreadContext()` (the `Thread` instance) and `thread.messagePaginator`                                                                                                                                                                                                                              |
  | `channelCapabilities`                                                                                          | `useChannelCapabilities({ cid })` (returns a `Set<string>`), or `ownCapabilities` from `channel.state`                                                                                                                                                                                                  |
  | `channelConfig`                                                                                                | `channel.serverConfig` (same `ChannelConfigWithInfo` shape as v14's `channelConfig`; a non-reactive getter, `undefined` until queried). `channel.configState` is a different shape: the resolved client-side gates (`typingEvents`, `readEvents`, `replies`, `requestHandlers`, ...), as a `StateStore` |
  | `imageAttachmentSizeHandler`, `videoAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, `giphyVersion`     | `useAttachmentContext()`                                                                                                                                                                                                                                                                                |
  | `channelUnreadUiState`                                                                                         | `channel.messagePaginator.unreadStateSnapshot` (see BC-009)                                                                                                                                                                                                                                             |
  | `mutes`                                                                                                        | `useChatContext().mutes`                                                                                                                                                                                                                                                                                |
  | `notifications`                                                                                                | none. Notifications go through `client.notifications`.                                                                                                                                                                                                                                                  |
  | `suppressAutoscroll`, `threadSuppressAutoscroll`, `highlightedMessageId`, `loadingMoreForJumpToChannelMessage` | none (internal to the message lists)                                                                                                                                                                                                                                                                    |

  | v14 (`useChannelActionContext`)                                              | v15                                                                                                                                             |
  | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
  | `loadMore` (older) / `loadMoreNewer`                                         | `channel.messagePaginator.toTail()` / `.toHead()`. `MessageList` uses exactly these: `toTail` on scroll-to-top, `toHead` on scroll-to-bottom.   |
  | `loadMoreThread`                                                             | `thread.messagePaginator.toTail()`                                                                                                              |
  | `jumpToMessage(id)` / `jumpToLatestMessage()` / `jumpToFirstUnreadMessage()` | `channel.messagePaginator.jumpToMessage(id)` / `.jumpToTheLatestMessage()` / `.jumpToTheFirstUnreadMessage()`                                   |
  | `sendMessage`                                                                | `messageComposer.send()` (or `useMessageComposerSubmitFn()`). Lower level: `channel.messageOperations.send({ localMessage, message, options })` |
  | `retrySendMessage` / `RetrySendMessage`                                      | `channel.messageOperations.retry({ localMessage })`, or `handleRetry` from `useMessageContext()`                                                |
  | `editMessage`                                                                | `messageComposer.update()` or `channel.messageOperations.update({ localMessage, options })`                                                     |
  | `deleteMessage`                                                              | `channel.messageOperations.delete({ localMessage, options })`, or `handleDelete` from `useMessageContext()`                                     |
  | `updateMessage` / `removeMessage` (local-only list writes)                   | `channel.messagePaginator.ingestItem(message)` / `.removeItem({ id })`. Normally unnecessary: the LLC applies WS events itself.                 |
  | `markRead` / `MarkReadWrapperOptions`                                        | `channel.markRead()`. The unread UI snapshot is separate state on the paginator; there is no `updateChannelUiUnreadState` option.               |
  | `setChannelUnreadUiState`                                                    | `channel.messagePaginator.setUnreadSnapshot(partial)`                                                                                           |
  | `openThread` / `closeThread`                                                 | `useWorkspaceNavigation().openThread({ channel, message })` / `.closeThread(threadId)`. Inside a thread, `useCloseThread()`.                    |
  | `onMentionsClick` / `onMentionsHover`                                        | the `onMentionsClick` / `onMentionsHover` props on `MessageList` / `Message`                                                                    |
  | `dispatch`                                                                   | none, removed (there is no React reducer)                                                                                                       |

  Custom send/update/delete/markRead request overrides are registered on `client.config` (see "Per-component request-handler props removed" in `ai-migration-v14-v15.md`).

- Evidence:
  - `release-v14:src/context/ChannelStateContext.tsx:18,24,48,62,66,79` exported `ChannelNotifications`, `ChannelState`, `ChannelStateContextValue`, `ChannelStateContext`, `ChannelStateProvider`, `useChannelStateContext`
  - `release-v14:src/context/ChannelActionContext.tsx:19,28,30,71,75,86` exported `MarkReadWrapperOptions`, `RetrySendMessage`, `ChannelActionContextValue`, `ChannelActionContext`, `ChannelActionProvider`, `useChannelActionContext`
  - `release-v14:src/context/index.ts:2,4` re-exported both files. `master:src/context/index.ts:1-21` exports neither (the files are deleted).
  - `master:src/context/useChannel.ts:6` `useChannel(): Channel` (thread's channel first, then `ChannelInstanceContext`; throws otherwise)
  - `master:src/context/ChannelInstanceContext.tsx:28` `useChannelInstanceContext(): Partial<ChannelInstanceContextValue>`
  - `master:src/context/AttachmentContext.tsx:19-24,40` `AttachmentContextValue` { `giphyVersion`, `imageAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`, `videoAttachmentSizeHandler` }, `useAttachmentContext`
  - `master:src/components/Channel/hooks/useChannelCapabilities.ts:10` `useChannelCapabilities({ cid })`
  - `master:src/components/MessageList/MessageList.tsx:243` older page via `messagePaginator.toTail()`; `:388` newer via `messagePaginator.toHead`
  - `master:src/components/Message/hooks/useRetryHandler.ts:16` `(thread ?? channel).messageOperations.retry(params)`; `master:src/components/Message/hooks/useDeleteHandler.ts:36` `entity.messageOperations.delete(...)`
  - `master:src/components/Threads/hooks/useCloseThread.ts:14`; `master:src/context/WorkspaceNavigationContext.tsx:102,136` `closeThread`, `openThread`
  - `stream-chat@10.0.0-rc.22` `dist/types/pagination/paginators/BasePaginator.d.ts:505-516` `hasMoreTail` / `hasMoreHead` (the `hasNext` / `hasPrev` aliases are `@deprecated`), `:1154-1163` `toTail` / `toHead` (`next` / `prev` are `@deprecated`); `MessageIntervalPaginator.d.ts:279-280`, `MessagePaginator.d.ts:144,148,199,200`
  - `stream-chat@10.0.0-rc.22` `dist/types/messageOperations/MessageOperations.d.ts:64-70` `send` / `retry` / `update` / `delete`, taking `{ localMessage, options?, message? }` (`types.d.ts:26-31`)
  - commit: `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237)
  - examples: `examples.diff` `examples/ai-chatbot/src/components/AIStateIndicator/AIStateIndicator.tsx` (`useChannelStateContext()` -> `useChannel()`), `examples/ai-chatbot/src/components/MessageInputBar/MessageInputBar.tsx` (`useChannelActionContext().sendMessage` -> `composer.send()`), `examples/vite/src/AppSettings/tabs/Reactions/ReactionsTab.tsx` (removed `ChannelActionProvider` / `ChannelStateProvider` wrappers)
  - corpus: `docs/02-ui-components__04-channel__01-channel__3.tsx:4,5`, `docs/02-ui-components__04-channel__02-channel_header__3.tsx:6`, `docs/02-ui-components__07-message-list__01-message_list__1.tsx:3`, `docs/02-ui-components__08-message__06-render-text__7.tsx:7`, `docs/02-ui-components__10-channel-detail__01-channel-detail__2.tsx:3`, `docs/03-ui-cookbook__04-message__02-reactions__4.tsx:8`, `docs/03-ui-cookbook__05-message-composer__06-suggestion_list__1.tsx:6`, `docs/03-ui-cookbook__05-message-composer__07-typing_indicator__1.tsx:6`, `docs/03-ui-cookbook__09-channel_header__1.tsx:7`, `docs/03-ui-cookbook__11-hide-channel-history-before__1.tsx:4`, `docs/04-guides__05-channel_read_state__1.tsx:3`, `docs/04-guides__05-channel_read_state__2.tsx:3`, `docs/04-guides__07-sdk-state-management__1.tsx:4`, `docs/04-guides__16-ai-integrations__01-overview__9.tsx:10`, `docs/04-guides__16-ai-integrations__01-overview__10.tsx:6`, `docs/04-guides__16-ai-integrations__02-chat-sdk-integration__7.tsx:8`, `examples/examples/vite/src/AppSettings/tabs/Reactions/ReactionsTab.tsx:3,4`, `examples/examples/vite/src/ChannelPreviewOverlay/ChannelPreviewOverlay.tsx:8`, `examples/examples/vite/src/ChatLayout/Panels.tsx:18`, `examples/examples/vite/src/InlineEditMessage/InlineEditMessage.tsx:12`, `examples/examples/vite/src/PublicChannelOverlay/PublicChannelOverlay.tsx:8` (all `TS2724`)
- Docs impact:
  - `02-ui-components/04-channel/03-channel_action_context.md`, `02-ui-components/04-channel/04-channel_state_context.md` (whole pages obsolete)
  - `01-basics/01-overview.md`, `02-ui-components/01-getting_started.md`, `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/02-channel_header.md`, `02-ui-components/07-message-list/01-message_list.md`, `02-ui-components/07-message-list/02-virtualized_list.md`, `02-ui-components/08-message/01-message.md`, `02-ui-components/08-message/02-message_context.md`, `02-ui-components/08-message/06-render-text.md`, `02-ui-components/10-channel-detail/01-channel-detail.md`
  - `03-ui-cookbook/02-channel-list/03-channel-user-lists.md`, `03-ui-cookbook/04-message/02-reactions.md`, `03-ui-cookbook/05-message-composer/06-suggestion_list.md`, `03-ui-cookbook/05-message-composer/07-typing_indicator.md`, `03-ui-cookbook/09-channel_header.md`, `03-ui-cookbook/11-hide-channel-history-before.md`
  - `04-guides/05-channel_read_state.md`, `04-guides/07-sdk-state-management.md`, `04-guides/16-ai-integrations/01-overview.md`, `04-guides/16-ai-integrations/02-chat-sdk-integration.md`
- Example needed: yes

Before (v14):

```tsx
import { useChannelActionContext, useChannelStateContext } from 'stream-chat-react';

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

After (v15):

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

### BC-004: `TypingContext`, `TypingProvider` and `useTypingContext` are removed

- Status: confirmed
- Area: contexts
- User impact: compile error on import (`TS2305`). Custom typing indicators and headers that read `typing` from context have to subscribe to the channel's own store.
- Old API:
  - `TypingContext`, `TypingContextValue`, `TypingProvider`, `useTypingContext`
- Replacement: `useStateStore(channel.state, ({ typing }: ChannelStateData) => ({ typing }))`, with `channel` from `useChannel()`. `channel.state` is a `StateStore<ChannelStateData>` in `stream-chat` v10, and `typing` is `Record<string, Event>` keyed by user id. The non-reactive snapshot is `channel.state.typing`. The SDK's own `TypingIndicator` reads the composer's `textComposer.state.typing` and filters by `parent_id` for threads.
- Related (merged from the message-area draft):
  - the `typing_events` gate moved from `ChannelStateContext.channelConfig` to `useStateStore(channel.configState, (c: ChannelConfig) => ({ enabled: c.typingEvents.enabled }))`
  - for thread-scoped indicators, compare `parent_id` with the parent message from `useStateStore(useThreadContext()?.state, (s: ThreadState) => ({ parentMessage: s.parentMessage }))`
- Evidence:
  - `release-v14:src/context/TypingContext.tsx:6,10,14,25` exported `TypingContextValue`, `TypingContext`, `TypingProvider`, `useTypingContext`; `release-v14:src/context/index.ts:17` re-exported it
  - `master:src/context/index.ts` no `TypingContext` (file deleted)
  - `stream-chat@10.0.0-rc.22` `dist/types/channel_state.d.ts:51-52` `TypingUsersState = { typing: Record<string, Event> }`, `:169` part of `ChannelStateData`, `:177` `class ChannelState extends StateStore<ChannelStateData>`
  - `master:src/components/TypingIndicator/TypingIndicator.tsx:61-62` reads `typing` from `messageComposer.textComposer.state`
  - commit: `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237), body: "The `TypingContext` provider path was removed from the `Channel` runtime."
  - corpus: `docs/02-ui-components__04-channel__01-channel__3.tsx:7`, `docs/02-ui-components__04-channel__02-channel_header__3.tsx:7`, `docs/03-ui-cookbook__05-message-composer__07-typing_indicator__1.tsx:8`, `docs/03-ui-cookbook__09-channel_header__1.tsx:8` (`TS2305`)
- Docs impact:
  - `02-ui-components/09-message-composer/09-typing_context.md` (whole page obsolete)
  - `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/02-channel_header.md`, `03-ui-cookbook/05-message-composer/07-typing_indicator.md`, `03-ui-cookbook/09-channel_header.md`
- Example needed: yes

Before (v14):

```tsx
import { useTypingContext } from 'stream-chat-react';

export const TypingCount = () => {
  const { typing } = useTypingContext();
  return <span>{Object.keys(typing ?? {}).length} typing</span>;
};
```

After (v15):

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

### BC-005: `ComponentContext` slots `Message`, `ThreadHeader`, `HeaderStartContent` and `ChannelListUI` are removed

- Status: confirmed
- Area: ComponentContext / `WithComponents`
- User impact: a stale key in `WithComponents overrides` is a compile error in TypeScript (`TS2353` / `TS2561`, which suggests `MessageUI` for `Message`). In plain JS, or behind `any`, the key is ignored with no warning and the default UI renders, or nothing renders for `HeaderStartContent`.
- Old API:
  - `ComponentContextValue.Message` (deprecated in v14)
  - `ComponentContextValue.ThreadHeader`
  - `ComponentContextValue.HeaderStartContent`
  - `ComponentContextValue.ChannelListUI`
- Replacement:
  - `Message` -> the `MessageUI` slot. `VirtualMessage` still overrides inside `VirtualizedMessageList` only. The `Message` _props_ on the lists and `Thread` belong to the message area's entry.
  - `ThreadHeader` -> render `<ThreadHeader />` (or your own header) as a child of `<Thread thread={thread}>`. `Thread` renders children and no header of its own.
  - `HeaderStartContent` -> the `StartContent` prop on `ChannelHeader` / `ThreadHeader`, which defaults to `WorkspaceNavigationBackButton`. `EndContent` defaults to `WorkspaceNavigationCloseButton`. `HeaderEndContent` stays on `ComponentContext` for the list headers.
  - `ChannelListUI` -> no wrapper slot. `ChannelList` renders an `InfiniteScrollPaginator` and reads the new slots `EmptyListIndicator`, `EndReachedIndicator`, `FirstPageLoadingIndicator`, `ListItem` and `LoadingNextPageIndicator` from `ComponentContext`. Only `ChannelList` reads them today.
- Evidence:
  - `release-v14:src/context/ComponentContext.tsx:129` `ChannelListUI?`, `:179` `Message?` (`@deprecated use MessageUI`), `:288` `ThreadHeader?`, `:305` `HeaderStartContent?`
  - `master:src/context/ComponentContext.tsx` none of the four; `:187` `MessageUI?`, `:294` `ThreadHead?`, `:309` `HeaderEndContent?`, `:317` `VirtualMessage?`, `:88-102` the new list slots
  - `master:src/components/ChannelHeader/ChannelHeader.tsx:58,64,77,79` and `master:src/components/Thread/ThreadHeader.tsx:85,91,97,99` `StartContent` / `EndContent` props with the workspace-navigation defaults
  - `master:src/components/Thread/Thread.tsx:41-56` JSDoc: `<Thread thread={thread}><ThreadHeader />…</Thread>`
  - `master:src/components/ChannelList/ChannelList.tsx:48-54` reads `EmptyListIndicator`, `EndReachedIndicator`, `FirstPageLoadingIndicator`, `ListItem`, `LoadingNextPageIndicator` from `useComponentContext()`
  - commits: `07664893e feat(context): consolidate message UI overrides on the MessageUI slot` (PR #3268); `c2136f307 refactor!: align Thread with Channel - instance prop, provider, children` (PR #3289); `66557d63b feat!: port the tutorial alignment (#3251) to v15, with panel-aware workspace navigation` (PR #3301); `99cbe6704` (PR #3237) for `ChannelListUI`
  - examples: `examples.diff` drops `HeaderStartContent: SidebarToggle` from `examples/vite/src/App.tsx` overrides and `examples/vite/src/ChatLayout/Panels.tsx` passes `StartContent={HeaderStartWithSidebarToggle}` to `ChannelHeader` / `ThreadHeader`
- Docs impact:
  - `02-ui-components/04-channel/05-component_context.md` (all four slots)
  - `HeaderStartContent`: `02-ui-components/03-chat/01-chat.md`, `02-ui-components/04-channel/02-channel_header.md`, `03-ui-cookbook/12-collapsible-sidebar.md`, `06-release-guides/01-upgrade-to-v14.md`
  - `ThreadHeader`: `02-ui-components/07-message-list/05-thread.md`, `02-ui-components/12-indicators.md`, `03-ui-cookbook/10-thread_header.md`, `03-ui-cookbook/05-message-composer/07-typing_indicator.md`
  - `ChannelListUI`: `02-ui-components/05-channel-list/01-channel_list.md`, `02-ui-components/05-channel-list/02-channel_list_context.md`, `03-ui-cookbook/02-channel-list/01-channel_list_preview.md`
- Example needed: yes

Before (v14):

```tsx
import { Channel, ChannelHeader, Thread, WithComponents } from 'stream-chat-react';
import { CustomMessage, CustomThreadHeader, SidebarToggle } from './custom';

export const Layout = () => (
  <WithComponents
    overrides={{
      HeaderStartContent: SidebarToggle,
      Message: CustomMessage,
      ThreadHeader: CustomThreadHeader,
    }}
  >
    <Channel>
      <ChannelHeader />
      <Thread />
    </Channel>
  </WithComponents>
);
```

After (v15):

```tsx
import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  Thread,
  WithComponents,
  WorkspaceNavigationBackButton,
} from 'stream-chat-react';
import { CustomMessage, CustomThreadHeader, SidebarToggle } from './custom';

const HeaderStart = () => (
  <>
    <WorkspaceNavigationBackButton />
    <SidebarToggle />
  </>
);

export const Layout = ({
  channel,
  thread,
}: {
  channel: StreamChannel;
  thread?: StreamThread;
}) => (
  <WithComponents overrides={{ MessageUI: CustomMessage }}>
    <Channel channel={channel}>
      <ChannelHeader StartContent={HeaderStart} />
    </Channel>
    {thread && (
      <Thread thread={thread}>
        <CustomThreadHeader />
        <MessageList />
        <MessageComposer />
      </Thread>
    )}
  </WithComponents>
);
```

### BC-006: context hooks no longer accept a `componentName` argument

- Status: confirmed
- Area: contexts
- User impact: compile error `TS2554 Expected 0 arguments, but got 1` at every call that passes a name. In plain JS the argument is ignored and nothing else changes.
- Old API:
  - `useChatContext(componentName?)`, `useTranslationContext(componentName?)`, `useMessageContext(_componentName?)`, `useComponentContext(_componentName?)`, `useMessageComposerContext(componentName?)`, `useMessageListContext(componentName?)`, `useMessageBounceContext(componentName?)`
- Replacement: call each hook with no argument, for example `useChatContext()`.
- Evidence:
  - `release-v14:src/context/ChatContext.tsx:75`, `TranslationContext.tsx:34`, `MessageContext.tsx:146`, `ComponentContext.tsx:333-339`, `MessageComposerContext.tsx:27`, `MessageListContext.tsx:32`, `MessageBounceContext.tsx:21` (each takes an optional name)
  - `master:src/context/ChatContext.tsx:61`, `MessageContext.tsx:132`, `ComponentContext.tsx:333`, `MessageComposerContext.tsx:26`, `MessageListContext.tsx:33`, `MessageBounceContext.tsx:26` take no parameters; `master:src/context/TranslationContext.tsx:25-32` is built by `createTranslationContext` from `@stream-io/i18n/react`, with no parameter
  - commit: `9194215f0 feat(context): drop componentName param from context consumer hooks` (PR #3267)
  - examples: `examples.diff` `useChatContext('ChannelsPanels')`, `useChatContext('ComposerStateDialog')`, `useChatContext('StreamDebugHandles')` -> `useChatContext()`
  - corpus: `docs/03-ui-cookbook__04-message__02-reactions__4.tsx:15`, `docs/03-ui-cookbook__04-message__04-message_actions__1.tsx:14`, `docs/03-ui-cookbook__04-message__04-message_actions__2.tsx:12`, `docs/03-ui-cookbook__07-emoji_picker__3.tsx:15`, `docs/04-guides__03-translations__17.tsx:6`, `docs/04-guides__11-blocking-users__4.tsx:15,16`, `examples/examples/vite/src/Debug/ComposerStateDialog.tsx:39`, `examples/examples/vite/src/Debug/StreamDebugHandles.tsx:25`, `examples/examples/vite/src/ChatLayout/Panels.tsx:145` (`TS2554`)
- Docs impact:
  - `03-ui-cookbook/04-message/02-reactions.md`, `03-ui-cookbook/04-message/04-message_actions.md`, `03-ui-cookbook/07-emoji_picker.md`, `04-guides/03-translations.md`, `04-guides/11-blocking-users.md`
- Example needed: yes

Before (v14):

```tsx
import { useMessageComposerContext, useTranslationContext } from 'stream-chat-react';

export const CustomEmojiPicker = () => {
  const { t } = useTranslationContext('CustomEmojiPicker');
  const { textareaRef } = useMessageComposerContext('CustomEmojiPicker');
  // ...
};
```

After (v15):

```tsx
import { useMessageComposerContext, useTranslationContext } from 'stream-chat-react';

export const CustomEmojiPicker = () => {
  const { t } = useTranslationContext();
  const { textareaRef } = useMessageComposerContext();
  // ...
};
```

### BC-007: required context hooks throw outside their provider

- Status: confirmed
- Area: contexts
- User impact: runtime error, not a compile error. In v14 these hooks logged a `console.warn` (or nothing) and returned `{}` or `undefined`, so a misplaced component rendered blank or failed later with `Cannot read properties of undefined`. In v15 they throw `<hook> was called outside of <Provider>` at the call site (`useDialogManager` throws its own message naming `DialogManagerProvider`). This most often hits a custom message UI, an attachment component, or a loading/empty state mounted outside `<Chat>`, a message, or the composer.
- Old API (v14 behavior):
  - `useChatContext` (needs `<Chat>`), `useMessageContext` (`MessageProvider`), `useMessageComposerContext` (`MessageComposerContextProvider`), `useMessageListContext`, `useVirtualizedMessageListContext`, `useMessageBounceContext`, `usePollContext`, `useDialogManager` (`DialogManagerProvider`), `useSearchContext`, `useSearchSourceResultsContext`, `useContextMenuContext` (`ContextMenu`), `useChannelListItemContext` (`ChannelListItemUI`), `useGalleryContext` (`Gallery`), `useChatViewContext` (`ChatView`, now in `stream-chat-react/slot-layout`)
- Replacement: render the component inside the provider it reads from, or wrap it in that provider. These hooks still return a default outside a provider: `useTranslationContext` (renders the inline English copy), `useComponentContext` (an empty override map), `useChannelInstanceContext`, `useModalContext`, `useAriaLiveAnnouncer`, `useMessageTranslationViewContext`. Related type changes:
  - `useChannelInstanceContext()` returns `Partial<ChannelInstanceContextValue>`, so `channel` may be `undefined`. Use `useChannel()` when a channel is required; it throws.
  - `MessageComposerContext` was already `| undefined` in v14; only its value type changed from `UseMessageComposerBindingsParams` to `MessageComposerContextValue`. `useIsWithinMessageComposerContext()` is the new predicate.
  - The gallery header renders the item's own timestamp and no longer uses the `ComponentContext.MessageTimestamp` override.
- Evidence:
  - `master:src/context/requireContext.ts:9-22` throws `` `${hookName} was called outside of ${providerName}…` ``
  - call sites: `master:src/context/ChatContext.tsx:62`, `MessageContext.tsx:133`, `MessageComposerContext.tsx:27`, `MessageListContext.tsx:34`, `VirtualizedMessageListContext.tsx:31`, `MessageBounceContext.tsx:27`, `PollContext.tsx:25`, `master:src/components/ChannelListItem/ChannelListItem.tsx:72`, `Gallery/GalleryContext.tsx:61`, `Search/SearchContext.tsx:34`, `Search/SearchSourceResultsContext.tsx:31`, `Dialog/components/ContextMenu.tsx:601`, `master:src/plugins/SlotLayout/ChatView.tsx:187`; `master:src/context/DialogManagerContext.tsx:196` (`useDialogManager` throws)
  - v14: `release-v14:src/context/ChatContext.tsx:75-87` (warn + `{}`), `MessageListContext.tsx:32-40` (warn + `{}`), `MessageContext.tsx:146-156` (`{}`), `DialogManagerContext.tsx:196` (warn only), `components/ChatView/ChatView.tsx:53-63` (warn + `{}`), `components/ChannelListItem/ChannelListItem.tsx:81` (raw `useContext`)
  - commit: `9194215f0 feat(context): drop componentName param from context consumer hooks` (PR #3267), BREAKING CHANGE section
- Docs impact:
  - `02-ui-components/03-chat/02-chat_context.md`, `02-ui-components/08-message/02-message_context.md`, `02-ui-components/09-message-composer/02-message_composer_context.md`
  - any cookbook page whose custom component is shown mounted outside its provider (not enumerable by grep)
- Example needed: no

### BC-008: `useMessageComposerContext` takes no argument and throws outside its provider

- Status: confirmed
- Area: message composer contexts (part of the cross-cutting "context hooks" change; CTX may own the umbrella entry)
- User impact:
  - compile error `TS2554` (`Expected 0 arguments`) on `useMessageComposerContext('Name')`.
  - runtime error: v14 returned `{}` outside a `MessageComposerContextProvider`. v15 throws `useMessageComposerContext was called outside of MessageComposerContextProvider`. A custom component that calls it, or `<EmojiPicker />` from `stream-chat-react/emojis`, mounted outside `MessageComposer` now throws instead of rendering half-working.
  - not a break: `useMessageComposerController()` still needs a `Channel` or `Thread` subtree. v14 also crashed outside a `Channel` (a `TypeError` from `channel.messageComposer` in its `useMemo` deps), even with a supplied composer. v15 throws a clearer error and now also resolves inside a `Thread` that has no `Channel` around it.
- Old API:
  - `useMessageComposerContext(componentName?: string)`
- Replacement: `useMessageComposerContext()`. Render consumers inside `MessageComposer` (or a `MessageComposerContextProvider`). To probe whether a composer context exists, use `useIsWithinMessageComposerContext()` (new root export). Render `useMessageComposerController()` consumers inside a `Channel` or a `Thread`.
- Evidence:
  - `release-v14:src/context/MessageComposerContext.tsx:27-38`: optional `componentName`; returns `{}` without a provider
  - `master:src/context/MessageComposerContext.tsx:26-31`: `requireContext(useContext(MessageComposerContext), 'useMessageComposerContext', 'MessageComposerContextProvider')`; `:37-38` `useIsWithinMessageComposerContext`
  - `master:src/context/requireContext.ts:9-22`: throws
  - `release-v14:src/components/MessageComposer/hooks/useMessageComposerController.ts:14-30`: `useChannelStateContext()` (`{}` outside a provider); `channel.messageComposer` in the `useMemo` deps (`:52`) throws a `TypeError` outside a `Channel` regardless of a supplied composer
  - `master:src/components/MessageComposer/hooks/useMessageComposerController.ts:13-21`: `const channel = useChannel()` runs unconditionally; `master:src/context/useChannel.ts:10-16` throws
  - commit: `9194215f0 feat(context): drop componentName param from context consumer hooks` (PR #3267)
  - corpus: `docs/03-ui-cookbook__07-emoji_picker__3.tsx:15` TS2554
- Docs impact:
  - `03-ui-cookbook/07-emoji_picker.md` (line 76, `useMessageComposerContext("CustomEmojiPicker")`)
- Example needed: no (one-line change; the guide's "Context hooks" section already shows it)

### BC-009: `ChannelUnreadUiState` type is removed

- Status: confirmed
- Area: types
- User impact: compile error on import. The unread UI snapshot it described (formerly `channelUnreadUiState` / `setChannelUnreadUiState` on the removed channel contexts) now lives on the message paginator with a different, camel-cased shape.
- Old API:
  - `ChannelUnreadUiState` (`Omit<ReadResponse, 'user'>`: `last_read`, `last_read_message_id`, `unread_messages`, `first_unread_message_id`)
- Replacement: `UnreadSnapshotState` from `stream-chat` (`{ lastReadAt: TimestampNS | null; unreadCount: number; firstUnreadMessageId: string | null; lastReadMessageId: string | null }`). Read it with `useStateStore(channel.messagePaginator.unreadStateSnapshot, selector)` and write it with `channel.messagePaginator.setUnreadSnapshot(partial)`.
- Evidence:
  - `release-v14:src/types/types.ts:54` `export type ChannelUnreadUiState = Omit<ValuesType<StreamChannelState['read']>, 'user'>`; `release-v14:src/types/index.ts:1`
  - `master:src/types/index.ts:1` and `master:src/types/types.ts:34`: both commented out
  - `stream-chat@10.0.0-rc.22` `dist/types/pagination/paginators/MessagePaginator.d.ts:49-55` `UnreadSnapshotState`, `:87` `unreadStateSnapshot: StateStore<UnreadSnapshotState>`, `:200` `setUnreadSnapshot`
  - `master:src/components/MessageList/MessageList.tsx:136` reads `messagePaginator.unreadStateSnapshot`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/04-channel_state_context.md`, `04-guides/05-channel_read_state.md`
- Example needed: no

## Chat, ChatView and layout

### BC-010: `Window` and `WindowProps` were removed

- Status: confirmed
- Area: layout
- User impact: compile error (`TS2305 Module '"stream-chat-react"' has no exported member 'Window'`) in almost every v14 app; the `str-chat__main-panel` / `str-chat__main-panel--thread-open` wrapper is no longer rendered, so CSS targeting it stops matching.
- Old API:
  - `Window` (props: `thread?: LocalMessage`)
  - `WindowProps`
- Replacement: none - removed. Render `ChannelHeader` / `MessageList` / `MessageComposer` directly inside `<Channel channel={...}>`, and render `<Thread thread={...}>` as a sibling (BC-035). `.str-chat__channel` (the `Channel` root) stays a flex column, as in v14, and now holds the header, list and composer directly. The row is gone: in v14, `.str-chat__container` inside `Channel` was the `display: flex` row that put `Window` and `Thread` side by side (`release-v14:src/components/Channel/styling/Channel.scss:8-10`). v15 renders no row, so a sibling `<Thread>` stacks below the channel unless the app's own container is a flex row. Inside `ChatView`, panels rendered through `<Slot>` are `section.str-chat__chat-view__slot[data-slot]` siblings with `flex: 1 1 0`, so size panels by targeting the slot rather than `.str-chat__thread` / `.str-chat__channel`. Multi-panel layouts come from `ChatView` slots (BC-012). `SlotGeometryProvider` (the diff's rename hint) is not a replacement: it only reports which slots are visually obscured.
- Evidence:
  - `release-v14:src/components/Window/Window.tsx:8` `WindowProps`; `:32` `Window` (reads `thread` from `ChannelStateContext` to add `str-chat__main-panel--thread-open`)
  - `master:src/components/Window/` removed; `master:src/components/Channel/styling/Channel.scss:1-4` documents that the `.str-chat__container` and `.str-chat__main-panel` wrappers are gone and their layout lives on `.str-chat__channel`
  - `master:src/plugins/SlotGeometry/SlotGeometry.tsx:11-29` (detection-only module, not a layout wrapper)
  - commit: `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237)
  - corpus: `docs/02-ui-components__01-getting_started__1.tsx:7` TS2305, and the same error in 30+ other docs/examples files (`03-chat__01-chat__5`, `04-channel__01-channel__4`, `04-channel__05-component_context__2/3`, `07-message-list__*`, `08-message__*`, `09-message-composer__*`, `03-ui-cookbook__*`, `04-guides__05-channel_read_state__3`, `04-guides__13-notifications__12`, `04-guides__16-ai-integrations__*`, `05-experimental-features__01-message-actions__2`, `06-release-guides__01-upgrade-to-v14__12/13/26`, `examples/tutorial/src/*/App.tsx`, `examples/vite/src/ChatLayout/Panels.tsx:22`)
- Docs impact:
  - `02-ui-components/13-window.md` (whole page)
  - every page whose snippet wraps the channel in `<Window>`: `02-ui-components/01-getting_started.md`, `03-chat/01-chat.md`, `03-chat/02-chat_context.md`, `04-channel/01-channel.md`, `04-channel/03-channel_action_context.md`, `04-channel/05-component_context.md`, `05-channel-list/05-channel_search.md`, `07-message-list/01-message_list.md`, `07-message-list/02-virtualized_list.md`, `07-message-list/05-thread.md`, `08-message/*`, `09-message-composer/01-message_composer.md`, `09-message-composer/04-input_ui.md`, `10-channel-detail/02-avatar-with-channel-detail.md`, `15-with_drag_and_drop_upload.md`, `03-ui-cookbook/*` (channel_header, collapsible-sidebar, app_menu, skip-navigation, channel-list, attachment, message-composer), `04-guides/05-channel_read_state.md`, `04-guides/13-notifications.md`, `04-guides/16-ai-integrations/02-chat-sdk-integration.md`, `05-experimental-features/01-message-actions.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
import {
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';

const ChannelPanel = () => (
  <Channel>
    <Window>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Window>
    <Thread />
  </Channel>
);
```

After (v15):

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

const ChannelPanel = ({
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

---

### BC-011: `ChatView` and its selector helpers moved to the `stream-chat-react/slot-layout` entry point

- Status: confirmed
- Area: package entrypoints / layout
- User impact: compile error (`TS2305`) on every import of these symbols from `stream-chat-react`. `stream-chat-react/slot-layout` (and `stream-chat-react/slot-geometry`) are new `exports` entries.
- Old API (imported from `stream-chat-react`):
  - `ChatView`, `ChatViewContext`, `useChatViewContext`, `useActiveThread`
  - `ChatViewSelectorButton`, `ChatViewChannelsSelectorButton`, `ChatViewThreadsSelectorButton`
  - `ChatViewSelectorEntry`, `ChatViewSelectorItem`, `ChatViewSelectorItemProps`, `ChatViewSelectorProps`, `defaultChatViewSelectorItemSet`
- Replacement: import the same names from `stream-chat-react/slot-layout`. The selector pieces keep their props; `ChatView` itself and `ChatViewContext` changed shape (BC-012). `useActiveThread({ activeThread })` keeps its signature but now holds the release function returned by `thread.activate()` instead of calling `activate()` / `deactivate()`.
- Evidence:
  - `release-v14:src/components/ChatView/index.tsx:1` re-exported from the main entry
  - `master:src/plugins/SlotLayout/index.tsx:1` and `master:src/plugins/SlotLayout/ChatView.tsx:186` (`useChatViewContext`), `:485` (`useActiveThread`), `:517`, `:571`, `:597`, `:639-651`, `:684`
  - `master:package.json:43-53` adds `./slot-geometry` and `./slot-layout` to `exports`
  - diff.md "Moved between entrypoints (12)"
  - commit: `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237)
  - corpus: `docs/02-ui-components__06-thread-list__01-thread-list__2.tsx:3`, `docs/02-ui-components__11-chat-view__1.tsx:7`, `docs/02-ui-components__11-chat-view__3.tsx:4`, `docs/06-release-guides__01-upgrade-to-v14__28.tsx:3` TS2305 (`ChatView`); `docs/03-ui-cookbook__13-accessibility__03-skip-navigation__2.tsx:3` TS2724 (`useChatViewContext`); `examples/vite/src/AppSettings/AppSettings.tsx:4` (`ChatViewSelectorButton`); `examples/vite/src/Sidebar/ChatViewSelectorItemSet.tsx:2-3` (`ChatViewSelectorEntry`, `defaultChatViewSelectorItemSet`); `examples/vite/src/ChatLayout/Panels.tsx:10-11`, `examples/vite/src/ChatLayout/Sync.tsx:4,6`, `examples/vite/src/App.tsx:25`
- Docs impact:
  - `02-ui-components/11-chat-view.md`, `02-ui-components/06-thread-list/01-thread-list.md`, `02-ui-components/12-indicators.md`, `02-ui-components/02-theming/03-component-variables.md`, `03-ui-cookbook/13-accessibility/03-skip-navigation.md`, `03-ui-cookbook/07-notifications/01-system-notifications.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: no (import path only; see BC-012 for usage)

---

### BC-012: `ChatView` was rebuilt around layout slots: `ChatView.Channels` / `ChatView.Threads` / `ChatView.ThreadAdapter`, `useThreadsViewContext` and `ThreadsViewContextValue` were removed, and `ChatViewContext` renamed its fields

- Status: confirmed
- Area: layout / navigation
- User impact:
  - `ChatView.Channels`, `ChatView.Threads`, `ChatView.ThreadAdapter` are `undefined` at runtime (JSX on them throws "Element type is invalid"); TS reports a missing property.
  - `useThreadsViewContext` / `ThreadsViewContextValue` imports fail (TS2724).
  - `useChatViewContext()` returns `{ activeView, setActiveView, layoutController, entityInferers, registerViewActionSlotResolvers, resolveActionTargetSlot }`; reading `activeChatView` / `setActiveChatView` is a compile error, and `undefined` in JS.
  - `useChatViewContext()` now throws outside `ChatView` (v14 warned and returned `{}`).
- Old API:
  - `ChatView.Channels`, `ChatView.Threads`, `ChatView.ThreadAdapter`
  - `useThreadsViewContext()` -> `{ activeThread, setActiveThread }`, `ThreadsViewContextValue`
  - `ChatViewContext` / `useChatViewContext()` -> `{ activeChatView, setActiveChatView }`
- Replacement (all from `stream-chat-react/slot-layout` unless noted):
  - The view trees: `<ChatView layouts={...} views={{ channels: <...>, threads: <...> }} slotRenderers={...}>`. `views` "replaces the removed `ChatView.Channels`/`ChatView.Threads` gated components" (`ChatView.tsx:135-141`). Children of `ChatView` still render (before the active view). `ChatView.Selector` is unchanged.
  - Rendering what is open in a slot: `<Slot slot='...' />` with `slotRenderers`, or `<ChannelSlot slot='...'>` / `<ThreadSlot slot='...'>` with children (they wrap `<Channel>` / `<Thread>`).
  - `ChatView.ThreadAdapter` -> `<ThreadSlot slot='...'>` (+ `useActiveThread({ activeThread })` if you render the thread yourself).
  - `useThreadsViewContext().activeThread` -> `useSlotThread({ slot })` (or `useWorkspaceNavigation().openThreads`, main entry); `setActiveThread(thread)` -> `useWorkspaceNavigation().openThread(thread)` (main entry).
  - `activeChatView` / `setActiveChatView` -> `activeView` / `setActiveView`.
- Evidence:
  - `release-v14:src/components/ChatView/ChatView.tsx:44-45` (`activeChatView`, `setActiveChatView`), `:103-113` (`ThreadsViewContextValue`, `useThreadsViewContext`), `:373-376` (`ChatView.Channels/Threads/ThreadAdapter/Selector`)
  - `master:src/plugins/SlotLayout/ChatView.tsx:103-144` (`ChatViewProps`), `:165-178` (`ChatViewContextValue`), `:181-187` (no default; `requireContext`), `:684` (only `ChatView.Selector` is attached)
  - `master:src/plugins/SlotLayout/hooks/useSlotEntity.ts:187`, `:216` (`useSlotChannel`, `useSlotThread`); `master:src/plugins/SlotLayout/ThreadSlot.tsx:19`; `master:src/plugins/SlotLayout/ChannelSlot.tsx:32`
  - `examples.diff` `examples/vite/src/ChatLayout/Panels.tsx`: `useThreadsViewContext().activeThread` -> `useSlotThread({ slot: MAIN_THREAD_SLOT })`, `<ChatView.ThreadAdapter><Thread .../>` -> `<ThreadSlot slot={MAIN_THREAD_SLOT}>`
  - commits: `99cbe6704` (PR #3237); `66557d63b feat!: port the tutorial alignment (#3251) to v15, with panel-aware workspace navigation` (PR #3301)
  - corpus: `docs/02-ui-components__11-chat-view__3.tsx:8` TS2724 (`useThreadsViewContext`); `examples/vite/src/ChatLayout/Sync.tsx:8`, `examples/vite/src/ChatLayout/Panels.tsx:20` TS2724
- Docs impact:
  - `02-ui-components/11-chat-view.md`, `02-ui-components/06-thread-list/01-thread-list.md`, `02-ui-components/12-indicators.md` (ThreadAdapter), `03-ui-cookbook/13-accessibility/03-skip-navigation.md` (`activeChatView`), `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
import {
  Channel,
  ChannelList,
  Chat,
  ChatView,
  Thread,
  ThreadList,
} from 'stream-chat-react';

const App = () => (
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
);
```

After (v15) - channels view, as in `examples/tutorial/src/4-channel-list/App.tsx`; the channel list's paginator must be registered first (BC-028):

```tsx
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

const App = () => (
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

A threads view is declared the same way (a `{ id: 'threads', slots: [...] }` layout and a `threads` entry in `views` rendering `<ThreadList />` plus a `ThreadSlot`); `examples/vite/src/ChatLayout/Panels.tsx` (`ThreadsPanels`) is the reference.

---

### BC-013: `ChatContext.setActiveChannel` / `ChatContext.channel` were removed; selecting a channel or thread now goes through workspace navigation, which does nothing outside `ChatView`

- Status: confirmed
- Area: navigation
- User impact:
  - compile error reading `setActiveChannel` / `channel` from `useChatContext()` (and from the return of `useChat()`); `undefined` in JS.
  - silent behavior change: without `ChatView` (or your own `WorkspaceNavigationProvider`), clicking a `ChannelList` row, a channel/message/user search result, a `ThreadList` row, a message's reply-count button, "also sent in channel", or the channel-detail "send direct message" / pinned-message entry does nothing, and no list row renders as active (`ChannelListItem` derives `active` from `isChannelActive(cid)`, `ChannelListHeader` only shows `HeaderEndContent` while `openChannels` is non-empty).
  - with no navigation provided at all, each operation (`openChannel`, `openThread`, `closeChannel`, `closeThread`, `goBack`) logs a one-time console warning that nothing happened; `defaultWorkspaceNavigation` itself stays silent, so a provider built by spreading it does not warn.
  - `ChannelListItem` / `ChannelListItemUI` no longer accept `setActiveChannel` / `watchers` (BC-033).
- Old API:
  - `ChatContextValue.setActiveChannel(newChannel?, watchers?, event?)`
  - `ChatContextValue.channel` (the active channel)
  - `useChat()` return fields `channel`, `setActiveChannel`
- Replacement:
  - Inside `ChatView` (`stream-chat-react/slot-layout`): nothing to wire; the SDK's selection components call `useWorkspaceNavigation().openChannel(channel, { event })` / `openThread(target)`, which bind the entity into a layout slot. Customize with `ChatView`'s `deriveWorkspaceNavigation` prop.
  - Without `ChatView`: hold the open channel in your own state and provide `WorkspaceNavigationProvider` (main entry) with an object built from `defaultWorkspaceNavigation`, overriding at least `openChannel`, `isChannelActive` and `openChannels` (and `openThread` / `openThreads` / `isThreadActive` if you render threads). Alternatively pass `onSelect` to `ChannelListItem` / search result items.
  - Reading "the active channel": inside the channel subtree use `useChannel()`; elsewhere `useWorkspaceNavigation().openChannels` (main entry) or `useSlotChannel({ slot })` (`slot-layout`).
  - Opening a channel programmatically: `useWorkspaceNavigation().openChannel(channel)`; to also list it without a re-query, `client.channelManager.ingestChannel(channel)` (stream-chat).
  - The `watchers` argument: query the channel yourself (`channel.ensureWatched({ watchers: { limit } })` or `channel.query(...)`, stream-chat) before opening it.
- Evidence:
  - `release-v14:src/context/ChatContext.tsx:45-49` (`setActiveChannel`), `:54` (`channel?: Channel`); `release-v14:src/components/Chat/hooks/useChat.ts:116-131,137-144`
  - `master:src/context/ChatContext.tsx:27-46` (no `channel` / `setActiveChannel`); `master:src/components/Chat/hooks/useChat.ts:68-71`
  - `master:src/context/WorkspaceNavigationContext.tsx:84-139` (`WorkspaceNavigation`), `:145-159` (`defaultWorkspaceNavigation`, every operation a no-op), `:165-179` (`WorkspaceNavigationProvider`, `useWorkspaceNavigation`)
  - consumers: `master:src/components/ChannelListItem/ChannelListItem.tsx:88`, `master:src/components/ChannelListItem/ChannelListItemUI.tsx:95-102`, `master:src/components/ChannelList/ChannelListHeader.tsx`, `master:src/components/Search/SearchResults/SearchResultItem.tsx:77,129,208`, `master:src/components/Message/hooks/useOpenThreadHandler.ts:17-32`, `master:src/components/Threads/ThreadList/ThreadListItemUI.tsx`, `master:src/plugins/ChannelDetail/Views/ChannelMemberDetailView/ChannelMemberActions.defaults.tsx:222,246`, `master:src/plugins/ChannelDetail/Views/PinnedMessagesView/PinnedMessagesView.tsx:143,158` (both call `useWorkspaceNavigation().openChannel`; before `fix/v15-dead-surface-cleanup` they called `useChatViewNavigation().open` and so worked only inside `ChatView`)
  - `master:src/context/WorkspaceNavigationContext.tsx:170-195` (the context default warns once per operation; `defaultWorkspaceNavigation` at `:145` does not)
  - commit: `99cbe6704` (PR #3237); `66557d63b` (PR #3301)
  - corpus: `examples/tutorial/src/6-custom-ui-components/App.tsx:44` TS2339 (`setActiveChannel` on `ChannelListItemUIProps`); `examples/vite/src/ChatLayout/Panels.tsx:145`, `examples/vite/src/Debug/ComposerStateDialog.tsx:39`, `examples/vite/src/Debug/StreamDebugHandles.tsx:25` (destructure `channel` from `useChatContext`)
- Docs impact:
  - `02-ui-components/03-chat/01-chat.md`, `02-ui-components/03-chat/02-chat_context.md`, `02-ui-components/05-channel-list/01-channel_list.md`, `02-ui-components/05-channel-list/02-channel_list_context.md`, `02-ui-components/05-channel-list/04-channel_preview_ui.md`, `04-guides/07-sdk-state-management.md`, `03-ui-cookbook/13-accessibility/02-custom-announcements.md`, `03-ui-cookbook/02-channel-list/01-channel_list_preview.md`
- Example needed: yes

Before (v14):

```tsx
import {
  Channel,
  ChannelList,
  Chat,
  MessageComposer,
  MessageList,
  Window,
} from 'stream-chat-react';

const App = () => (
  <Chat client={client}>
    <ChannelList filters={filters} sort={sort} />
    <Channel>
      <Window>
        <MessageList />
        <MessageComposer />
      </Window>
    </Channel>
  </Chat>
);
```

After (v15, without `ChatView`):

```tsx
import { useEffect, useMemo, useState } from 'react';
import {
  type Channel as StreamChannel,
  type ChannelFilters,
  ChannelPaginator,
  type SortParamRequest,
  type StreamChat,
} from 'stream-chat';
import {
  Channel,
  ChannelList,
  ChannelPlaceholder,
  Chat,
  defaultWorkspaceNavigation,
  MessageComposer,
  MessageList,
  type WorkspaceNavigation,
  WorkspaceNavigationProvider,
} from 'stream-chat-react';

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

const App = ({ client, userId }: { client: StreamChat; userId: string }) => {
  const [activeChannel, setActiveChannel] = useState<StreamChannel>();

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

  const navigation = useMemo<WorkspaceNavigation>(
    () => ({
      ...defaultWorkspaceNavigation,
      isChannelActive: (cid) => !!cid && cid === activeChannel?.cid,
      openChannel: (channel) => setActiveChannel(channel),
      openChannels: activeChannel ? [activeChannel] : [],
    }),
    [activeChannel],
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
      </WorkspaceNavigationProvider>
    </Chat>
  );
};
```

To open threads without `ChatView`, also override `openThread` (a target is a `Thread` or `{ channel, message }`; turn the latter into a registered `Thread` with `client.threads.ensure({ channel, parentMessage: message })`), `openThreads` and `isThreadActive`, and render `<Thread thread={...}>` (BC-035).

---

### BC-014: `ChatContext.channelsQueryState` was removed

- Status: confirmed
- Area: chat context / channel list
- User impact: compile error reading `channelsQueryState` from `useChatContext()`; `undefined` in JS. `Channel` no longer renders a loading or error state for the channel-list query.
- Old API:
  - `ChatContextValue.channelsQueryState` (`{ queryInProgress, error, setQueryInProgress, setError }`)
- Replacement: the query state of a channel list is the `ChannelPaginator`'s own state: `useChannelPaginatorState(paginator)` returns `{ channels, hasNext, hasPrev, isLoading, lastQueryError }` (main entry). `ChannelList` reports `lastQueryError` through `client.notifications.addError(...)` itself.
- Evidence:
  - `release-v14:src/context/ChatContext.tsx:30-33`; `release-v14:src/components/Channel/Channel.tsx:181-207` (`Channel` rendered `LoadingIndicator` / `LoadingErrorIndicator` from it)
  - `master:src/context/ChatContext.tsx:27-46`; `master:src/components/ChannelList/hooks/useChannelPaginatorState.ts:5-29`; `master:src/components/ChannelList/ChannelList.tsx:77-83`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/03-chat/02-chat_context.md`
- Example needed: no

---

### BC-015: `ChatContext.latestMessageDatesByChannels` was removed

- Status: confirmed
- Area: chat context
- User impact: compile error reading the field from `useChatContext()` or from `useChat()`'s return; `undefined` in JS.
- Old API:
  - `ChatContextValue.latestMessageDatesByChannels: Record<string, Date>` (written by `Channel` from the current user's own `message.new` events; nothing in the SDK read it)
  - `useChat()` return field `latestMessageDatesByChannels`
- Replacement:
  - slow-mode cooldown: `useCooldownRemaining()` (main entry) or `useStateStore(channel.cooldownTimer.state, selector)`
  - the channel's latest message: `channel.messagePaginator.aggregateState` (`lastMessage`), via `useStateStore`
  - when the current user last posted: none - track it from `message.new` yourself
- Evidence:
  - `release-v14:src/context/ChatContext.tsx:35`; `release-v14:src/components/Chat/hooks/useChat.ts:40,133-135,140`
  - `master:src/context/ChatContext.tsx:27-46`; `master:src/components/MessageComposer/hooks/useCooldownRemaining.tsx:16` (exported via `hooks/index.ts:4`)
  - commit: `088c795c1 feat(Channel)!: depend on the Channel instance, not its cid, and narrow its responsibilities` (PR #3286)
- Docs impact:
  - `02-ui-components/03-chat/02-chat_context.md`
- Example needed: no

---

### BC-016: `useChatContext` lost its `componentName` argument, throws outside `<Chat>`, and `ChatContextValue` gained a required `channelManager`

- Status: confirmed
- Area: chat context
- User impact:
  - `useChatContext('MyComponent')` is a compile error (`TS2554 Expected 0 arguments, but got 1`); harmless in JS.
  - runtime error instead of a `console.warn` + `{}` when called outside `<Chat>`.
  - code that builds a `ChatContextValue` by hand (custom `ChatProvider` value, test mocks) fails to compile without `channelManager`.
- Old API:
  - `useChatContext(componentName?: string)`
  - `ChatContextValue` without `channelManager`
- Replacement: `useChatContext()`; render callers inside `<Chat>`; set `channelManager: client.channelManager` in hand-built values (what `Chat` passes, `master:src/components/Chat/Chat.tsx:157`).
- Evidence:
  - `release-v14:src/context/ChatContext.tsx:75-87` (warn + `{}`)
  - `master:src/context/ChatContext.tsx:34` (`channelManager: ChannelManager`), `:61-62` (`requireContext(..., 'useChatContext', 'Chat')`)
  - commit: `9194215f0 feat(context): drop componentName param from context consumer hooks` (PR #3267); `be2c8e1e7 feat: rename ChannelPaginatorsOrchestrator to ChannelManager` (PR #3258)
  - corpus: `docs/04-guides__11-blocking-users__4.tsx:15` TS2554; `examples/vite/src/ChatLayout/Panels.tsx:145`, `examples/vite/src/Debug/ComposerStateDialog.tsx:39`, `examples/vite/src/Debug/StreamDebugHandles.tsx:25` TS2554
- Docs impact:
  - `04-guides/11-blocking-users.md` and any snippet calling `useChatContext('...')`
- Example needed: no
- Note: same change as the guide's "Context hooks: no `componentName` argument" section; dedupe with the contexts area if it lists `useChatContext`.

---

### BC-017: `useChat` lost its i18n params and return fields; `Chat.defaultLanguage` was removed

- Status: confirmed
- Area: chat
- User impact: compile errors passing `defaultLanguage` / `i18nInstance` to `useChat`, reading `channel`, `setActiveChannel`, `latestMessageDatesByChannels` or `translators` from its result, or passing `defaultLanguage` to `<Chat>`.
- Old API:
  - `UseChatParams.defaultLanguage`, `UseChatParams.i18nInstance`
  - `useChat()` return: `channel`, `setActiveChannel`, `latestMessageDatesByChannels`, `translators`
  - `ChatProps.defaultLanguage`
- Replacement:
  - `useChat({ client })` returns `{ getAppSettings, mutes }` only.
  - translators: `useStreami18n({ client, i18nInstance })` (main entry) - what `Chat` itself calls.
  - `defaultLanguage`: set the language on the `Streami18n` instance passed as `i18nInstance` (i18n area; see `ai-docs/i18n-v15-migration.md`).
  - the other fields: BC-013, BC-015.
- Evidence:
  - `release-v14:src/components/Chat/hooks/useChat.ts:21-25,137-144`; `release-v14:src/components/Chat/Chat.tsx:95`
  - `master:src/components/Chat/hooks/useChat.ts:10-12,68-71`; `master:src/components/Chat/Chat.tsx:89-110,129-130`
  - commit: `f68cad332 refactor(i18n)!: adopt the shared i18n layer from stream-chat/i18n` (PR #3271); `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/03-chat/01-chat.md` (`defaultLanguage`), `04-guides/03-translations.md`
- Example needed: no
- Note: `Chat.defaultLanguage` likely also appears in the i18n area's draft; keep one entry.

---

### BC-018: `useCreateChatClient`'s `options` was renamed to `config` and takes the stream-chat configuration tree

- Status: confirmed
- Area: chat
- User impact: compile error (`TS2353 ... 'options' does not exist`); in JS the old `options` is silently ignored, so settings such as `baseURL` or `axiosRequestConfig` stop applying.
- Old API:
  - `useCreateChatClient({ apiKey, tokenOrProvider, userData, options?: StreamChatOptions })`
- Replacement: `useCreateChatClient({ apiKey, tokenOrProvider, userData, config?: DeepPartial<InstanceConfigTree> })`; only the keys `ClientDeclarativeConfig` accepts go under `client` (`allowServerSideConnect`, `axiosRequestConfig`, `baseURL`, `browser`, `persistUserOnConnectionFailure`, `notificationManager`, plus the config sub-trees `connectionRecovery`, `messageDelivery`, `networkConnection`, `notifications`, `reminders`, `threads`, `wsConnection`). v14's `StreamChatOptions` was `AxiosRequestConfig & {...}`, so top-level axios fields such as `timeout` now go under `client.axiosRequestConfig`. Four v14 options moved into config sub-trees: `enableWSFallback` -> `client.wsConnection.enableWSFallback`, `wsUrlParams` -> `client.wsConnection.urlParams`, `recoverStateOnReconnect` -> `client.connectionRecovery.enabled`, and `isLocalUnreadCountEnabled` -> `channel.readEvents.localUnreadCountEnabled` (the top-level `channel` key of the config tree, not `client`). `device`, `disableCache`, `enableInsights`, `logger` and `warmUp` have no config key; the `stream-chat` v10 guide (`ai-docs/v10-breaking-changes.md` in stream-chat-js) is the reference for the full v9 -> v10 option table; `notifications` (a `NotificationManager` instance) became `client.notificationManager`; `wsConnection` changed from a connection instance to a config object. `userData` is typed `ClientUser`. `config` is read once, on first render.
- Evidence:
  - `release-v14:src/components/Chat/hooks/useCreateChatClient.ts:15-25,36`
  - `master:src/components/Chat/hooks/useCreateChatClient.ts:19-29,40` (`new StreamChat(apiKey, cachedConfig)`)
  - `stream-chat@10.0.0-rc.22` `dist/types/configuration/types.d.ts` (`InstanceConfigTree` has top-level `channel` and `client` keys; `ClientDeclarativeConfig` sub-trees), `connection/wsConnection/types.d.ts` (`WSConnectionConfig.enableWSFallback`, `.urlParams`), `connection/ConnectionRecoveryManager.d.ts` (`ConnectionRecoveryManagerConfig.enabled`), `channel.d.ts` (`readEvents.localUnreadCountEnabled`)
  - found by a real migration (website-react-examples `team-ts`): an earlier version of this entry said these four options had no config key, which would have silently dropped the WebSocket long-poll fallback
  - commit: `557ffcb3c feat!: pass the stream-chat configuration tree through useCreateChatClient` (PR #3321)
  - corpus: `docs/02-ui-components__01-getting_started__2.tsx:15` TS2353
- Docs impact:
  - `02-ui-components/01-getting_started.md`
- Example needed: yes

Before (v14):

```tsx
import { useCreateChatClient } from 'stream-chat-react';

const client = useCreateChatClient({
  apiKey,
  options: { baseURL: 'https://chat-proxy.example.com' },
  tokenOrProvider,
  userData: { id: userId },
});
```

After (v15):

```tsx
import { useCreateChatClient } from 'stream-chat-react';

const client = useCreateChatClient({
  apiKey,
  config: { client: { baseURL: 'https://chat-proxy.example.com' } },
  tokenOrProvider,
  userData: { id: userId },
});
```

`baseURL` is shown because PR #3321 names it as an example of a `client` key; confirm other keys against `ClientDeclarativeConfig` in the installed `stream-chat`.

---

## Channel

### BC-019: `ChannelProps.channel` is required and `EmptyPlaceholder` was removed; `Channel` renders no loading, error or empty state

- Status: confirmed
- Area: channel
- User impact:
  - compile error rendering `<Channel>` without `channel` or with `EmptyPlaceholder` (`TS2741` / `TS2322`). In JS, a missing channel crashes (`channel.activate` of `undefined`).
  - silent: `Channel` no longer picks the channel up from `ChatContext`, no longer renders `ComponentContext.EmptyStateIndicator` (`listType='message'`) when nothing is selected, and no longer renders `LoadingIndicator` / `LoadingErrorIndicator`.
  - compile error on a `LoadingErrorIndicator` key in `WithComponents` overrides, or reading it from `useComponentContext()`: the `ComponentContextValue.LoadingErrorIndicator` slot is removed, since no SDK component rendered it in v15. The `LoadingErrorIndicator` component is still exported.
- Old API:
  - `ChannelProps.channel?: Channel`
  - `ChannelProps.EmptyPlaceholder?: ReactElement | null`
  - `ComponentContextValue.LoadingErrorIndicator?: ComponentType<LoadingErrorIndicatorProps>`
- Replacement: guard at the call site and render `ChannelPlaceholder` (new export; the same `.str-chat__channel` column, `children` allowed) while nothing is selected. Render your own loading/error UI around `Channel`, using the exported `LoadingErrorIndicator` component if you like.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:100,131,173-214` (context fallback, `EmptyPlaceholder`, `EmptyStateIndicator`, loading/error branches), `:1239-1252`
  - `master:src/components/Channel/Channel.tsx:17-23` (`channel: StreamChannel` only prop), `:29-44` (`ChannelPlaceholder`), `:48-103` (no loading/empty branches)
  - `master:src/context/ComponentContext.tsx` declares no `LoadingErrorIndicator` slot (removed in `fix/v15-dead-surface-cleanup`; before that it was declared at `:181` with no consumer outside `src/components/Loading`)
  - commit: `088c795c1 feat(Channel)!: ...` (PR #3286)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/05-component_context.md`, `02-ui-components/06-thread-list/01-thread-list.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
<Channel EmptyPlaceholder={<NoChannelSelected />}>
  <MessageList />
  <MessageComposer />
</Channel>
```

After (v15):

```tsx
import {
  Channel,
  ChannelPlaceholder,
  MessageComposer,
  MessageList,
} from 'stream-chat-react';

{
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
}
```

---

### BC-020: `Channel` no longer watches the channel: `initializeOnMount` and `channelQueryOptions` were removed, and so was `getChannel`

- Status: confirmed
- Area: channel
- User impact:
  - compile errors on the props and on `import { getChannel }`.
  - silent: an uninitialized channel passed to `Channel` renders as an empty channel with no error and receives no events.
- Old API:
  - `ChannelProps.initializeOnMount?: boolean` (default `true`: `Channel` called `channel.watch()`)
  - `ChannelProps.channelQueryOptions?: ChannelQueryOptions`
  - `getChannel({ client, channel?, id?, members?, options?, type? })`
- Replacement: initialize the channel before handing it to `Channel`. App code that already calls `await channel.watch(options)` before rendering needs no change (`client.channel()` and `channel.watch()` keep their roles; `client.channel()` is shorthand for `client.channelManager.ensure({ type, id, data })`). Code that relied on `Channel` to watch adds the call: `channel.watch(options)`, or `await channel.ensureWatched(options)` (stream-chat; sends nothing for an already-watched channel and joins an in-flight watch with the same options). Channels delivered by `ChannelList` arrive watched. v10 also changed the input shape (`members` as `{ user_id }` objects, custom fields under `custom`); that part is a type change only.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:107,141`; `release-v14:src/utils/getChannel.ts:34`
  - `master:src/components/Channel/Channel.tsx:17-23` (prop doc: "Initialize it before passing it in; `Channel` does not query"); `master:src/utils/getChannel.ts` removed
  - `node_modules/stream-chat/dist/types/channel.d.ts:747` (`ensureWatched(options?: ChannelGetOrCreateRequest): Promise<Channel>`); `node_modules/stream-chat/dist/types/ChannelManager.d.ts:157` (`ensure`)
  - commits: `088c795c1` (PR #3286); `a41eed56f feat!: replace StreamChat.activeChannels with entity item index for loaded channels` (PR #3310, removes `getChannel`)
  - corpus: `docs/02-ui-components__05-channel-list__02-channel_list_context__2.tsx:11` TS2724 (`getChannel`)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`, `02-ui-components/05-channel-list/08-advanced-search.md`, `02-ui-components/05-channel-list/02-channel_list_context.md`, `02-ui-components/05-channel-list/04-channel_preview_ui.md`, `02-ui-components/08-message/08-avatar.md`, `03-ui-cookbook/02-channel-list/01-channel_list_preview.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
const channel = client.channel('messaging', { members: [userId, otherUserId] });

<Channel channel={channel} channelQueryOptions={{ messages: { limit: 30 } }}>
  {/* ... */}
</Channel>;
```

After (v15):

```tsx
const channel = await client.channelManager
  .ensure({
    data: { members: [{ user_id: userId }, { user_id: otherUserId }] },
    type: 'messaging',
  })
  .ensureWatched({ messages: { limit: 30 } });

<Channel channel={channel}>{/* ... */}</Channel>;
```

`ensureWatched` takes stream-chat's `ChannelGetOrCreateRequest` (`messages`, `members`, `watchers`, `presence`, `state`, `watch`, `data`, ...), and `data.members` is `ChannelMemberRequest[]` (`{ user_id }` objects) in stream-chat v10 (LLC change; the React SDK builds DMs the same way, `SearchResultItem.tsx:222`).

---

Before (v14):

```ts
import { getChannel } from 'stream-chat-react';

const channel = await getChannel({ client, id: 'general', type: 'messaging' });
```

After (v15):

```ts
const channel = await client.channelManager
  .ensure({ id: 'general', type: 'messaging' })
  .ensureWatched();
```

### BC-021: `Channel` no longer writes `document.title`; `activeUnreadHandler` was removed

- Status: confirmed
- Area: channel
- User impact: compile error on the prop; silent loss of the `(N) Title` tab-title behavior.
- Old API:
  - `ChannelProps.activeUnreadHandler?: (unread: number, documentTitle: string) => void`
  - implicit `document.title` updates on `message.new` while the tab was hidden
- Replacement: none in the SDK. Write the title in application code; `examples/vite/src/DocumentTitleManager` is a reference implementation.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:96,340-346,395-407,498`
  - `master:src/components/Channel/Channel.tsx` (no `document.title`)
  - commit: `088c795c1` (PR #3286)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`
- Example needed: no

---

### BC-022: `markReadOnMount` was removed; `Channel` no longer marks the channel read when it mounts

- Status: confirmed
- Area: channel / read state
- User impact: compile error on the prop. Behavior: the mark-read moved from `Channel` mount to the message list (`useMarkRead` in `MessageList` / `VirtualizedMessageList`), which marks read when the list is at the bottom, viewing the live head, the tab is visible and the channel is not flagged unread. A `Channel` rendered without a message list is never marked read; `markReadOnMount={false}` has no direct equivalent.
- Old API:
  - `ChannelProps.markReadOnMount?: boolean` (default `true`)
- Replacement: none as a prop. To change how read requests go out, register `channel.requestHandlers.markReadRequest` through `client.config.set(...)` (BC-023); `markReadRequest` receives `{ channel, options }` and returns the response or `null`.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:143,235,523`
  - `master:src/components/MessageList/hooks/useMarkRead.ts:37-160`
  - `node_modules/stream-chat/dist/types/channel.d.ts:24-27,38` (`CustomMarkReadRequestFn`)
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`, `04-guides/05-channel_read_state.md`
- Example needed: no
- Note: "suppress mark-read via a `markReadRequest` handler returning `null`" is inferred from the handler type, not tested; mark `likely` if that sentence is kept.

---

### BC-023: `doSendMessageRequest`, `doUpdateMessageRequest`, `doDeleteMessageRequest`, `doMarkReadRequest` and `useChannelEditMessageHandler` were removed

- Status: confirmed
- Area: channel / request customization
- User impact: compile errors on the props and the hook import; in JS the props are ignored and the default requests are sent.
- Old API:
  - `ChannelProps.doSendMessageRequest(channel, message, options?)`
  - `ChannelProps.doUpdateMessageRequest(cid, updatedMessage, options?)`
  - `ChannelProps.doDeleteMessageRequest(message, options?)`
  - `ChannelProps.doMarkReadRequest(channel, setChannelUnreadUiState?)`
  - `useChannelEditMessageHandler(doUpdateMessageRequest?)`
- Replacement: register handlers once on the client: `client.config.set({ channel: { requestHandlers: { sendMessageRequest, updateMessageRequest, deleteMessageRequest, retrySendMessageRequest, markReadRequest } } })` (thread replies use the same channel handlers: `thread.messageOperations` reads the parent channel's `configState.requestHandlers`. `thread.requestHandlers`, set with `client.config.set({ thread: { requestHandlers } })`, holds only `markReadRequest`, for thread mark-read). Message handlers have the LLC signature `(params: { localMessage, message?, options? }, defaultRequest) => Promise<{ message }>`; call `defaultRequest(params)` to fall through. Registration is client-wide, not per `<Channel>`.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:109-129`; `release-v14:src/components/Channel/index.ts:2` (`useChannelEditMessageHandler`); `release-v14:src/components/Channel/hooks/useEditMessageHandler.ts:16`
  - `master:src/components/Channel/Channel.tsx:17-23`; `master:src/components/Channel/index.ts:1-2`
  - `node_modules/stream-chat/dist/types/channel.d.ts:36-42` (`requestHandlers`), `messageOperations/types.d.ts:26-41` (`OperationParams`, `OperationRequestFn`), `configuration/types.d.ts:97,197-198` (`InstanceConfigTree.channel`)
  - commit: `f66597a13 feat: use configuration service API as a single source of truth` (PR #3273); `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`
- Example needed: yes

Before (v14):

```tsx
<Channel
  channel={channel}
  doSendMessageRequest={(channel, message, options) =>
    channel.sendMessage(message, options)
  }
>
  {/* ... */}
</Channel>
```

After (v15):

```tsx
client.config.set({
  channel: {
    requestHandlers: {
      sendMessageRequest: async (params, defaultRequest) => {
        // inspect or rewrite params.message here
        return defaultRequest(params);
      },
    },
  },
});

<Channel channel={channel}>{/* ... */}</Channel>;
```

---

### BC-024: `giphyVersion`, `imageAttachmentSizeHandler`, `videoAttachmentSizeHandler` and `shouldGenerateVideoThumbnail` moved from `Channel` to `Attachment`

- Status: confirmed
- Area: channel / attachments
- User impact: compile error on the `Channel` props; in JS they are ignored and the defaults (`'fixed_height'`, the built-in size handlers, thumbnails on) apply.
- Old API:
  - `ChannelProps.giphyVersion`, `ChannelProps.imageAttachmentSizeHandler`, `ChannelProps.videoAttachmentSizeHandler`, `ChannelProps.shouldGenerateVideoThumbnail`
- Replacement: the same-named optional props on `Attachment` (`AttachmentProps`), which provides them to its children through `AttachmentContextProvider`. Apply them app-wide with an `Attachment` override in `WithComponents`.
- Caveat: `Attachment` builds its own `AttachmentContextProvider` from its props plus `defaultAttachmentContextValue`, so an outer `AttachmentContextProvider` does **not** reach the default attachments. Set these through the `Attachment` slot.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:133-135,149,153`
  - `master:src/components/Attachment/Attachment.tsx:98-111` (props), `:118-160` (builds the context value and wraps children in `AttachmentContextProvider`); `master:src/context/AttachmentContext.tsx:19-37`; `master:src/context/ComponentContext.tsx:106` (`Attachment` slot)
  - commit: `99cbe6704` (PR #3237); `f66597a13` (PR #3273)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/04-channel_state_context.md`, `02-ui-components/08-message/11-attachment/01-attachment.md`, `07-troubleshooting/01-troubleshooting.md` (`giphyVersion`)
- Example needed: yes

Before (v14):

```tsx
<Channel channel={channel} giphyVersion='original' shouldGenerateVideoThumbnail={false}>
  {/* ... */}
</Channel>
```

After (v15):

```tsx
import {
  Attachment,
  type AttachmentProps,
  Channel,
  WithComponents,
} from 'stream-chat-react';

const CustomAttachment = (props: AttachmentProps) => (
  <Attachment {...props} giphyVersion='original' shouldGenerateVideoThumbnail={false} />
);

<WithComponents overrides={{ Attachment: CustomAttachment }}>
  <Channel channel={channel}>{/* ... */}</Channel>
</WithComponents>;
```

Note: a bare `AttachmentContextProvider` above the list does not reach message attachments, because `Attachment` provides its own value built from its props and the defaults.

---

### BC-025: `Channel.onMentionsClick` / `onMentionsHover` and `useChannelMentionsHandler` were removed

- Status: confirmed
- Area: channel / mentions
- User impact: compile error on the props and the hook import; in JS, mention click/hover handlers set on `Channel` stop firing.
- Old API:
  - `ChannelProps.onMentionsClick?: OnMentionAction`, `ChannelProps.onMentionsHover?: OnMentionAction`
  - `useChannelMentionsHandler(onMentionsHover?, onMentionsClick?)`
- Replacement: `onMentionsClick` / `onMentionsHover` on `MessageList` (drilled to each message) or on `Message`; handler type `CustomMentionHandler` `(event, mentioned_users: UserResponse[], message: LocalMessage)` (the second argument is `@deprecated`; read mention metadata from `message`). `VirtualizedMessageList` has no such prop in v15 (v14 virtualized lists got the handlers only from `Channel`), so a virtualized list needs a custom message UI to handle mention clicks.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:145-147`; `release-v14:src/components/Channel/index.ts:3`; `release-v14:src/components/Message/hooks/useMentionsHandler.ts:51-59` (fell back to the `Channel` handlers)
  - `master:src/components/MessageList/MessageList.tsx:215-216,440-441,458` (`onMentionsClick`/`onMentionsHover` in `PropsDrilledToMessage`); `master:src/components/MessageList/VirtualizedMessageList.tsx:85-91` (not drilled); `master:src/components/Message/types.ts:44-47`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/03-channel_action_context.md`, `03-ui-cookbook/04-message/03-mentions_actions.md`
- Example needed: yes

Before (v14):

```tsx
<Channel channel={channel} onMentionsClick={handleMentionClick}>
  <MessageList />
</Channel>
```

After (v15):

```tsx
<Channel channel={channel}>
  <MessageList onMentionsClick={handleMentionClick} />
</Channel>
```

---

### BC-026: `Channel.skipMessageDataMemoization` was removed

- Status: confirmed
- Area: channel
- User impact: compile error on the prop; no behavior to restore.
- Old API:
  - `ChannelProps.skipMessageDataMemoization?: boolean`
- Replacement: none - removed. It tuned the v14 React channel reducer, which no longer exists; messages come from `channel.messagePaginator`.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:151`
  - `master:src/components/Channel/Channel.tsx:17-23`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`
- Example needed: no

---

### BC-027: `Channel` behavior changes with the same signature: no remount per channel, activation, no reload on reconnect, no search jump

- Status: confirmed
- Area: channel
- User impact: silent behavior changes.
  - `Channel` no longer keys its subtree on `channel.cid`. Switching the `channel` prop keeps children mounted; a custom child that relied on remounting to reset local state or re-run a mount effect must depend on the channel instead.
  - `Channel` calls `channel.activate()` on mount and the returned release on unmount. A custom channel surface that does not render `Channel` must do the same, or the client re-seeds its message list on hydration and `releaseUnusedChannels()` may drop it.
  - `Channel` no longer reloads the channel on `connection.recovered`; the client reloads active channels itself.
  - `Channel` no longer scrolls to a message focused from search (`SearchController._internalState.focusedMessage`). Call `channel.messagePaginator.jumpToMessage(id)` where the message is chosen; `MessageSearchResultItem` does.
  - `Channel` no longer provides `ChannelStateContext` / `ChannelActionContext` / `TypingContext` (contexts area).
- Old API:
  - implicit behavior of `<Channel>`
- Replacement: as listed. For a custom surface: `useEffect(() => channel.activate(), [channel]);`.
- Evidence:
  - `release-v14:src/components/Channel/Channel.tsx:213` (`key={channel.cid}`), `:271` (`useSearchFocusedMessage`), `:527,539` (`connection.recovered`)
  - `master:src/components/Channel/Channel.tsx:46-58` (no key; `useEffect(() => channel.activate(), [channel])`), `:63-94` (only `user.deleted` re-query)
  - commits: `088c795c1` (PR #3286); `3098a90a6 feat: use network and WS connection observer services from LLC` (PR #3281, body: "`Channel` no longer reloads its channel on `connection.recovered`"); `a41eed56f` (PR #3310)
- Docs impact:
  - `02-ui-components/04-channel/01-channel.md`
- Example needed: no
- Guide check: `ai-migration-v14-v15.md` "`<Channel>` declares the channel active, and owns its message window" still says `Channel` "calls `channel.reload()` on `connection.recovered`" and tells custom surfaces to do it. That was removed by `3098a90a6`; the reload half of that section is outdated.

---

## Channel list

### BC-028: `ChannelList` is driven by a `ChannelPaginator`: `paginator` is required and every query, event and render prop was removed

- Status: confirmed
- Area: channel list
- User impact: compile error on every v14 `<ChannelList ...>` (`TS2741 Property 'paginator' is missing`, `TS2322 Property 'filters'/'sort'/'options'/... does not exist`). In JS, the list renders nothing useful (no paginator to read). `ChannelList` also no longer renders the header, the search bar or the channel-list `NotificationList`.
- Silent default changes (no compile error, and they hit apps that never passed these props):
  - v14 `setActiveChannelOnMount` defaulted to `true`, so every v14 app opened the first channel on load. v15 has no default selection: the app loads with nothing open until you call `useWorkspaceNavigation().openChannel(channel)` (BC-013). To keep the v14 behavior, subscribe to the paginator once and open its first item: `useEffect(() => paginator.state.subscribeWithSelector(({ items }) => ({ first: items?.[0] }), ({ first }) => { if (first && !opened.current) { opened.current = true; openChannel(first); } }), [paginator, openChannel])`.
  - v14 `allowNewMessagesFromUnfilteredChannels` defaulted to `true`: a new message in a channel that was not in the list added it, regardless of the list's filters. In v15 the paginator adds a channel only if it matches the paginator's own filters (stream-chat `BasePaginator.applyItemIngestion` -> `matchesFilter`); there is no default opt-out.
  - v14 `Paginator` defaulted to `LoadMorePaginator` (a "Load more" button); the v15 default list is an infinite-scroll `InfiniteScrollPaginator` that loads the next page when scrolled near the end.
- Old API (`ChannelListProps`):
  - query: `filters`, `sort`, `options`, `watchers`, `customQueryChannels`, `recoveryThrottleIntervalMs`
  - event handlers: `onAddedToChannel`, `onChannelDeleted`, `onChannelHidden`, `onChannelTruncated`, `onChannelUpdated`, `onChannelVisible`, `onMessageNew`, `onMessageNewHandler`, `onRemovedFromChannel`, `allowNewMessagesFromUnfilteredChannels`, `lockChannelOrder`
  - selection: `customActiveChannel`, `setActiveChannelOnMount`
  - rendering: `EmptyStateIndicator`, `Paginator`, `renderChannels`, `channelRenderFilterFn`, `sendChannelsToList`, `getLatestMessagePreview`, `showChannelSearch`
- Replacement:
  - `ChannelList` props are `{ paginator: ChannelPaginator; loadMoreDebounceMs?; loadMoreThresholdPx? }`. Build the paginator with `new ChannelPaginator({ client, filters, sort, id, requestOptions?, paginatorOptions?, sortComparatorFactory? })` (stream-chat; `sort` is `SortParamRequest[]`, `[{ field, direction }]`) and register it with `client.channelManager.insertPaginator({ paginator })` so it receives WS updates.
  - header + search + all registered lists: `<ChannelNavigation />` (or `<ChannelLists />` for the lists only). Search is always shown; hide it with a `Search: () => null` override.
  - event handling / ordering / filtering of incoming channels: the `ChannelManager` (`client.channelManager.addEventHandler(...)`, ownership resolver) and `ChannelPaginator` (`sortComparatorFactory`) in stream-chat.
  - rendering: the generic list slots on `ComponentContext` (BC-029); `getLatestMessagePreview` -> BC-033.
  - `customActiveChannel` / `setActiveChannelOnMount`: open a channel through workspace navigation (BC-013).
- Evidence:
  - `release-v14:src/components/ChannelList/ChannelList.tsx:53-151` (props), `:357-387` (header, `Search` behind `showChannelSearch`, `ChannelListUI`, `NotificationList`, `DialogManagerProvider`)
  - `master:src/components/ChannelList/ChannelList.tsx:15-20` (props), `:37-104`; `master:src/components/ChannelList/ChannelNavigation.tsx:22-42`; `master:src/components/ChannelList/ChannelLists.tsx:21-37`
  - `examples.diff` `examples/tutorial/src/4-channel-list/App.tsx` (filters/sort/options -> `ChannelPaginator` + `insertPaginator`, `ChannelList` -> `ChannelNavigation`)
  - commit: `99cbe6704` (PR #3237); `be2c8e1e7` (PR #3258)
  - corpus: TS2741 `paginator` missing in `docs/02-ui-components__04-channel__01-channel__2.tsx:13`, `__4.tsx:27`, `05-channel-list__01-channel_list__3.tsx:24`, `05-channel-list__04-channel_preview_ui__1.tsx:10`, `08-message__08-avatar__3.tsx:19`, `11-chat-view__1.tsx:17`, `03-ui-cookbook__02-channel-list__01-channel_list_preview__1.tsx:6`, `06-attachment__01-attachment_actions__6.tsx:154`, `06-attachment__02-image_gallery__3.tsx:17`, `06-attachment__03-geolocation_attachment__2.tsx:27`, `09-channel_header__2.tsx:15`, `12-collapsible-sidebar__3.tsx:24`, `14-custom-icons__1.tsx:30`, `06-release-guides__01-upgrade-to-v14__16.tsx:23`; TS2322 on `filters`/`sort`/`options`/`showChannelSearch`/`Paginator` in `01-getting_started__1.tsx:35`, `05-channel-list__05-channel_search__1/3/4`, `05-channel-list__06-channel-list-infinite-scroll__1/2`, `05-channel-list__08-advanced-search__1`, `03-ui-cookbook__02-channel-list__02-channel_search__1/2/3`, `03-ui-cookbook__08-app_menu__2.tsx:41`, `03-ui-cookbook__13-accessibility__01-accessible-list-labels__1.tsx:44`, `06-release-guides__01-upgrade-to-v14__10/25`, `examples/tutorial/src/{4,5,6,7}-*/App.tsx`, `examples/vite/src/ChatLayout/Panels.tsx:177`
- Docs impact:
  - `02-ui-components/05-channel-list/01-channel_list.md` (all props), `02-channel_list_context.md`, `05-channel_search.md`, `06-channel-list-infinite-scroll.md`, `07-multiple_channel_lists.md` (`channelRenderFilterFn`), `08-advanced-search.md`, `02-ui-components/01-getting_started.md`, `03-ui-cookbook/02-channel-list/*`, `03-ui-cookbook/08-app_menu.md`, `06-release-guides/01-upgrade-to-v14.md`, plus every page in the corpus list above
- Example needed: yes

Before (v14):

```tsx
import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { ChannelList } from 'stream-chat-react';

const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
const sort: ChannelSort = { last_message_at: -1 };
const options: ChannelOptions = { limit: 10 };

<ChannelList filters={filters} options={options} showChannelSearch sort={sort} />;
```

After (v15), as in `examples/tutorial/src/4-channel-list/App.tsx`:

```tsx
import { useEffect } from 'react';
import {
  type ChannelFilters,
  ChannelPaginator,
  type SortParamRequest,
  type StreamChat,
} from 'stream-chat';
import { ChannelNavigation } from 'stream-chat-react';

const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];

export const Sidebar = ({ client }: { client: StreamChat }) => {
  useEffect(() => {
    const paginator = new ChannelPaginator({
      client,
      filters,
      id: 'channels:default',
      sort,
    });
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client]);

  // Header, search and one ChannelList per registered paginator.
  return <ChannelNavigation />;
};
```

A single list can still be rendered on its own with `<ChannelList paginator={paginator} />` (it has no header or search). Page size and other request options map onto `ChannelPaginator`'s `requestOptions` / `paginatorOptions` (stream-chat).

---

### BC-029: `ChannelListUI`, `ChannelListUIProps` and `ComponentContext.ChannelListUI` were removed

- Status: confirmed
- Area: channel list
- User impact: compile errors on the import and on a `ChannelListUI` key in `WithComponents` overrides; in JS the override is ignored. `ComponentContext.LoadingIndicator` no longer affects the channel list (v14 `ChannelListUI` read it and `LoadingErrorIndicator`, whose slot is now removed; see BC-019).
- Old API:
  - `ChannelListUI` (`{ error, loadedChannels?, loading?, setChannels? }`), `ChannelListUIProps`
  - `ComponentContextValue.ChannelListUI`
- Replacement: per-part slots on `ComponentContext` that `ChannelList` reads: `EmptyListIndicator`, `EndReachedIndicator` (`{ hasEnded, reached }`), `FirstPageLoadingIndicator` (default `LoadingChannels`), `ListItem` (`{ item }`, default renders `ChannelListItem`), `LoadingNextPageIndicator` (`{ isLoading? }`). Query errors are reported as a notification. For a fully custom list, read `useChannelPaginatorState(paginator)` and render your own.
- Evidence:
  - `release-v14:src/components/ChannelList/ChannelListUI.tsx:10,24`; `release-v14:src/context/ComponentContext.tsx:129`
  - `master:src/context/ComponentContext.tsx:90-102`; `master:src/components/ChannelList/ChannelList.tsx:48-54,78-83`
  - commit: `99cbe6704` (PR #3237)
  - corpus: `docs/02-ui-components__05-channel-list__01-channel_list__3.tsx:6`, `05-channel-list__02-channel_list_context__2.tsx:8-9`, `06-release-guides__01-upgrade-to-v14__16.tsx:6` TS2724
- Docs impact:
  - `02-ui-components/05-channel-list/01-channel_list.md`, `02-channel_list_context.md`, `02-ui-components/04-channel/05-component_context.md`, `03-ui-cookbook/02-channel-list/01-channel_list_preview.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
const CustomListUI = ({ children, loading }: PropsWithChildren<ChannelListUIProps>) =>
  loading ? <Spinner /> : <div className='my-list'>{children}</div>;

<WithComponents overrides={{ ChannelListUI: CustomListUI }}>
  <ChannelList filters={filters} />
</WithComponents>;
```

After (v15):

```tsx
import { ChannelListItem, ChannelNavigation, WithComponents } from 'stream-chat-react';
import type { Channel } from 'stream-chat';

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
</WithComponents>;
```

Note: these slots are generic "paginated list" slots; in v15 only `ChannelList` reads them.

---

### BC-030: `usePaginatedChannels`, `useConnectionRecoveredListener` and the `CustomQueryChannelParams` / `CustomQueryChannelsFn` / `EffectiveQueryParams` types were removed

- Status: confirmed
- Area: channel list hooks
- User impact: compile errors on the imports.
- Old API:
  - `usePaginatedChannels(client, filters, sort, options, activeChannelHandler, recoveryThrottleIntervalMs?, customQueryChannels?)`
  - `useConnectionRecoveredListener(forceUpdate?)`
  - `CustomQueryChannelParams`, `CustomQueryChannelsFn`, `EffectiveQueryParams`
- Replacement: a `ChannelPaginator` (stream-chat) owns querying, pagination, reconnect recovery and the effective filters/sort (`paginator.effectiveFilters`, `paginator.effectiveSort`); read it with `useChannelPaginatorState(paginator)`. Reconnect: `useConnectionRecoveredListener` only wrapped `client.on('connection.recovered', ...)`, and that event still fires in stream-chat v10, once `ConnectionRecoveryManager` has re-queried the lists and reloaded active channels. Use `const { unsubscribe } = client.on('connection.recovered', handler)` directly. For raw socket status use `useWSConnectionState()`. Custom query functions: subclass / configure `ChannelPaginator` in stream-chat.
- Evidence:
  - `release-v14:src/components/ChannelList/hooks/usePaginatedChannels.ts:29,36,43,59`; `release-v14:src/components/ChannelList/hooks/useConnectionRecoveredListener.ts:5`
  - `master:src/components/ChannelList/hooks/index.ts:1-4` (neither exported); `master:src/components/ChannelList/hooks/useChannelPaginatorState.ts:29`
  - commit: `99cbe6704` (PR #3237)
  - corpus: `docs/02-ui-components__05-channel-list__01-channel_list__7.tsx:12` TS2305 (`CustomQueryChannelParams`)
- Docs impact:
  - `02-ui-components/05-channel-list/03-channel_list_hooks.md`, `02-ui-components/05-channel-list/01-channel_list.md` (`customQueryChannels`)
- Example needed: no

---

### BC-031: the channel-list utilities were removed: `moveChannelUpwards`, `findLastPinnedChannelIndex`, `extractSortValue`, `isChannelPinned`, `isChannelArchived`, `shouldConsiderPinnedChannels`, `shouldConsiderArchivedChannels`

- Status: confirmed
- Area: channel list utils
- User impact: compile errors on the imports (typically from custom `onMessageNew` / `customQueryChannels` handlers).
- Old API:
  - `moveChannelUpwards({ channels, channelToMove, sort, ... })`, `findLastPinnedChannelIndex({ channels })`, `extractSortValue(...)`, `isChannelPinned(channel)`, `isChannelArchived(channel)`, `shouldConsiderPinnedChannels(sort)`, `shouldConsiderArchivedChannels(filters)`
- Replacement: none exported. Ordering is the `ChannelPaginator`'s comparator (`sortComparatorFactory`); pinned/archived state is on the membership: `useChannelMembershipState(channel).pinned_at` / `.archived_at` (or `channel.state.membership`).
- Evidence:
  - `release-v14:src/components/ChannelList/utils.ts:10,37,90,98,136,145,156`
  - `master:src/components/ChannelList/utils.ts` removed; `master:src/components/ChannelList/index.ts:1-5`; `master:src/components/ChannelListItem/ChannelListItem.tsx:157` (`pinned={membership.pinned_at != null}`)
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - none found in v14 docs (grep for each name returns no page)
- Example needed: no

---

### BC-032: `ChannelListContext` lost `channels`, `hasNextPage`, `loadNextPage` and `setChannels`

- Status: confirmed
- Area: channel list context
- User impact: compile error (`TS2339 Property 'channels'/'setChannels' does not exist on type 'ChannelListContextValue'`); `undefined` in JS. The context is now provided by `ChannelLists` (so `ChannelNavigation`), not by a standalone `ChannelList`.
- Old API:
  - `ChannelListContextValue.channels`, `.hasNextPage`, `.loadNextPage()`, `.setChannels`
- Replacement: `useChannelListContext().paginator` (optional; the primary registered `ChannelPaginator`). Read with `useChannelPaginatorState(paginator)` (`channels`, `hasNext`, ...), load more with `paginator.toTail()` (`next()` is `@deprecated` in stream-chat v10), mutate with `paginator.setItems({ valueOrFactory })` (per the field's doc); to add a channel to the matching lists, `client.channelManager.ingestChannel(channel)`.
- Evidence:
  - `release-v14:src/context/ChannelListContext.tsx:11-23`
  - `master:src/context/ChannelListContext.tsx:6-14`; `master:src/components/ChannelList/ChannelLists.tsx:29-36`
  - commit: `99cbe6704` (PR #3237)
  - corpus: `docs/02-ui-components__05-channel-list__02-channel_list_context__1.tsx:6` (x2), `__2.tsx:23`, `docs/04-guides__07-sdk-state-management__2.tsx:12`, `docs/06-release-guides__01-upgrade-to-v14__11.tsx:6,9` TS2339
- Docs impact:
  - `02-ui-components/05-channel-list/02-channel_list_context.md`, `03-channel_list_hooks.md`, `01-channel_list.md`, `04-guides/07-sdk-state-management.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
const { channels, setChannels } = useChannelListContext();
```

After (v15):

```tsx
import { useChannelListContext, useChannelPaginatorState } from 'stream-chat-react';
import type { ChannelPaginator } from 'stream-chat';

const ChannelCount = ({ paginator }: { paginator: ChannelPaginator }) => {
  const { channels } = useChannelPaginatorState(paginator);
  return <span>{channels?.length ?? 0}</span>;
};

// inside ChannelNavigation / ChannelLists:
const { paginator } = useChannelListContext();
```

---

### BC-033: `ChannelListItem` / `ChannelListItemUI` / `ChannelListItemTimestamp` props changed: `lastMessage` -> `previewedMessage`, `latestMessagePreview` and `getLatestMessagePreview` removed, selection props removed

- Status: confirmed
- Area: channel list item
- User impact: compile errors in custom `ChannelListItemUI` overrides and direct `ChannelListItem` usage; in JS, reading `props.lastMessage` / `props.latestMessagePreview` yields `undefined`, and passing `getLatestMessagePreview` / `setActiveChannel` does nothing.
- Old API:
  - `ChannelListItemProps`: `channelUpdateCount`, `getLatestMessagePreview`, `key`, `setActiveChannel`, `watchers`
  - `ChannelListItemUIProps`: the above, plus `lastMessage`, `latestMessagePreview`
  - `ChannelListItemTimestampProps.lastMessage`
  - `ChannelList.getLatestMessagePreview` (BC-028)
- Replacement:
  - `lastMessage` -> `previewedMessage` (on `ChannelListItemUIProps` and `ChannelListItemTimestamp`). `ChannelListItem` also takes `previewedMessage` to preview a specific message; it defaults to `channel.messagePaginator.aggregateState.lastMessage`.
  - `latestMessagePreview` / `getLatestMessagePreview` -> render `<SummarizedMessagePreview latestMessage={previewedMessage} ... />`, or override the `SummarizedMessagePreview` slot via `WithComponents` (`SummarizedMessagePreviewProps` = `{ latestMessage, messageDeliveryStatus, participantCount }`). The `getLatestMessagePreview` / `getLatestMessagePreviewText` utilities are still exported (only their `t` / `userLanguage` types changed). Apps that relied on the v14 default `getLatestMessagePreview` (`defaultGetLatestMessagePreview`) keep a preview with no change: the default `ChannelListItemUI` renders the `SummarizedMessagePreview` slot.
  - `setActiveChannel` / `watchers` -> `useWorkspaceNavigation().openChannel(channel, { event })` or the `onSelect` prop (BC-013).
  - `channelUpdateCount` / `key`: none needed; the item subscribes to the channel's stores.
  - `active` now defaults to `useWorkspaceNavigation().isChannelActive(cid)`.
- Evidence:
  - `release-v14:src/components/ChannelListItem/ChannelListItem.tsx:37,39,58,62,68,72,74`; `release-v14:src/components/ChannelListItem/ChannelListItemTimestamp.tsx:9,12`
  - `master:src/components/ChannelListItem/ChannelListItem.tsx:22-65,88-109`; `master:src/components/ChannelListItem/ChannelListItemTimestamp.tsx:10,14`; `master:src/components/ChannelListItem/ChannelListItemUI.tsx:95-102,152,160-161`; `master:src/components/ChannelListItem/utils.tsx:260,324`; `master:src/context/ComponentContext.tsx:143`
  - commit: `99cbe6704` (PR #3237)
  - corpus: `docs/03-ui-cookbook__02-channel-list__01-channel_list_preview__2.tsx:34` TS2322 (`lastMessage` on `ChannelListItemTimestampProps`); `examples/tutorial/src/6-custom-ui-components/App.tsx:42` TS2339 (`latestMessagePreview`), `:44` (`setActiveChannel`)
- Docs impact:
  - `02-ui-components/05-channel-list/04-channel_preview_ui.md`, `02-ui-components/05-channel-list/01-channel_list.md`, `03-ui-cookbook/02-channel-list/01-channel_list_preview.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
import { type ChannelListItemUIProps } from 'stream-chat-react';

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

After (v15):

```tsx
import {
  type ChannelListItemUIProps,
  SummarizedMessagePreview,
  useWorkspaceNavigation,
} from 'stream-chat-react';

const CustomItem = ({
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

`participantCount` (optional, `useLatestMessagePreview.ts:147`) is the third `SummarizedMessagePreview` prop; the default `ChannelListItemUI` passes `channel.data?.member_count` (`ChannelListItemUI.tsx:163`).

Guide check: `ai-migration-v14-v15.md` "`ChannelListItem` `getLatestMessagePreview` prop -> removed" says the `getLatestMessagePreview` util is removed and suggests overriding via "the `<Chat>` / `<Channel>` component props". Both are wrong for v15: the util is still exported (`master:src/components/ChannelListItem/utils.tsx:324`), and neither `Chat` nor `Channel` takes component props; use `WithComponents`.

---

## Headers, threads and search

### BC-034: `ComponentContext.HeaderStartContent` was removed; `ChannelHeader` and `ThreadHeader` take `StartContent` / `EndContent` and render navigation buttons by default

- Status: confirmed
- Area: channel header / thread header
- User impact: compile error on a `HeaderStartContent` override (`TS2561`); in JS it is ignored and the custom content (often a sidebar toggle) disappears. Visible change: by default `ChannelHeader` / `ThreadHeader` render `WorkspaceNavigationBackButton` at the start and `WorkspaceNavigationCloseButton` at the end; both render nothing outside a workspace navigation that reports the panel as stacked / dismissable.
- Old API:
  - `ComponentContextValue.HeaderStartContent`
- Replacement: `<ChannelHeader StartContent={...} EndContent={...} />` and the same on `ThreadHeader`. Passing a component replaces the default button; render `WorkspaceNavigationBackButton` / `WorkspaceNavigationCloseButton` (new exports) inside yours to keep it. `ComponentContext.HeaderEndContent` is unchanged and still feeds `ChannelListHeader` / `ThreadListHeader` (but `ChannelListHeader` shows it only while a channel is open in the workspace).
- Evidence:
  - `release-v14:src/context/ComponentContext.tsx:305`; `release-v14:src/components/ChannelHeader/ChannelHeader.tsx:52,61-63`
  - `master:src/components/ChannelHeader/ChannelHeader.tsx:50-69,74-110`; `master:src/components/Thread/ThreadHeader.tsx:79-100`; `master:src/components/ChannelList/ChannelListHeader.tsx` (`hasActiveChannel = useWorkspaceNavigation().openChannels.length > 0`)
  - commit: `66557d63b feat!: port the tutorial alignment (#3251) to v15, with panel-aware workspace navigation` (PR #3301)
- Docs impact:
  - `02-ui-components/04-channel/02-channel_header.md`, `02-ui-components/04-channel/05-component_context.md`, `02-ui-components/03-chat/01-chat.md`, `03-ui-cookbook/12-collapsible-sidebar.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
<WithComponents overrides={{ HeaderStartContent: SidebarToggle }}>
  <Channel channel={channel}>
    <ChannelHeader />
  </Channel>
</WithComponents>
```

After (v15):

```tsx
import { Channel, ChannelHeader, WorkspaceNavigationBackButton } from 'stream-chat-react';

const HeaderStart = () => (
  <>
    <WorkspaceNavigationBackButton />
    <SidebarToggle />
  </>
);

<Channel channel={channel}>
  <ChannelHeader StartContent={HeaderStart} />
</Channel>;
```

---

### BC-035: `Thread` takes a required `thread` prop and renders its children; its composition props and `useLegacyThreadContext` were removed

- Status: confirmed
- Area: thread
- User impact:
  - compile error: `<Thread />` without `thread` (`TS2741`), and on `additionalMessageComposerProps`, `additionalMessageListProps`, `additionalParentMessageProps`, `additionalVirtualizedMessageListProps`, `autoFocus`, `enableDateSeparator`, `Message`, `messageActions`, `virtualized`.
  - in JS: a `<Thread />` with no children renders an empty container (no header, list or composer); the removed props are ignored.
  - `useLegacyThreadContext` import fails. Threads opened from a message are LLC `Thread` instances only; there is no "legacy" message-based thread.
  - defaults changed: a `MessageList` inside a thread now shows date separators unless `withDateSeparator={false}`. v14 `autoFocus` defaulted to `true`, so every v14 thread focused its composer on open, not only threads that passed the prop; in v15 the composer is focused only if you render `<MessageComposer focus />`.
  - `Thread` no longer remounts its subtree per thread; `Thread` renders nothing if the channel has replies disabled or the parent message is missing.
- Old API:
  - `<Thread />` reading the thread from `ChannelStateContext` / `ThreadContext`
  - `ThreadProps`: `additionalMessageComposerProps`, `additionalMessageListProps`, `additionalParentMessageProps`, `additionalVirtualizedMessageListProps`, `autoFocus`, `enableDateSeparator`, `Message`, `messageActions`, `virtualized`
  - `useLegacyThreadContext`
- Replacement: `<Thread thread={thread}>` + children (`ThreadHeader`, `MessageList` or `VirtualizedMessageList`, `MessageComposer focus`). Get the instance from `client.threads.ensure({ channel, parentMessage })` / `client.threads.get(...)`, from a `ThreadSlot`, or from workspace navigation. Per prop: list/composer props go on the children; `additionalParentMessageProps` -> a `ThreadHead` override on `ComponentContext`; `Message` -> a `MessageUI` override scoped with `WithComponents`; `messageActions` -> removed (message-actions area); `enableDateSeparator` -> `withDateSeparator` on the list.
- Evidence:
  - `release-v14:src/components/Thread/Thread.tsx:26-45` (`ThreadProps`), `:51-66` (reads `ChannelStateContext`, keys on thread id), `:184-207` (renders header, list, composer); `release-v14:src/components/Thread/LegacyThreadContext.ts:8`; `release-v14:src/components/Thread/index.ts:4`
  - `master:src/components/Thread/Thread.tsx:17-25` (`ThreadProps = PropsWithChildren<{ thread: StreamThread }>`), `:66-113`; `master:src/components/Thread/index.ts:1-3`
  - commit: `c2136f307 refactor!: align Thread with Channel - instance prop, provider, children` (PR #3289); `b541c45f9 refactor(MessageActions)!: remove the messageActions prop in from message lists` (PR #3288); `07664893e feat(context): consolidate message UI overrides on the MessageUI slot` (PR #3268)
- Docs impact:
  - `02-ui-components/07-message-list/05-thread.md`, `02-ui-components/07-message-list/06-thread-context.md`, `02-ui-components/11-chat-view.md`, `02-ui-components/06-thread-list/01-thread-list.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
<Thread
  additionalMessageComposerProps={{ audioRecordingEnabled: true }}
  additionalMessageListProps={{ onUserClick }}
  autoFocus
/>
```

After (v15):

```tsx
import { MessageComposer, MessageList, Thread, ThreadHeader } from 'stream-chat-react';

<Thread thread={thread}>
  <ThreadHeader />
  <MessageList onUserClick={onUserClick} withDateSeparator={false} />
  <MessageComposer audioRecordingEnabled focus />
</Thread>;
```

Guide check: `ai-migration-v14-v15.md` "`Thread` renders children" says `Thread` owns "registering it with the `ThreadManager`". It does not: `master:src/components/Thread/Thread.tsx:41-45` ("It does not register the thread with the `ThreadManager`; `client.threads.ensure()` or `thread.activate()` does"), confirmed by PR #3310.

---

### BC-036: `ThreadHeader` lost its `closeThread` and `thread` props; `ComponentContext.ThreadHeader` was removed

- Status: confirmed
- Area: thread header
- User impact: compile error (`TS2339 Property 'closeThread'/'thread' does not exist on type 'ThreadHeaderProps'`) in custom thread headers; a `ThreadHeader` override in `WithComponents` is ignored (TS2561), since `Thread` no longer renders a header.
- Old API:
  - `ThreadHeaderProps.closeThread(event?)`, `ThreadHeaderProps.thread: LocalMessage`
  - `ComponentContextValue.ThreadHeader`
- Replacement: render your header as a child of `<Thread>`. Read the thread with `useThreadContext()` (parent message: `useStateStore(thread.state, s => ({ parentMessage: s.parentMessage }))`); close it with the new `useCloseThread()` hook (returns `(options?: WorkspaceNavigationOptions) => void`), or `useWorkspaceNavigation().closeThread(thread.id)`. Both close through workspace navigation, so they do nothing outside `ChatView` / a `WorkspaceNavigationProvider`. `ThreadHeaderProps` is now `{ overrideTitle?, StartContent?, EndContent? }`.
- Evidence:
  - `release-v14:src/components/Thread/ThreadHeader.tsx:66-70`; `release-v14:src/context/ComponentContext.tsx:288`; `release-v14:src/components/Thread/Thread.tsx:192`
  - `master:src/components/Thread/ThreadHeader.tsx:79-94`; `master:src/components/Threads/hooks/useCloseThread.ts:14`; `master:src/components/Threads/index.ts:2`
  - commit: `c2136f307` (PR #3289)
  - corpus: `docs/03-ui-cookbook__10-thread_header__1.tsx:6,8` TS2339
- Docs impact:
  - `03-ui-cookbook/10-thread_header.md`, `02-ui-components/04-channel/03-channel_action_context.md` (`closeThread`), `02-ui-components/04-channel/05-component_context.md`
- Example needed: yes

Before (v14):

```tsx
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

After (v15):

```tsx
import type { ThreadState } from 'stream-chat';
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

<Thread thread={thread}>
  <CustomThreadHeader />
  <MessageList />
  <MessageComposer />
</Thread>;
```

`useCloseThread()` returns `(options?: WorkspaceNavigationOptions) => void`, not a click handler: pass the event as `{ event }` rather than handing the function to `onClick` directly. `useStateStore` has an overload for an `undefined` store (`master:src/store/hooks/useStateStore.ts:13-16`).

---

### BC-037: `ThreadProvider` no longer wraps its children in a `Channel`

- Status: confirmed
- Area: thread context
- User impact: silent. v14 `<ThreadProvider thread={t}>` rendered `<Channel channel={t.channel}>` around its children, so it brought the `.str-chat__channel` container and the channel contexts; v15 provides only `ThreadContext`. Thread-scoped UI rendered with `ThreadProvider` alone loses the channel container (and `ChannelInstanceContext`; `useChannel()` still resolves via the thread). Wrapping `<Thread>` in `ThreadProvider` is no longer needed.
- Old API:
  - `ThreadProvider` (implicitly mounted `Channel`)
- Replacement: use `<Thread thread={...}>` (provides the thread, loads it, scopes audio); keep `ThreadProvider` only for thread-scoped UI outside `Thread`, and add `<Channel channel={thread.channel}>` yourself if that UI needs the channel subtree.
- Evidence:
  - `release-v14:src/components/Threads/ThreadContext.tsx:14-21`
  - `master:src/components/Threads/ThreadContext.tsx:12-17`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/07-message-list/06-thread-context.md`, `02-ui-components/11-chat-view.md`, `02-ui-components/06-thread-list/01-thread-list.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: no

---

### BC-038: `ThreadList` reloads the thread list on every mount and selects through workspace navigation

- Status: confirmed
- Area: thread list
- User impact: silent.
  - mounting `ThreadList` calls `client.threads.reload({ force: true })` (v14 reloaded through `client.threads.activate()` only when the manager was not yet `ready`, had unseen threads or a stale order; otherwise it reused what the manager held).
  - clicking a row calls `useWorkspaceNavigation().openThread(thread)`; outside `ChatView` / a `WorkspaceNavigationProvider` nothing opens and no row is marked active (v14 used `ThreadsViewContext`, BC-012).
  - the list reads `client.threads.paginator.state` (LLC); code reading `client.threads.state.threads` / `.pagination` breaks for LLC reasons (ruled out below).
- Old API:
  - implicit behavior of `ThreadList` / `ThreadListItemUI`
- Replacement: provide workspace navigation (ChatView or `WorkspaceNavigationProvider` with `openThread` / `isThreadActive`); read threads via `client.threads.paginator.state`.
- Evidence:
  - `release-v14:src/components/Threads/ThreadList/ThreadList.tsx:21-24,35-50`; `release-v14:src/components/Threads/ThreadList/ThreadListItemUI.tsx` (`useThreadsViewContext().setActiveThread`)
  - `master:src/components/Threads/ThreadList/ThreadList.tsx:34-58,71,115`; `master:src/components/Threads/ThreadList/ThreadListItemUI.tsx` (`useWorkspaceNavigation()` `isThreadActive` / `openThread`)
  - commits: `99cbe6704` (PR #3237); `a41eed56f` (PR #3310)
- Docs impact:
  - `02-ui-components/06-thread-list/01-thread-list.md`
- Example needed: no

---

### BC-039: search results are no longer watched, and selecting one opens it through workspace navigation

- Status: confirmed
- Area: search
- User impact: silent.
  - stream-chat v10 queries channel results (and the channels message search fetches) with `watch: false`. The SDK result items watch on open (`ensureWatched()`, or `jumpToMessage(id, { watchChannel: true })` for messages). A custom search result component that only opened the channel now opens an unwatched channel (no events, possibly empty).
  - default result items call `openChannel` (workspace navigation: no-op outside `ChatView`, BC-013) and `client.channelManager.ingestChannel(channel)` instead of `setActiveChannel` + `ChannelListContext.setChannels`.
  - selecting a message result jumps with `channel.messagePaginator.jumpToMessage(...)`; `Channel` no longer performs the jump (BC-027). The "jumped here" marker reads `messagePaginator.messageFocusSignal`, not `SearchController._internalState.focusedMessage`.
- Old API:
  - default `ChannelSearchResultItem` / `MessageSearchResultItem` / `UserSearchResultItem` behavior
- Replacement: in a custom result component, call `channel.ensureWatched()` (or `jumpToMessage(id, { watchChannel: true })`) when opening; open via `useWorkspaceNavigation().openChannel(channel, { event })`. The default items gained an optional `onSelect` prop that replaces their selection handler.
- Evidence:
  - `release-v14:src/components/Search/SearchResults/SearchResultItem.tsx:23-30,45-74,99-114`
  - `master:src/components/Search/SearchResults/SearchResultItem.tsx:66-105` (`ChannelSearchResultItem`: `openChannel`, `ensureWatched`, `ingestChannel`), `:117-180` (`MessageSearchResultItem`: `jumpToMessage(item.id, { watchChannel: true })`), `:199-243`
  - commit: `a41eed56f` (PR #3310; "BREAKING CHANGE: channel search results ... are no longer watched; a custom search result component watches the channel when it is opened"); `088c795c1` (PR #3286)
- Docs impact:
  - `02-ui-components/05-channel-list/05-channel_search.md`, `02-ui-components/05-channel-list/08-advanced-search.md`, `03-ui-cookbook/02-channel-list/02-channel_search.md`
- Example needed: no

---

### BC-040: the lost-connection notification reads connection stores and changes copy for socket drops

- Status: confirmed
- Area: notifications / chat
- User impact: silent / tests and dictionaries.
  - a WebSocket drop on a working network now shows "Reconnecting..." (new key `chat.reportLostConnection.reconnecting.text`) instead of "Waiting for network..." (still used when the device network is down).
  - the delay before the banner shows applies only to WebSocket drops: a drop is held for `client.wsConnection.config.offlineNotificationDisplayDelayMs` (5 s default) before "Reconnecting..." shows, and is dropped if the socket returns within that window. A device-network loss shows "Waiting for network..." immediately.
  - nothing in the SDK listens to or forwards `connection.changed` (removed from stream-chat v10); app code that did should use `useWSConnectionState()` / `useNetworkConnectionState()` (new main-entry exports) or the `client.wsConnection.state` / `client.networkConnection.state` stores.
  - The `system:network:connection:lost` notification type is unchanged.
- Old API:
  - implicit behavior of `<Chat>`'s connection notification; `connection.changed` (LLC)
- Replacement: as listed.
- Evidence:
  - `master:src/components/Chat/hooks/useReportLostConnectionSystemNotification.ts:9-36`; `master:src/components/Chat/index.ts:5-6`
  - commit: `3098a90a6 feat: use network and WS connection observer services from LLC` (PR #3281)
- Docs impact:
  - `03-ui-cookbook/07-notifications/01-system-notifications.md`, `04-guides/13-notifications.md`
- Example needed: no

---

## Messages and message lists

### BC-041: `messageActions` prop, `MESSAGE_ACTIONS`, `OPTIONAL_MESSAGE_ACTIONS`, `getMessageActions`, `MessageActionsArray`, `Capabilities` and `MessageContext.getMessageActions` / `actionsEnabled` removed

- Status: confirmed
- Area: message actions
- User impact: compile errors on the removed imports, on the `messageActions` prop, and on reads of `getMessageActions` / `actionsEnabled` from `useMessageContext()`. In untyped code a custom `MessageUI` that calls `getMessageActions()` throws `TypeError: getMessageActions is not a function`. The `messageActions` prop and `getMessageActions` already had no effect on the default UI in v14 (nothing read `getMessageActions`), so no default rendering changes.
- Old API:
  - `MESSAGE_ACTIONS`, `OPTIONAL_MESSAGE_ACTIONS`, `getMessageActions()`, `MessageActionsArray`, `Capabilities`
  - `Message.messageActions`, `MessageList.messageActions`, `VirtualizedMessageList.messageActions`, `Thread.messageActions` (Thread area), `SharedMessageProps.messageActions`, `VirtuosoContext.messageActions`
  - `MessageContextValue.getMessageActions`, `MessageContextValue.actionsEnabled` (also on `MessageUIComponentProps`, which is `Partial<MessageContextValue>`)
- Replacement: choose the actions on `MessageActions` through `messageActionSet` (filter or extend `defaultMessageActionSet`) and install it with the `MessageActions` slot: `<WithComponents overrides={{ MessageActions: Custom }}>`. Action names are typed by the new exported `DefaultMessageActionType` union (or any string). Permission and message-state filtering stays in `useBaseMessageActionSetFilter`, unless you pass `disableBaseMessageActionSetFilter`. There is no `actionsEnabled` replacement. The base filter already drops actions on deleted, bounced and failed messages.
- Evidence:
  - `release-v14:src/components/Message/utils.tsx:51` `OPTIONAL_MESSAGE_ACTIONS`, `:55` `MESSAGE_ACTIONS`, `:70` `MessageActionsArray`, `:74` `Capabilities`, `:86` `getMessageActions`
  - `release-v14:src/components/Message/types.ts:48` `messageActions?: MessageActionsArray`
  - `release-v14:src/context/MessageContext.tsx:25` `actionsEnabled`, `:30` `getMessageActions`
  - `release-v14:src/components/Message/Message.tsx:89` and `:125` compute both values, and nothing else in v14 `src/` reads them (verified with grep)
  - `master:src/components/Message/utils.tsx` no longer defines any of the removed symbols; the file still exports `isUserMuted` (`:42`), `ACTIONS_NOT_WORKING_IN_THREAD` (`:49`), `areMessagePropsEqual` (`:81`) and others.
  - `master:src/components/MessageActions/MessageActions.tsx:24` `DefaultMessageActionType`, `:65` `MessageActionsProps { disableBaseMessageActionSetFilter?; messageActionSet? }`
  - `master:src/context/ComponentContext.tsx:189` `MessageActions?: React.ComponentType`
  - commit: `b541c45f9 refactor(MessageActions)!: remove the messageActions prop in from message lists` (PR #3288)
  - corpus: `examples/examples/vite/src/AppSettings/tabs/Reactions/ReactionsTab.tsx:138` TS2322 (`messageActions` not on `MessageProps`)
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md`, `02-ui-components/07-message-list/02-virtualized_list.md`, `02-ui-components/07-message-list/05-thread.md` (`messageActions`)
  - `02-ui-components/08-message/01-message.md` (`messageActions`, `MessageActionsArray`)
  - `02-ui-components/08-message/02-message_context.md` (`getMessageActions`, `actionsEnabled`, `MessageActionsArray`)
- Example needed: yes

Before (v14)

```tsx
import { MessageList } from 'stream-chat-react';

export const List = () => <MessageList messageActions={['edit', 'react', 'reply']} />;
```

After (v15)

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

Note: `MessageActionSetItem` is a union, and its `QuickDropdownToggleActionSetItem` member has no `type` field (`master:src/components/MessageActions/MessageActions.tsx:55`–`:63`). So `filter(({ type }) => …)`, as written in the existing `ai-migration-v14-v15.md` section, should not type-check (`TS2339`). Hence the `'type' in item` guard above. This was reasoned from the type, not compiled.

### BC-042: message UI component overrides consolidate on the `MessageUI` slot (`ComponentContext.Message` and the `Message` prop removed)

- Status: confirmed
- Area: message UI overrides
- User impact: compile errors (`TS2322` on a `Message=` prop, `TS2561` on a `Message:` override key). In untyped code the leftovers are ignored without a warning and the default message UI renders.
- Old API:
  - `ComponentContextValue.Message` (deprecated in v14)
  - `Message.Message`, `MessageList.Message`, `VirtualizedMessageList.Message`, `SharedMessageProps.Message`, `VirtuosoContext.Message` (and `Thread.Message`, Thread area)
- Replacement: `<WithComponents overrides={{ MessageUI: Custom }}>`. For `VirtualizedMessageList` only, `VirtualMessage` still takes precedence. It is now applied as the `MessageUI` slot of the list's own subtree (`<WithComponents overrides={{ MessageUI: VirtualMessage }}>`) instead of being passed as a prop to each list item. It still does not affect messages outside the list (v14 did not either), but it now also applies to any `Message` rendered inside the list subtree, including the thread head. To scope an override (e.g. to a thread), wrap that subtree in `WithComponents`. A message UI receives no props of its own, so read everything from `useMessageContext()`.
- Evidence:
  - `release-v14:src/context/ComponentContext.tsx:179` `Message?: React.ComponentType<MessageUIComponentProps>`
  - `release-v14:src/components/Message/types.ts:46` `Message?: ComponentContextValue['MessageUI']`
  - `release-v14:src/components/MessageList/MessageList.tsx:499` `'Message'` among the props drilled to `Message`
  - `release-v14:src/components/MessageList/VirtualizedMessageList.tsx:726` `Message?: React.ComponentType<MessageUIComponentProps>`
  - `master:src/context/ComponentContext.tsx:187` `MessageUI?`, `:317` `VirtualMessage?`. There is no `Message` key.
  - `master:src/components/Message/Message.tsx` resolves `const { MessageUI: MessageUIComponent = DefaultMessageUI } = useComponentContext();`
  - `master:src/components/MessageList/VirtualizedMessageList.tsx` `virtualMessageOverrides = useMemo(() => ({ MessageUI: VirtualMessage }), [VirtualMessage])`
  - commit: `07664893e feat(context): consolidate message UI overrides on the MessageUI slot` (PR #3268)
  - corpus: `docs/02-ui-components__08-message__01-message__2.tsx:5`, `:7`; `docs/02-ui-components__08-message__05-message_ui__2.tsx:5`, `:7`; `docs/02-ui-components__08-message__06-render-text__2.tsx:14` (all TS2322, `Message` not on `MessageListProps` / `VirtualizedMessageListProps`)
- Docs impact:
  - `02-ui-components/08-message/01-message.md`, `02-ui-components/08-message/05-message_ui.md`, `02-ui-components/08-message/06-render-text.md`
  - `02-ui-components/07-message-list/02-virtualized_list.md`, `02-ui-components/07-message-list/05-thread.md`
  - `02-ui-components/04-channel/05-component_context.md`
  - `04-guides/16-ai-integrations/02-chat-sdk-integration.md` (`overrides={{ Message: … }}`)
- Example needed: yes

Before (v14)

```tsx
import {
  MessageList,
  VirtualizedMessageList,
  type MessageUIComponentProps,
} from 'stream-chat-react';

const CustomMessage = (_props: MessageUIComponentProps) => <div>custom</div>;

export const Lists = () => (
  <>
    <MessageList Message={CustomMessage} />
    <VirtualizedMessageList Message={CustomMessage} />
  </>
);
```

After (v15)

```tsx
import {
  MessageList,
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
```

### BC-043: `MessageContext.mutes` and `MessageContext.messageIsUnread` removed

- Status: confirmed
- Area: message context
- User impact: compile error on reads from `useMessageContext()` / `MessageUIComponentProps`. In untyped code `mutes` is `undefined`, so `isUserMuted(message, mutes)` returns `false`, and `messageIsUnread` is `undefined` (falsy).
- Old API:
  - `MessageContextValue.mutes` (sourced from `ChannelStateContext.mutes`)
  - `MessageContextValue.messageIsUnread`
- Replacement:
  - `mutes`: `useChatContext().mutes` (now `UserMuteResponse[]`), e.g. `isUserMuted(message, useChatContext().mutes)`.
  - `messageIsUnread`: none, because it was dropped without a successor. Derive it yourself from the channel's read state, e.g. `!isMyMessage() && (channel.lastRead() == null || message.created_at > channel.lastRead())`, with `channel` from `useChannel()`. `channel.lastRead()` returns `TimestampNS | null | undefined` and is not reactive. To re-render on read changes, subscribe with `useStateStore(channel.state, (s) => ({ read: s.read }))`.
- Evidence:
  - `release-v14:src/context/MessageContext.tsx:62` `messageIsUnread: boolean`, `:102` `mutes?: Mute[]`
  - `release-v14:src/components/Message/Message.tsx` computes `messageIsUnread` from `useChannelStateContext().read`. `MessageWithContext` reads `mutes` from `useChannelStateContext('Message')`.
  - `master:src/context/MessageContext.tsx` has neither field. `master:src/context/ChatContext.tsx:37` `mutes: Array<UserMuteResponse>`
  - `node_modules/stream-chat/dist/types/channel.d.ts:806` `lastRead(): TimestampNS | null | undefined`
  - commit: `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237)
- Docs impact:
  - `02-ui-components/08-message/02-message_context.md` (`messageIsUnread`, `mutes`)
- Example needed: no

### BC-044: `retrySendMessage` prop removed; `useRetryHandler` takes no argument and returns a params-object handler

- Status: confirmed
- Area: message hooks
- User impact: compile errors on `<Message retrySendMessage>` / `<MessageList retrySendMessage>`, on `useRetryHandler(arg)` (`TS2554`), and on calling the returned function with a message. At runtime, `useRetryHandler()(message)` passes a message where `{ localMessage }` is expected. `MessageContextValue.handleRetry` keeps a `(message) => …` shape, but its return type widens to `void | Promise<void>`, so chaining `.then` on it no longer compiles.
- Old API:
  - `Message.retrySendMessage`, `MessageList.retrySendMessage`, `SharedMessageProps.retrySendMessage` (typed `RetrySendMessage`, a removed export; see BC-003)
  - `useRetryHandler(customRetrySendMessage?: RetrySendMessage): RetrySendMessage`, called as `retry(message)`
  - `MessageContextValue.handleRetry: (message: LocalMessage) => Promise<void>`
- Replacement:
  - Per-component retry overrides are gone. To change the retry request, register `retrySendMessageRequest` once on the client: `client.config.set({ channel: { requestHandlers: { retrySendMessageRequest } } })` (this one registration also covers thread replies: a thread's `messageOperations` reads the request handlers from its parent channel's `configState`. `thread.requestHandlers` accepts only `markReadRequest`, so `retrySendMessageRequest` under the `thread` key fails to type-check and is never called). The handler is `OperationRequestFn<'retry'>`: `(params, defaultRequest) => Promise<{ message }>`.
  - `useRetryHandler(): RetryHandler`, where `RetryHandler = (params: Omit<OperationParams<'retry'>, 'message'>) => Promise<void>`. Call it as `retry({ localMessage: message })`.
  - Inside a message UI, `useMessageContext().handleRetry(message)` still works and is the simplest path.
- Evidence:
  - `release-v14:src/components/Message/types.ts:76` `retrySendMessage?: ChannelActionContextValue['retrySendMessage']`
  - `release-v14:src/components/MessageList/MessageList.tsx:508` `'retrySendMessage'` drilled to `Message`
  - `release-v14:src/components/Message/hooks/useRetryHandler.ts:4` `useRetryHandler = (customRetrySendMessage?) => RetrySendMessage`
  - `release-v14:src/context/MessageContext.tsx:56` `handleRetry: ChannelActionContextValue['retrySendMessage']`
  - `master:src/components/Message/hooks/useRetryHandler.ts:6` `RetryHandler`, `:10` `useRetryHandler = (): RetryHandler`, `:16` `(thread ?? channel).messageOperations.retry(params)`
  - `master:src/context/MessageContext.tsx:46` `handleRetry: (message: LocalMessage) => Promise<void> | void`
  - `node_modules/stream-chat/dist/types/channel.d.ts:40` `retrySendMessageRequest?: OperationRequestFn<'retry'>`; `messageOperations/types.d.ts:26` `OperationParams`
  - commits: `99cbe6704` (PR #3237); `4f1459e54 feat(Attachment): render live upload progress on messages being sent` (PR #3295, `RetryHandler` takes `Omit<OperationParams<'retry'>, 'message'>`)
  - corpus: `docs/02-ui-components__08-message__04-message_hooks__4.tsx:7` TS2554 (`useRetryHandler(message)`)
- Docs impact:
  - `02-ui-components/08-message/04-message_hooks.md` (`useRetryHandler(message)`)
  - `02-ui-components/08-message/01-message.md`, `02-ui-components/07-message-list/01-message_list.md`, `02-ui-components/08-message/02-message_context.md` (`retrySendMessage`, `handleRetry`)
- Example needed: yes

Before (v14)

```tsx
import { useMessageContext, useRetryHandler } from 'stream-chat-react';

export const RetryButton = () => {
  const { message } = useMessageContext();
  const retry = useRetryHandler();
  return <button onClick={() => retry(message)}>Retry</button>;
};
```

After (v15)

```tsx
import { useMessageContext, useRetryHandler } from 'stream-chat-react';

export const RetryButton = () => {
  const { message } = useMessageContext();
  const retry = useRetryHandler();
  return <button onClick={() => retry({ localMessage: message })}>Retry</button>;
};
```

### BC-045: opening a thread from a message goes through workspace navigation; `openThread` is gone from the lists and does nothing without a navigation provider

- Status: confirmed
- Area: message thread opening
- User impact:
  - compile error on `MessageList.openThread`, `VirtualizedMessageList.openThread`, and reads of `VirtuosoContext.openThread`
  - compile error (`TS2554`) where code calls a `MessageProps['openThread']` without an event. A handler declared as `(message, event?) => void` still type-checks
  - **silent behavior change**: the default reply / reply-count action calls `useWorkspaceNavigation().openThread({ channel, message })`. Outside the `slot-layout` `ChatView` (or a `WorkspaceNavigationProvider`), that is the inert default and nothing opens. In v14, `Channel` handled it through `ChannelActionContext.openThread`.
- Old API:
  - `MessageList.openThread`, `VirtualizedMessageList.openThread`, `VirtuosoContext.openThread` (`ChannelActionContextValue['openThread']`, `(message, event?) => void`)
  - default thread opening via `ChannelActionContext.openThread` set up by `Channel`
- Replacement:
  - Recommended: render the app inside `ChatView` from `stream-chat-react/slot-layout`, whose navigation opens the thread into its `thread` slot (see BC-011 / BC-012 / BC-013).
  - Without `ChatView`: provide your own `WorkspaceNavigation` with `WorkspaceNavigationProvider` (spread `defaultWorkspaceNavigation` and implement `openThread` / `closeThread`). Resolve a `{ channel, message }` target with `client.threads.ensure({ channel, parentMessage })` and render `<Thread thread={thread}>`.
  - Per message: `Message.openThread` remains, typed `(message: LocalMessage, event: BaseSyntheticEvent) => void`. Lists no longer drill it, so it applies only to a `<Message>` you render yourself, where both the reply action and the reply-count button honor it: `MessageRepliesCountButton` without an `onClick` calls the message's `handleOpenThread`, as v14's `MessageUI` did by passing `onClick={handleOpenThread}` (`release-v14:src/components/Message/MessageUI.tsx:235-236`). Without an override, both fall back to `useWorkspaceNavigation().openThread`.
- Evidence:
  - `release-v14:src/components/Message/types.ts:60` `openThread?: ChannelActionContextValue['openThread']`; `release-v14:src/components/MessageList/MessageList.tsx:505` and `release-v14:src/components/MessageList/VirtualizedMessageList.tsx:88` drill `openThread`
  - `release-v14:src/components/Message/hooks/useOpenThreadHandler.ts:10` falls back to `useChannelActionContext().openThread`
  - `master:src/components/Message/types.ts:53` `openThread?: (message: LocalMessage, event: BaseSyntheticEvent) => void`
  - `master:src/components/Message/hooks/useOpenThreadHandler.ts:17` `useWorkspaceNavigation()`, `:32` `void openThread({ channel, message })`
  - `master:src/components/Message/MessageRepliesCountButton.tsx` falls back to `MessageContext.handleOpenThread` when it has no `onClick` (restored in `fix/v15-dead-surface-cleanup`; before that it called `useWorkspaceNavigation().openThread` directly and ignored `Message.openThread`)
  - `master:src/context/WorkspaceNavigationContext.tsx:145` `defaultWorkspaceNavigation`, `:157` `openThread: () => undefined`, `:165` `WorkspaceNavigationProvider`
  - `master:src/plugins/SlotLayout/ChatViewNavigationContext.tsx:114` `client.threads.ensure({ channel, parentMessage })`
  - commit: `99cbe6704` (PR #3237, "Thread open/close behavior is routed through `useChatViewNavigation()`")
- Docs impact:
  - `02-ui-components/01-getting_started.md`, `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/03-channel_action_context.md`
  - `02-ui-components/07-message-list/01-message_list.md`, `02-ui-components/07-message-list/02-virtualized_list.md`, `02-ui-components/08-message/01-message.md`
  - `02-ui-components/08-message/04-message_hooks.md` (`useOpenThreadHandler`)
- Example needed: yes (navigation-provider variant; the `ChatView` variant belongs to BC-012)

Before (v14)

```tsx
import { Channel, MessageComposer, MessageList, Thread, Window } from 'stream-chat-react';
import type { Channel as StreamChannel } from 'stream-chat';

export const ChannelWithThread = ({ channel }: { channel: StreamChannel }) => (
  <Channel channel={channel}>
    <Window>
      <MessageList />
      <MessageComposer />
    </Window>
    <Thread />
  </Channel>
);
```

After (v15)

```tsx
import { useMemo, useState } from 'react';
import { Thread as StreamThread } from 'stream-chat';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  defaultWorkspaceNavigation,
  MessageComposer,
  MessageList,
  Thread,
  useChatContext,
  type WorkspaceNavigation,
  WorkspaceNavigationProvider,
} from 'stream-chat-react';

export const ChannelWithThread = ({ channel }: { channel: StreamChannel }) => {
  const { client } = useChatContext();
  const [thread, setThread] = useState<StreamThread>();

  const navigation = useMemo<WorkspaceNavigation>(
    () => ({
      ...defaultWorkspaceNavigation,
      closeThread: () => setThread(undefined),
      openThread: (target) =>
        setThread(
          target instanceof StreamThread
            ? target
            : client.threads.ensure({
                channel: target.channel,
                parentMessage: target.message,
              }),
        ),
    }),
    [client],
  );

  return (
    <WorkspaceNavigationProvider value={navigation}>
      <Channel channel={channel}>
        <MessageList />
        <MessageComposer />
      </Channel>
      {thread && (
        <Thread thread={thread}>
          <MessageList />
          <MessageComposer />
        </Thread>
      )}
    </WorkspaceNavigationProvider>
  );
};
```

(Types and exports were checked against V15 source. The snippet has not been run in an app.)

### BC-046: list pagination and state props removed; the lists read the message paginator

- Status: confirmed
- Area: MessageList / VirtualizedMessageList
- User impact:
  - compile errors on the removed props
  - `internalInfiniteScrollProps` now feeds `InfiniteScrollPaginator`, not `InfiniteScroll`, so `InfiniteScroll`-only fields no longer compile
- Old API:
  - `MessageList`, removed: `loadMore`, `loadMoreNewer`, `loadingMoreForJumpToChannelMessage`, `hasMore`, `jumpToLatestMessage`, `loadingMoreNewer`, `messageLimit` (the last four stayed typed but unread on master until `fix/v15-dead-surface-cleanup` removed them; diff: `default-changed` `jumpToLatestMessage`, `messageLimit` -> none). `messages` is removed too; see BC-047.
  - `MessageList.loadingMore` stays. The `LoadingIndicator` in the row above the messages shows while an older page loads (`props.loadingMore ?? isLoadingOlder`); pass `loadingMore={false}` to hide it. Before `fix/v15-dead-surface-cleanup` it showed only when the prop was passed.
  - `MessageList.internalInfiniteScrollProps`: `Partial<InfiniteScrollProps>` -> `InternalPaginatorProps` (`hasNextPage`, `hasPreviousPage`, `head`, `initialLoad`, `isLoading`, `loader`, `loadNextPage`, `loadPreviousPage`, `reverse`, `LoadingIndicator` no longer accepted)
  - `VirtualizedMessageList`, removed: `hasMore`, `hasMoreNewer`, `loadingMore`, `loadingMoreNewer`, `loadMore`, `loadMoreNewer`, `messageLimit`, `highlightedMessageId`, `channelUnreadUiState`
- Replacement: both lists drive themselves from `(thread ?? channel).messagePaginator` (`channel` from `useChannel()`, `thread` from `useThreadContext()`). Code that drove these props should use the paginator directly:
  - older / newer page: `messagePaginator.toTail()` / `messagePaginator.toHead()`
  - has more: `messagePaginator.hasMoreTail` / `messagePaginator.hasMoreHead`
  - loading: `useStateStore(messagePaginator.state, (s) => ({ isLoading: s.isLoading }))`
  - jump: `messagePaginator.jumpToMessage(id)`, `messagePaginator.jumpToTheLatestMessage()`, `messagePaginator.jumpToTheFirstUnreadMessage()`. The highlight follows `messagePaginator.messageFocusSignal`, which replaces `highlightedMessageId`.
  - unread UI state: `messagePaginator.unreadStateSnapshot` (`UnreadSnapshotState`)
  - page size: configure the paginator through `client.config` (`channel.messagePaginator` / `thread.messagePaginator` declarative config); there is no per-list `messageLimit`
- Evidence:
  - `release-v14:src/components/MessageList/MessageList.tsx:541` `loadingMoreForJumpToChannelMessage`, `:545` `loadMore`, `:547` `loadMoreNewer`, `:551` `messageLimit`; `:265`–`:275` forward `messageLimit` to `loadMore`
  - `release-v14:src/components/MessageList/VirtualizedMessageList.tsx:678` `channelUnreadUiState`, `:701` `hasMore`, `:703` `hasMoreNewer`, `:714` `highlightedMessageId`, `:716` `loadingMore`, `:718` `loadingMoreNewer`, `:720` `loadMore`, `:722` `loadMoreNewer`, `:728` `messageLimit`
  - `master:src/components/MessageList/MessageList.tsx` `MessageListProps` keeps only `loadingMore` of these; `loadOlderMessages` raises `isLoadingOlder` only when a tailward page can load (`!isLoading && hasMoreTail`), and the loading row renders `(props.loadingMore ?? isLoadingOlder) && <LoadingIndicator />`. Before `fix/v15-dead-surface-cleanup` the type kept `hasMore`, `jumpToLatestMessage`, `loadingMoreNewer`, `messageLimit` unread, and the indicator required the prop.
  - `master:src/components/MessageList/MessageList.tsx:452` `InternalPaginatorProps`; `master:src/components/InfiniteScrollPaginator/InfiniteScrollPaginator.tsx:18` own props
  - `master:src/components/MessageList/VirtualizedMessageList.tsx:288` reads `messages`, `hasMoreNewer`, `isLoading` from `messagePaginator.state`
  - `node_modules/stream-chat/dist/types/pagination/paginators/MessageIntervalPaginator.d.ts:153` `messageFocusSignal`, `:279` `jumpToMessage`, `:280` `jumpToTheLatestMessage`; `MessagePaginator.d.ts:87` `unreadStateSnapshot`
  - commits: `99cbe6704` (PR #3237); `088c795c1 feat(Channel)!: …` (PR #3286, search jump through `messagePaginator.jumpToMessage`)
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md` (`loadMore`, `loadMoreNewer`, `loadingMore`, `messageLimit`, `jumpToLatestMessage`, `internalInfiniteScrollProps`)
  - `02-ui-components/07-message-list/02-virtualized_list.md` (`hasMore`, `hasMoreNewer`, `loadMoreNewer`, `messageLimit`, `highlightedMessageId`, `channelUnreadUiState`)
- Example needed: no

### BC-047: `MessageList.messages` / `VirtualizedMessageList.messages` are removed

- Status: confirmed
- Area: MessageList / VirtualizedMessageList
- User impact: compile error on `messages`. Both lists always render the active paginator's items. On master before `fix/v15-dead-surface-cleanup` the props still type-checked and were silently ignored, so a custom message array (filtered, reordered or synthetic) was dropped without an error.
- Old API:
  - `MessageList.messages` (v14 default `[]`, overriding `ChannelStateContext.messages`)
  - `VirtualizedMessageList.messages`
- Replacement: there is no prop that replaces the source. To change what is rendered, use `reviewProcessedMessage` (still applied by both lists), `hideDeletedMessages`, or a custom `renderMessages` (`MessageList`). To change the data, act on the paginator (`messagePaginator.ingestItem` / `removeItem`). Do not reorder; the paginator owns the sort order.
- Evidence:
  - `release-v14:src/components/MessageList/MessageList.tsx:104` `messages = []` read from props; `:605`–`:606` props spread over the channel state
  - `master:src/components/MessageList/MessageList.tsx` and `VirtualizedMessageList.tsx` read `messages` from `useStateStore(messagePaginator.state, …)` only; neither props type declares `messages` (removed in `fix/v15-dead-surface-cleanup`; before that both declared it and never read it).
  - diff: `default-changed MessageList.messages: [] => (none)`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md:52` and `02-ui-components/07-message-list/02-virtualized_list.md:38` (`messages={customMessages}`)
- Example needed: no

### BC-048: thread-specific list props `threadList` and `head` removed; lists detect the thread from context

- Status: confirmed
- Area: MessageList / VirtualizedMessageList / TypingIndicator / ScrollToLatestMessageButton
- User impact:
  - compile errors on `threadList` / `head` props, and in custom `TypingIndicator` / `ScrollToLatestMessageButton` overrides that destructure `threadList`, which the SDK no longer passes
  - in untyped overrides, `threadList` is `undefined`, so a thread-aware custom component behaves as if it were in the channel list
- Old API:
  - `MessageList.threadList`, `VirtualizedMessageList.threadList`, `VirtuosoContext.threadList`
  - `TypingIndicatorProps.threadList`, `ScrollToLatestMessageButtonProps.threadList`
  - `MessageList.head`, `VirtualizedMessageList.head` (the thread's parent message element)
- Replacement:
  - thread detection: `const thread = useThreadContext(); const isThreadList = !!thread;` (the SDK's own components do this)
  - parent message: both lists render it from `ThreadContext` via `useThreadHead()`. Override it with the `ThreadHead` slot: `<WithComponents overrides={{ ThreadHead: Custom }}>`, typed `React.ComponentType<MessageProps>`.
  - `VirtuosoContext.head` is now `ReactElement | null` and always present
- Evidence:
  - `release-v14:src/components/MessageList/MessageList.tsx:527` `head?`, `:578` `threadList?`
  - `release-v14:src/components/MessageList/VirtualizedMessageList.tsx:708` `head?`, `:776` `threadList?`
  - `release-v14:src/components/TypingIndicator/TypingIndicator.tsx:23` `threadList?`; `release-v14:src/components/MessageList/ScrollToLatestMessageButton.tsx:19` `threadList?`
  - `master:src/components/TypingIndicator/TypingIndicator.tsx:36`–`:40` props are `isMessageListScrolledToBottom?`, `scrollToBottom?`
  - `master:src/components/MessageList/hooks/useThreadHead.tsx:19` `useThreadHead` reads `ThreadHead` from `ComponentContext`; `master:src/context/ComponentContext.tsx:294` `ThreadHead?`
  - `master:src/components/MessageList/VirtualizedMessageList.tsx:256` `useThreadHead()`, `:631` `head: threadHead`
  - commits: `c2136f307 refactor!: align Thread with Channel - instance prop, provider, children` (PR #3289, "the `head` prop is removed"); `99cbe6704` (PR #3237)
  - corpus: `docs/03-ui-cookbook__05-message-composer__07-typing_indicator__1.tsx:14` TS2339 (`threadList` not on `TypingIndicatorProps`)
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md`, `02-ui-components/07-message-list/02-virtualized_list.md` (`threadList`, `head`)
  - `02-ui-components/12-indicators.md`, `03-ui-cookbook/05-message-composer/07-typing_indicator.md` (`threadList`)
  - `02-ui-components/08-message/01-message.md`, `02-ui-components/08-message/02-message_context.md`, `03-ui-cookbook/04-message/01-message_ui.md` mention `threadList`, which is still a `Message` / `MessageContext` field; only the list-level prop is gone, so check each mention
- Example needed: no (see BC-004 for a custom `TypingIndicator`)

### BC-049: `disableDateSeparator` renamed to `withDateSeparator` (inverted)

- Status: confirmed
- Area: MessageList / VirtualizedMessageList / processMessages
- User impact: compile error on `disableDateSeparator`. In untyped code it is ignored and the default applies (`MessageList` shows separators, `VirtualizedMessageList` does not). A custom `reviewProcessedMessage` that reads `context.enableDateSeparator` now gets `undefined`.
- Old API:
  - `MessageList.disableDateSeparator` (default `false`), `VirtualizedMessageList.disableDateSeparator` (default `true`)
  - `ProcessMessagesParams.enableDateSeparator` (also on the `context` handed to `reviewProcessedMessage`), `useEnrichedMessages({ disableDateSeparator })`
- Replacement: `withDateSeparator`. Defaults: `MessageList` `true`, `VirtualizedMessageList` `false`. `processMessages` / `reviewProcessedMessage` context field: `withDateSeparator`. Thread lists: `Thread.enableDateSeparator` is gone (Thread area), so a `MessageList` inside a thread now shows separators unless you pass `withDateSeparator={false}`.
- Evidence:
  - `release-v14:src/components/MessageList/MessageList.tsx:87` `disableDateSeparator = false`, `:515` prop
  - `release-v14:src/components/MessageList/VirtualizedMessageList.tsx:209` `disableDateSeparator = true`, `:304` `enableDateSeparator: !disableDateSeparator`
  - `release-v14:src/components/MessageList/utils.ts:28` `enableDateSeparator?`
  - `master:src/components/MessageList/MessageList.tsx:526` `withDateSeparator?`, default `true` in `MessageListWithContext`
  - `master:src/components/MessageList/VirtualizedMessageList.tsx:803` `withDateSeparator?`, default `false` (`:252`)
  - `master:src/components/MessageList/utils.ts:49` `withDateSeparator?` in `ProcessMessagesContext`
  - commit: `c2136f307` (PR #3289)
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md`, `02-ui-components/07-message-list/02-virtualized_list.md`, `02-ui-components/08-message/13-date_separator.md`
- Example needed: yes

Before (v14)

```tsx
import { MessageList, VirtualizedMessageList } from 'stream-chat-react';

export const Lists = () => (
  <>
    <MessageList disableDateSeparator />
    <VirtualizedMessageList disableDateSeparator={false} />
  </>
);
```

After (v15)

```tsx
import { MessageList, VirtualizedMessageList } from 'stream-chat-react';

export const Lists = () => (
  <>
    <MessageList withDateSeparator={false} />
    <VirtualizedMessageList withDateSeparator />
  </>
);
```

### BC-050: `AIStates` is exported by `stream-chat`, not `stream-chat-react`

- Status: confirmed
- Area: AIStateIndicator
- User impact: compile error `TS2305` on the import. Its values are unchanged, but it is now `as const`, so an inferred array of its members no longer accepts the wide `AIState` returned by `useAIState` (`.includes(aiState)` fails to compile). `useAIState(channel)` keeps its signature but reads `channel.state`'s `aiState` slice instead of its own event subscriptions, so it now also resets to `Idle` when the client drops the connection or the channel is unwatched (`channel.state.resetAIState()`). v14 already handled `ai_indicator.update` / `.clear` / `.stop`.
- Old API:
  - `import { AIStates } from 'stream-chat-react'`
- Replacement: `import { AIStates } from 'stream-chat'`. Widen arrays explicitly: `const VISIBLE: readonly AIState[] = [AIStates.Thinking, AIStates.Generating];`
- Evidence:
  - `release-v14:src/components/AIStateIndicator/hooks/useAIState.ts:4` `export const AIStates = { … }` (untyped object)
  - `master:src/components/AIStateIndicator/hooks/useAIState.ts` `import { AIStates } from 'stream-chat'`; reads `useStateStore(channel?.state, aiStateSelector)`
  - `node_modules/stream-chat/dist/types/types.d.ts:221` `export declare const AIStates: { readonly Error: "AI_STATE_ERROR"; … }`
  - commit: `f66597a13` (PR #3273, "`AIStates` is no longer exported from `stream-chat-react`")
  - examples: `examples.diff:463`–`:487` (vite example switches the import and widens the array)
  - corpus: `docs/04-guides__16-ai-integrations__01-overview__9.tsx:5`, `docs/04-guides__16-ai-integrations__01-overview__10.tsx:4` (TS2305)
- Docs impact:
  - `04-guides/16-ai-integrations/01-overview.md`, `04-guides/16-ai-integrations/03-ai-hooks.md`
- Example needed: yes

Before (v14)

```tsx
import { AIStates, useAIState } from 'stream-chat-react';
import type { Channel } from 'stream-chat';

export const Stop = ({ channel }: { channel: Channel }) => {
  const { aiState } = useAIState(channel);
  return [AIStates.Thinking, AIStates.Generating].includes(aiState) ? (
    <button>Stop</button>
  ) : null;
};
```

After (v15)

```tsx
import { AIStates, type AIState, type Channel } from 'stream-chat';
import { useAIState } from 'stream-chat-react';

const STOPPABLE: readonly AIState[] = [AIStates.Thinking, AIStates.Generating];

export const Stop = ({ channel }: { channel: Channel }) => {
  const { aiState } = useAIState(channel);
  return STOPPABLE.includes(aiState) ? <button>Stop</button> : null;
};
```

### BC-051: `WithAudioPlayback.allowConcurrentPlayback` removed; one voice message plays at a time, app-wide

- Status: confirmed
- Area: AudioPlayback
- User impact: compile error on the prop. Behavior: playback is exclusive across every surface inside a `Chat` (a channel and a thread side by side no longer play together), even if you passed `true` before. `useActiveAudioPlayer()` reports the app-wide active player.
- Old API:
  - `WithAudioPlaybackProps.allowConcurrentPlayback` (and `ChannelProps.allowConcurrentAudioPlayback`, `release-v14:src/components/Channel/Channel.tsx:98,1267`)
- Replacement: none, so delete the prop. A custom `WithAudioPlayback` joins the shared arbiter that `Chat` provides automatically. Pass the new optional `playbackScope` if the provider outlives the entity it plays for; changing it stops and clears that provider's players.
- Evidence:
  - `release-v14:src/components/AudioPlayback/WithAudioPlayback.tsx:13` `allowConcurrentPlayback?: boolean`, `:24` `new AudioPlayerPool({ allowConcurrentPlayback })`
  - `master:src/components/AudioPlayback/WithAudioPlayback.tsx:26` `playbackScope?: unknown`, `:52` `WithAudioPlayback`; `master:src/components/Chat/Chat.tsx:179` `<SharedAudioPlaybackProvider>`
  - `master:src/components/AudioPlayback/WithAudioPlayback.tsx:153` `useActiveAudioPlayer` reads the pool state, which is now `StateStore<AudioPlaybackArbiterState>` (diff, referenced type `AudioPlayerPool`)
  - commit: `68999a7b3 feat(AudioPlayback)!: play one voice message at a time, across the whole app` (PR #3287)
  - corpus: `docs/04-guides__15-audio-playback__1.tsx:7` TS2322
  - Guide correction: `ai-migration-v14-v15.md` lists `ThreadProps.allowConcurrentAudioPlayback`, which v14 `Thread` never had.
- Docs impact:
  - `04-guides/15-audio-playback.md` (`allowConcurrentPlayback`, `useActiveAudioPlayer`)
  - `02-ui-components/04-channel/01-channel.md` (`allowConcurrentAudioPlayback`)
- Example needed: no (delete the prop)

### BC-052: `usePinHandler` no longer returns `canPin`

- Status: confirmed
- Area: message hooks
- User impact: compile error on destructuring `canPin`. In untyped code it is `undefined`, so a pin button gated on it never shows.
- Old API:
  - `usePinHandler(message): { canPin: boolean; handlePin }`
- Replacement: `useUserRole(message).canPin` (newly returned). `usePinHandler(message, notifications?)` now returns `{ handlePin }`.
- Evidence:
  - `release-v14:src/components/Message/hooks/usePinHandler.ts:8`, `:54` `return { canPin, handlePin }`
  - `master:src/components/Message/hooks/usePinHandler.ts:43`, `:110` `return { handlePin }`; `master:src/components/Message/hooks/useUserRole.ts:45` `canPin = channelCapabilities.has('pin-message')`, `:62`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/08-message/04-message_hooks.md` (`usePinHandler`, `useUserRole`)
- Example needed: no

### BC-053: `VirtuosoContext` (context of `additionalVirtuosoProps.components`) reshaped

- Status: confirmed
- Area: VirtualizedMessageList
- User impact: compile errors in custom Virtuoso components (`Header`, `Footer`, `EmptyPlaceholder`, `Item`, …) that read the removed fields. Checks written as `=== undefined` miss the new `null` values, and `lastReadDate` is now unix nanoseconds.
- Old API:
  - removed: `VirtuosoContext.Message`, `.messageActions`, `.openThread`, `.threadList`
  - optional and `undefined`-valued in v14: `head`, `firstUnreadMessageId`, `lastReadDate: Date`, `lastReadMessageId`, `loadingMore`, `unreadMessageCount`
- Replacement: `VirtuosoContext` now carries a required `channel: Channel`. `head`, `firstUnreadMessageId`, `lastReadMessageId` are `… | null`; `lastReadDate` is `TimestampNS | null`; `loadingMore: boolean`; `unreadMessageCount: number`; `focusedMessageId?` is new. For thread detection use `useThreadContext()` (BC-048); for the message UI use the slots (BC-042).
- Evidence:
  - `release-v14:src/components/MessageList/VirtualizedMessageList.tsx:94`–`:103` (`'head' | 'loadingMore' | 'Message' | 'threadList'` picked into the context), `:108` `VirtuosoContext`
  - `master:src/components/MessageList/VirtualizedMessageList.tsx:93`–`:146`
  - commits: `07664893e` (PR #3268), `b541c45f9` (PR #3288), `c2136f307` (PR #3289), `aaa7fa31e feat!: adopt stream-chat's branded TimestampNS` (PR #3297)
- Docs impact:
  - none found (`VirtuosoContext` is not documented in v14 docs)
- Example needed: no

### BC-054: custom `renderMessages` receives a different `RenderMessagesOptions`; `ChannelUnreadUiState` removed

- Status: confirmed
- Area: MessageList
- User impact: compile errors in a custom `renderMessages` that reads the old unread fields. At runtime the old field names are `undefined`, so a hand-rolled unread separator never renders.
- Old API:
  - `RenderMessagesOptions.channelUnreadUiState?: ChannelUnreadUiState` (the v14 read-state shape: `first_unread_message_id`, `last_read`, `last_read_message_id`, `unread_messages`)
  - `ChannelUnreadUiState` type export
  - `getIsFirstUnreadMessage({ firstUnreadMessageId, isFirstMessage, lastReadDate, lastReadMessageId, message, previousMessage, unreadMessageCount })`
- Replacement: `RenderMessagesOptions.channel: Channel` (required, new). `channelUnreadUiState: UnreadSnapshotState` (required) has `firstUnreadMessageId`, `lastReadAt` (`TimestampNS`), `lastReadMessageId`, `unreadCount`, and `focusedMessageId?` is new. `getIsFirstUnreadMessage` takes `UnreadSnapshotState & { channel?, isFirstMessage, message, previousMessage? }` and returns `false` without a `channel` or inside a thread. Also, the default renderer no longer places the unread separator before a system message (system messages now short-circuit before the unread check).
- Evidence:
  - `release-v14:src/components/MessageList/renderMessages.tsx:35` `channelUnreadUiState?: ChannelUnreadUiState`; `release-v14:src/types/types.ts` `ChannelUnreadUiState = Omit<ValuesType<StreamChannelState['read']>, 'user'>`; `release-v14:src/components/MessageList/utils.ts:348`
  - `master:src/components/MessageList/renderMessages.tsx:19`, `:20` `channel`, `:26` `channelUnreadUiState: UnreadSnapshotState`; `master:src/components/MessageList/utils.ts:369`–`:388`
  - `node_modules/stream-chat/dist/types/pagination/paginators/MessagePaginator.d.ts:49` `UnreadSnapshotState`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md` (`renderMessages`)
  - `04-guides/05-channel_read_state.md`, `02-ui-components/07-message-list/02-virtualized_list.md` (`channelUnreadUiState`)
- Example needed: no

### BC-055: exported low-level MessageList hooks and utils changed signature

- Status: confirmed
- Area: MessageList internals (exported)
- User impact: compile errors only for code that calls these directly (custom list implementations).
- Old API:
  - `useEnrichedMessages({ disableDateSeparator, headerPosition?: number, … })`
  - `useNewMessageNotification(messages, currentUserId, hasMoreNewer?)`
  - `useScrollLocationLogic({ disableAutoScrollToBottom?, disableScrollManagement?, listElement: HTMLDivElement | null, suppressAutoscroll: boolean, … })`; `onScroll` typed for `HTMLDivElement`; `scrollToBottom(options?: ScrollToOptions)`
  - `areMessagePropsEqual(prev, next)` compared `Message`, `messageActions` and `mutes`
  - `MessageListContextValue.listElement: HTMLDivElement | null`
- Replacement: `useEnrichedMessages({ withDateSeparator, headerPosition?: TimestampNS, … })`; `useNewMessageNotification(messages, currentUserId)`; `useScrollLocationLogic` without the two `disable*` flags, `listElement: HTMLElement | null`, `suppressAutoscroll?`, `scrollToBottom(options?: { behavior?: ScrollBehavior })`; `areMessagePropsEqual` ignores the removed props; `listElement: HTMLElement | null`.
- Evidence:
  - diff `components/MessageList`: `signature-changed useEnrichedMessages`, `useNewMessageNotification`; `member-removed UseScrollLocationLogicParams.disableAutoScrollToBottom` / `.disableScrollManagement`; `components/Message`: `signature-changed areMessagePropsEqual`
  - `release-v14:src/components/MessageList/hooks/MessageList/useScrollLocationLogic.tsx:44`, `:46`
  - `master:src/components/Message/utils.tsx` `areMessagePropsEqual` (no `Message` / `messageActions` / `mutes`); `master:src/context/MessageListContext.tsx` `listElement: HTMLElement | null`
  - commits: `99cbe6704` (PR #3237), `07664893e` (PR #3268), `c2136f307` (PR #3289)
- Docs impact:
  - none found
- Example needed: no

### BC-056: `MessageList.headerPosition` / `insertIntro` take unix nanoseconds (`TimestampNS`)

- Status: confirmed
- Area: MessageList
- User impact: compile error when passing a millisecond `number`. With a cast, the header lands at the wrong position, because the value is compared against `message.created_at`, which is now in nanoseconds.
- Old API:
  - `MessageList.headerPosition?: number` (epoch ms), `insertIntro(messages, headerPosition?: number)`
- Replacement: pass `TimestampNS`, e.g. `message.created_at` or `msToNs(ms)` from `stream-chat`. Related: `ProcessMessagesParams.lastRead` is `TimestampNS | null` (was `Date | null`), and `VirtuosoContext.lastReadDate` is covered by BC-053.
- Evidence:
  - `release-v14:src/components/MessageList/MessageList.tsx:529` `headerPosition?: number`; `release-v14:src/components/MessageList/utils.ts:205` `insertIntro(…, headerPosition?: number)`
  - `master:src/components/MessageList/MessageList.tsx:474` `headerPosition?: TimestampNS`; `master:src/components/MessageList/utils.ts:221`–`:223`
  - `node_modules/stream-chat/dist/types/index.d.ts` exports `msToNs`, `asTimestampNS`, `nowNs`
  - commits: `cb472c35f feat!: move to timestamps in response models` (PR #3278); `aaa7fa31e` (PR #3297)
- Docs impact:
  - `02-ui-components/07-message-list/01-message_list.md` (`headerPosition`)
- Example needed: no

### BC-057: `DateSeparatorMessage` (in the `RenderedMessage` union) lost `type`; `unread` is optional

- Status: confirmed
- Area: MessageList
- User impact: compile error on reading `.type` from a date-separator entry (it was never populated at runtime, so it was always `undefined`). `unread` is now typed optional. At runtime it was already absent on plain day separators in v14, which only typed it as required.
- Old API:
  - `DateSeparatorMessage.type: MessageLabel`, `DateSeparatorMessage.unread: boolean`
- Replacement: narrow with `isDateSeparatorMessage(message)` and treat `unread` as optional.
- Evidence:
  - `release-v14:src/components/MessageList/utils.ts:14`–`:20`
  - `master:src/components/MessageList/utils.ts:20`–`:36`
  - commit: `cb472c35f` (PR #3278)
- Docs impact:
  - none found
- Example needed: no

### BC-058: a standalone `<Message>` needs a channel in context; `highlighted` is no longer derived from channel state

- Status: confirmed
- Area: Message
- User impact: **runtime error**. In v15, `Message` resolves its channel with `useChannel()`, which throws `The useChannel hook could not resolve a channel…` when there is no `Channel` / `Thread` / `ChannelInstanceProvider` ancestor. In v14 the missing contexts only warned. Wrapping a preview `<Message>` in `ChannelStateProvider` / `ChannelActionProvider` no longer compiles (those exports are removed; the related entries). Also, a `<Message>` rendered outside the lists no longer becomes highlighted from `ChannelStateContext.highlightedMessageId`; pass `highlighted` yourself.
- Old API:
  - `<ChannelActionProvider><ChannelStateProvider><Message … /></…></…>`, or `<Message>` with no channel context
  - implicit `highlighted` from `useChannelStateContext().highlightedMessageId`
- Replacement: wrap it in `<ChannelInstanceProvider value={{ channel }}>` (any real `stream-chat` `Channel`, e.g. `client.channelManager.ensure({ id, type })`), or render it inside `<Channel channel={…}>` / `<Thread thread={…}>`. Pass `highlighted` explicitly when needed (`MessageProps.highlighted?: boolean`).
- Evidence:
  - `master:src/context/useChannel.ts` throws when neither a thread nor `ChannelInstanceContext` supplies a channel
  - `master:src/components/Message/hooks/useOpenThreadHandler.ts:16` and `master:src/components/Message/hooks/useRetryHandler.ts:11` call `useChannel()` during every `Message` render
  - `release-v14:src/components/Message/Message.tsx` `const highlighted = highlightedMessageId === message.id` from `useChannelStateContext('Message')`; `master:src/components/Message/Message.tsx` `highlighted={props.highlighted}`; `master:src/components/Message/types.ts:33`
  - examples: `examples.diff:9258`–`:9322` (`ReactionsTab.tsx` swaps the two providers for `ChannelInstanceProvider` with `client.channelManager.ensure(...)`)
  - corpus: `examples/examples/vite/src/AppSettings/tabs/Reactions/ReactionsTab.tsx:3`, `:4` TS2724
  - commits: `99cbe6704` (PR #3237), `9194215f0` (PR #3267)
- Docs impact:
  - none found for a standalone `Message`
- Example needed: no (the examples hunk is the reference)

### BC-059: the gallery header renders the `MessageTimestamp` override only for items that carry their message

- Status: confirmed
- Area: Gallery
- User impact:
  - The gallery renders outside any `MessageProvider`, so the header reads the item, not the surrounding message. When `ComponentContext.MessageTimestamp` is overridden and the item carries its `message`, the header renders the override (`customClass='str-chat__gallery__timestamp'`, `message={item.message}`). Otherwise it renders its own timestamp through the `timestamp.GalleryTimestamp` key.
  - `ModalGallery` and the channel-detail media view fill `GalleryItem.message`. Items you build yourself need it for the override to apply.
  - On master before `fix/v15-dead-surface-cleanup`, the header never used the override.
- Old API:
  - `GalleryHeader` rendered `ComponentContext.MessageTimestamp` from the surrounding `MessageContext`
- Replacement: none needed for the default galleries. For hand-built gallery items, set `message` on each `GalleryItem` (new optional field). To change only the format, use the `timestamp.GalleryTimestamp` translation key. `MessageTimestamp` renders from its `message` prop outside a `MessageProvider`; without the prop it still requires one.
- Evidence:
  - `release-v14:src/components/Gallery/GalleryHeader.tsx:23`, `:24`, `:50`
  - `master:src/components/Gallery/GalleryHeader.tsx` `{MessageTimestamp && message ? <MessageTimestamp … /> : <GalleryTimestamp createdAt={createdAt} />}`; `master:src/components/Gallery/GalleryContext.tsx` `GalleryItem.message?: LocalMessage`; `master:src/components/Attachment/ModalGallery.tsx` and `master:src/plugins/ChannelDetail/Views/ChannelMediaView/ChannelMediaView.utils.ts` fill it
  - commits: `9194215f0` (PR #3267, which dropped the override); `fix/v15-dead-surface-cleanup` (restores it for items carrying a message)
- Docs impact:
  - none found
- Example needed: no

## Message composer

### BC-060: `MessageComposer.overrideSubmitHandler` was removed

- Status: confirmed
- Area: message composer
- User impact: compile error (`TS2339` / `TS2322`) on the prop or on `MessageComposerProps['overrideSubmitHandler']`. In plain JS the prop is ignored silently, so the custom send path stops running and messages go out through the default request.
- Old API:
  - `MessageComposer.overrideSubmitHandler` / `MessageComposerProps.overrideSubmitHandler`: `(params: { cid; localMessage; message; sendOptions }) => Promise<void> | void`
  - `MessageComposerContextValue.overrideSubmitHandler` (and the same field on `useMessageComposerContext()`)
- Replacement: two options, depending on what the override did.
  - To replace or wrap the outgoing request, register a `sendMessageRequest` handler under `channel.requestHandlers` (it also covers thread replies; `thread.requestHandlers` accepts only `markReadRequest`). For example: `client.config.set({ channel: { requestHandlers: { sendMessageRequest } } })`. The handler type is `OperationRequestFn<'send'>`: `(params: { localMessage; message?; options? }, defaultRequest) => Promise<{ message: MessageResponse }>`. Call `defaultRequest(params)` to fall through to the default request, offline queue included. The cid is `params.localMessage.cid`.
  - To change the composed message, register composition middleware on the composer (unchanged LLC API).
  - Semantic differences:
    1. The v14 override replaced the whole send, so the integrator also owned the optimistic insert. The v15 handler replaces only the request: the LLC still inserts the message optimistically and reconciles it.
    2. Registration is per client, not per mounted `MessageComposer`.
    3. Like v14, the handler does not see edits. Edits go through `updateMessageRequest`.
- Evidence:
  - `release-v14:src/components/MessageComposer/MessageComposer.tsx:87`: `overrideSubmitHandler?: (params: { cid; localMessage; message; sendOptions }) => Promise<void> | void`
  - `release-v14:src/components/MessageComposer/hooks/useSubmitHandler.ts:87-96`: calls `overrideSubmitHandler(...)` instead of `ChannelActionContext.sendMessage`
  - `master:src/components/MessageComposer/MessageComposer.tsx:36-78`: `MessageComposerProps` has no `overrideSubmitHandler`, and `useSubmitHandler.ts` is deleted
  - `master:node_modules/stream-chat/src/channel.ts:115-122`: `ChannelConfig.requestHandlers.sendMessageRequest?: OperationRequestFn<'send'>`
  - `master:node_modules/stream-chat/src/messageOperations/types.ts:36-55`: `OperationParams` / `OperationRequestFn` signatures
  - `master:node_modules/stream-chat/src/configuration/types.ts:115-140`: `ChannelDeclarativeConfig.requestHandlers` / `ThreadDeclarativeConfig.requestHandlers` (`markReadRequest` only)
  - commit: `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237)
  - corpus: `docs/02-ui-components__09-message-composer__01-message_composer__4.tsx:6` TS2339, `:12` TS2322
- Docs impact:
  - `02-ui-components/09-message-composer/01-message_composer.md` (props table and the `overrideSubmitHandler` example at line ~118)
- Example needed: yes
- Notes for the guide:
  - `ai-migration-v14-v15.md` § "`overrideSubmitHandler` prop → removed" says submission runs `messageComposer.compose()` → `channel.sendMessageWithLocalUpdate()`. That method does not exist in `stream-chat@10.0.0-rc.22`. The path is `messageComposer.send()` → `defaultSubmitTarget.messageOperations.send()` (`node_modules/stream-chat/src/messageComposer/messageComposer.ts:1350-1377`).
  - The guide also omits `defaultRequest`, the handler's second argument.

Before (v14):

```tsx
import { MessageComposer, type MessageComposerProps } from 'stream-chat-react';

const overrideSubmitHandler: MessageComposerProps['overrideSubmitHandler'] = async ({
  cid,
  localMessage,
  message,
  sendOptions,
}) => {
  await myBackend.send({ cid, localMessage, message, sendOptions });
};

export const Composer = () => (
  <MessageComposer overrideSubmitHandler={overrideSubmitHandler} />
);
```

After (v15):

```tsx
import { MessageComposer } from 'stream-chat-react';

// once, where the client is created
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

### BC-061: `MessageComposer.preventClearingOnUnmount` was removed; a supplied composer is never cleared on unmount

- Status: confirmed
- Area: message composer
- User impact:
  - compile error (`TS2322`) on the prop.
  - silent behavior change: a composer supplied through `MessageComposerControllerProvider` is no longer cleared when `MessageComposer` unmounts. v14 cleared it unless the prop was set.
- Old API:
  - `MessageComposer.preventClearingOnUnmount` / `MessageComposerProps.preventClearingOnUnmount`
  - `MessageComposerContextValue.preventClearingOnUnmount` (and on `useMessageComposerContext()`)
- Replacement: drop the prop. `MessageComposer` now saves a draft for every composer on unmount (`createDraft()` skips edits and draft-disabled composers). It clears only the thread's or channel's own composer, which it did in v14 too. If your code relied on unmount clearing a supplied composer, call `composer.clear()` yourself when your UI is done with it. `MessageComposerControllerProvider` keeps its v14 signature (`{ messageComposerController?: MessageComposer }`) and is still a root export, now from `src/context/MessageComposerControllerContext.tsx`.
- Evidence:
  - `release-v14:src/components/MessageComposer/MessageComposer.tsx:105-108`: the prop. `:123-138` is the unmount effect, which clears any composer unless `props.preventClearingOnUnmount` is set. It also skips draft and clear entirely for a `channel.disconnected` channel.
  - `master:src/components/MessageComposer/MessageComposer.tsx:91-104`: the unmount effect returns before `clear()` when `messageComposer === suppliedComposer`.
  - `master:src/context/MessageComposerControllerContext.tsx:14-27`: `MessageComposerControllerProvider` / `useMessageComposerControllerContext`
  - commit: `14e58601f feat(MessageComposer)!: let integrators supply the composer MessageComposer edits` (PR #3299, `BREAKING CHANGE` footer)
  - corpus: `examples/examples/vite/src/InlineEditMessage/InlineEditMessage.tsx:95` TS2322
  - examples.diff: `examples/vite/src/InlineEditMessage/InlineEditMessage.tsx` replaces `<MessageComposer preventClearingOnUnmount />` with `<MessageComposer />` under `MessageComposerControllerProvider`
- Docs impact:
  - none in v14 docs (the prop was undocumented). The migration guide already has a section.
- Example needed: yes

Before (v14):

```tsx
import { MessageComposer, MessageComposerControllerProvider } from 'stream-chat-react';
import type { MessageComposer as Composer } from 'stream-chat';

export const InlineEditor = ({ composer }: { composer: Composer }) => (
  <MessageComposerControllerProvider messageComposerController={composer}>
    <MessageComposer preventClearingOnUnmount />
  </MessageComposerControllerProvider>
);
```

After (v15):

```tsx
import { MessageComposer, MessageComposerControllerProvider } from 'stream-chat-react';
import type { MessageComposer as Composer } from 'stream-chat';

export const InlineEditor = ({ composer }: { composer: Composer }) => (
  <MessageComposerControllerProvider messageComposerController={composer}>
    <MessageComposer />
  </MessageComposerControllerProvider>
);
// When the edit is abandoned, discard it yourself: composer.clear();
```

### BC-062: `handleSubmit` was removed from `MessageComposerContext` and `useMessageComposerBindings`; submit with `useMessageComposerSubmitFn()` or `messageComposer.send()` / `update()`

- Status: confirmed
- Area: message composer
- User impact:
  - compile error (`TS2339`) when destructuring `handleSubmit`.
  - In plain JS `handleSubmit` is `undefined`, so a custom send button wired to it does nothing (`onClick={undefined}`).
  - Custom composer UIs that submitted via `useChannelActionContext().sendMessage(composition)` / `editMessage(...)` also lose that path; the context is removed (see BC-003).
- Old API:
  - `MessageComposerContextValue.handleSubmit` / `useMessageComposerContext().handleSubmit`: `(event?: React.BaseSyntheticEvent) => void`
  - `UseMessageComposerBindingsParams.handleSubmit` / `useMessageComposerBindings(props).handleSubmit`
  - pattern: `const composition = await composer.compose(); composer.clear(); await useChannelActionContext().sendMessage(composition)` in custom composer UIs (v14 AI-integration guide)
- Replacement:
  - `useMessageComposerSubmitFn()`, exported from the root. It returns `() => Promise<MessageComposerSubmitResult>`, which calls `messageComposer.update()` while a message is being edited and `messageComposer.send()` otherwise, decided at submit time. The default send button and the Enter key use it. The audio recorder calls `messageComposer.send` directly. It is assignable to `SendButton`'s `sendMessage` prop.
  - Code that holds the composer can call `messageComposer.send()` / `messageComposer.update()` directly. Both compose, release the composer, send, never reject, and resolve to `'sent' | 'nothing-to-send' | 'failed'`.
- Evidence:
  - `release-v14:src/components/MessageComposer/hooks/useMessageComposerBindings.ts:10`: `handleSubmit: (event?: React.BaseSyntheticEvent) => void`, created by `useSubmitHandler(props)` at `:24`
  - `release-v14:src/components/MessageComposer/MessageComposerActions.tsx:62,74,76`: `<SendButton sendMessage={handleSubmit} />`
  - `master:src/components/MessageComposer/hooks/useMessageComposerBindings.ts:8-12`: `UseMessageComposerBindingsParams = { onPaste; recordingController; textareaRef }`
  - `master:src/components/MessageComposer/hooks/useMessageComposerSubmitFn.ts:10-18`: the new hook
  - `master:src/components/MessageComposer/MessageComposerActions.tsx:74,85,87`, `master:src/components/TextareaComposer/TextareaComposer.tsx:168,313`
  - `master:node_modules/stream-chat/src/messageComposer/messageComposer.ts:121` (`MessageComposerSubmitResult`), `:1350` (`send`), `:1385` (`update`)
  - commit: `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237); `14e58601f feat(MessageComposer)!: ...` (PR #3299) added `useMessageComposerSubmitFn`
  - corpus: none flagged for `handleSubmit`; the corpus checker did not report the snippets below, so this is confirmed from source only. `docs/04-guides__16-ai-integrations__02-chat-sdk-integration__7.tsx:8` TS2724 (`useChannelActionContext`) is the `sendMessage(composition)` pattern.
  - examples.diff: `examples/ai-chatbot/src/components/MessageInputBar/MessageInputBar.tsx` replaces `await sendMessage(composedData)` with `const result = await composer.send()`
- Docs impact:
  - `02-ui-components/09-message-composer/02-message_composer_context.md` (example at lines 20-25 and the `handleSubmit` table row at line 40)
  - `02-ui-components/09-message-composer/03-message_composer_hooks.md` (line 22, `useMessageComposerBindings` return list)
  - `02-ui-components/09-message-composer/04-input_ui.md` (lines 76, 97)
  - `03-ui-cookbook/05-message-composer/01-input_ui.md` (lines 34, 39)
  - `04-guides/16-ai-integrations/02-chat-sdk-integration.md` (custom `AIMessageComposer` submit, line ~224)
- Example needed: yes

Before (v14):

```tsx
import {
  SendButton,
  TextareaComposer,
  useMessageComposerContext,
} from 'stream-chat-react';

export const CompactInput = () => {
  const { handleSubmit } = useMessageComposerContext();
  return (
    <div className='compact-input'>
      <TextareaComposer />
      <SendButton sendMessage={handleSubmit} />
    </div>
  );
};
```

After (v15):

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

### BC-063: a failed send or edit no longer restores the composer

- Status: confirmed
- Area: message composer (behavior)
- User impact: silent behavior change. This affects every `MessageComposer`, with no code change on the integrator's side.
  - v14 send: cleared the composer, and on a failed request restored the full pre-send snapshot (text, attachments, link previews, poll, custom data) into it and showed an error notification.
  - v14 edit: kept the edit in the composer when the update request failed.
  - v15: the composer is released before the request for both sends and edits, and nothing is put back. The failed message (or edit) stays in the message list marked `failed`, where the user retries it.
  - The error notification now comes from the LLC (`client.notifications.addError`, type `api:message:send:failed` / `api:message:update:failed` (`CORE_NOTIFICATION_TYPE.messageSendFailed` / `.messageUpdateFailed`)), translated through `notification.messageSendFailed` / `notification.messageUpdateFailed`.
- Old API:
  - default `MessageComposer` submit (`useSubmitHandler`, internal in v14)
- Replacement: none needed. A custom UI that reopens or restores state after submitting must branch on the `MessageComposerSubmitResult`. On `'nothing-to-send'` the composer keeps its content. On `'failed'` the composer has already been released and the content is on the failed message.
- Evidence:
  - `release-v14:src/components/MessageComposer/hooks/useSubmitHandler.ts:11-28` (`takeStateSnapshot`), `:64,98`: `restoreComposerStateSnapshot()` on send failure; `:46-62`: on edit failure only a notification, with `clear()` running only on success
  - `master:node_modules/stream-chat/src/messageComposer/messageComposer.ts:1350-1377`: `send()` calls `releaseSubmittedComposition()` before the request; the catch comment reads "Nothing is put back"
  - `master:node_modules/stream-chat/src/messageComposer/messageComposer.ts:1385-1425`: `update()` follows the same pattern
  - `master:src/i18n/TranslationBuilder/notifications/translatorsByNotificationType.ts:49-52`
  - commit: `4f1459e54 feat(Attachment): render live upload progress on messages being sent` (PR #3295; its `BREAKING CHANGE` footer covers the send/update result and the notification keys)
- Docs impact:
  - none found in v14 docs (the restore-on-failure behavior was undocumented)
- Example needed: no

### BC-064: `useAttachmentManagerState().hasCustomDoUploadRequest` was replaced by `customCdn`

- Status: confirmed
- Area: message composer hooks
- User impact:
  - compile error (`TS2339`) when reading `hasCustomDoUploadRequest`.
  - In plain JS the value is `undefined` (falsy), so a branch on it always takes the "no custom upload" path.
  - The hook also returns new required fields, which only affects code that builds or mocks its return type.
- Old API:
  - `useAttachmentManagerState().hasCustomDoUploadRequest: boolean`
- Replacement:
  - `useAttachmentManagerState().customCdn`: the resolved `messageComposer.attachments.customCdn` config. It answers whether uploads bypass Stream's storage rules, which is the question `hasCustomDoUploadRequest` was used as a proxy for.
  - To ask "is a custom upload function installed", read `messageComposer.attachmentManager.hasCustomDoUploadRequest`; the LLC getter still exists.
  - The hook now also returns `attachmentsEnabled`, `locationEnabled`, `pollsEnabled` and `maxNumberOfFilesPerMessage`, and re-renders when the composer config changes.
- Evidence:
  - `release-v14:src/components/MessageComposer/hooks/useAttachmentManagerState.ts:18`
  - `master:src/components/MessageComposer/hooks/useAttachmentManagerState.ts:9-45`
  - `master:node_modules/stream-chat/src/messageComposer/attachmentManager.ts:187-189` (`hasCustomDoUploadRequest` getter still present), `master:node_modules/stream-chat/src/messageComposer/configuration/types.ts:103` (`customCdn`)
  - commit: `f66597a13 feat: use configuration service API as a single source of truth` (PR #3273, `BREAKING CHANGE` footer)
- Docs impact:
  - `02-ui-components/09-message-composer/03-message_composer_hooks.md` (line 15, return list)
  - `02-ui-components/09-message-composer/10-message_composer.md` (lines 319-331, `useAttachmentManagerState` section)
- Example needed: no (the guide's two-line snippet is accurate)

### BC-065: `AttachmentSelector` actions follow the composer's resolved configuration, and `customCdn` decides whether upload permission applies

- Status: confirmed
- Area: attachment selector (behavior)
- User impact: silent behavior change in which attachment-menu actions are offered, and in which uploads are allowed.
  - **File:** v14 required `channelCapabilities['upload-file'] && channelConfig.uploads && isUploadEnabled`. v15 requires only `attachmentManager.isUploadEnabled`, which is `config.attachments.enabled && hasAvailableUploadSlots && (customCdn || hasUploadPermission)`.
    - With `customCdn: true`, the File action now appears for users without `upload-file`; v14 always hid it from them.
    - With a custom `doUploadRequest` and `customCdn` unset, uploads that the v14 LLC let through without `upload-file` are now blocked, for example paste, which skipped the capability check when `doUploadRequest` was set. The File action was already hidden in v14.
  - **Poll:** reads the resolved `polls.enabled` instead of the raw `channelConfig.polls`.
  - **Location:** reads the resolved `location.enabled` instead of `channelConfig.shared_locations`.
  - **Commands:** read `channel.configState` `availableCommands` instead of `channel.getConfig().commands`.
  - Consequently `client.config.set({ messageComposer: { attachments | polls | location: { enabled: false } } })` now hides the matching action.
- Old API:
  - default `AttachmentSelector` action filtering (`useAttachmentSelectorActionsFiltered`, internal)
  - custom `doUploadRequest` used as an implicit "uploads do not go to Stream" signal
- Replacement: if your `doUploadRequest` stores files outside Stream, declare it with `client.config.set({ messageComposer: { attachments: { customCdn: true } } })`. If your upload function still posts to Stream, leave `customCdn` unset. `SimpleAttachmentSelector` still requires `upload-file` regardless (`master:src/components/MessageComposer/AttachmentSelector/AttachmentSelector.tsx:136`).
- Evidence:
  - `release-v14:src/components/MessageComposer/AttachmentSelector/AttachmentSelector.tsx:285-313`
  - `release-v14 node_modules/stream-chat@9.54.0 src/messageComposer/attachmentManager.ts:181-183` (`isUploadEnabled = hasUploadPermission && hasAvailableUploadSlots`), `:785-786` (`uploadFiles` skips the capability check when `hasCustomDoUploadRequest`)
  - `master:src/components/MessageComposer/AttachmentSelector/AttachmentSelector.tsx:293-322`
  - `master:node_modules/stream-chat/src/messageComposer/attachmentManager.ts:203-225` (`usesStreamStorage = !customCdn`; `isUploadEnabled`)
  - commit: `f66597a13 feat: use configuration service API as a single source of truth` (PR #3273)
  - examples.diff: `examples/vite/src/App.tsx` sets `chatClient.config.setConfig('messageComposer', { attachments: { customCdn: uploadDestination !== 'stream', pendingUploadsEnabled } })`
- Docs impact:
  - `02-ui-components/09-message-composer/11-message_composer_api.md` (line ~471, "Custom Upload Destination": add `customCdn: true`)
  - `02-ui-components/09-message-composer/08-attachment-selector.md` (when actions are offered)
- Example needed: no
- Note for the guide: `ai-migration-v14-v15.md` § "Attachment/poll availability" says that without `customCdn` "the File action disappears for users without the `upload-file` capability". It already did in v14, since the v14 selector checked `channelCapabilities['upload-file']` directly. The v14→v15 differences are the two bullets under the **File** action above.

### BC-066: `getAttachmentPreviewUrl`, `hasPendingUploadState` and `isUploadConfirmationPending` moved to `stream-chat`

- Status: confirmed
- Area: composer upload helpers
- User impact: compile and runtime import error: the three names are no longer exported from `stream-chat-react`.
- Old API:
  - `getAttachmentPreviewUrl(attachment?, ...urls)`
  - `hasPendingUploadState(attachment?)`
  - `isUploadConfirmationPending(localMetadata?)`
- Replacement: import from `stream-chat`.
  - `getAttachmentPreviewUrl`: same signature.
  - `isUploadConfirmationPending`: same logic.
  - `isPendingUpload` replaces `hasPendingUploadState`, which in v14 was only a wrapper around it.
- Note: `useAttachmentUploadState` / `useAttachmentsUploadState` remain in `stream-chat-react`.
- Evidence:
  - `release-v14:src/components/Attachment/hooks/useAttachmentUploadState.ts:67` (`hasPendingUploadState` = `isPendingUpload(attachment)`), `:196` (`isUploadConfirmationPending`), `:215` (`getAttachmentPreviewUrl`)
  - `master:src/components/Attachment/hooks/useAttachmentUploadState.ts`: removed; `master:src/components/Attachment/AttachmentContainer.tsx:16` and `VideoAttachment.tsx:9` import them from `stream-chat`
  - `master:node_modules/stream-chat/src/messageComposer/attachmentUtils.ts:14`, `master:node_modules/stream-chat/src/messageComposer/attachmentIdentity.ts:44`, `master:node_modules/stream-chat/src/uploadManager.ts:55` (all re-exported from `stream-chat/src/index.ts:53,88`)
  - commit: `4f1459e54 feat(Attachment): render live upload progress on messages being sent` (PR #3295)
- Docs impact:
  - none in v14 docs
- Example needed: yes

Before (v14):

```ts
import {
  getAttachmentPreviewUrl,
  hasPendingUploadState,
  isUploadConfirmationPending,
} from 'stream-chat-react';
```

After (v15):

```ts
import {
  getAttachmentPreviewUrl,
  isPendingUpload, // was hasPendingUploadState
  isUploadConfirmationPending,
} from 'stream-chat';
```

## i18n

### BC-067: English-only bundle and namespaced keys. Built-in dictionaries, `isLanguageSupported` and `SupportedTranslations` are removed

- Status: confirmed
- Area: i18n
- User impact:
  - compile error on the removed imports
  - **silent**: a non-English `language` with no registered dictionary renders English; a v14 override keyed by English text (`'Send'`, `'aria/…'`, `'timestamp/DateSeparator'`) never matches and the English copy renders. With `registerTranslation` / `translationsForLanguage` typed as `TranslationDictionary`, an inline object literal with an old key is a `TS2353`.
  - non-English dates render in English unless the app imports the dayjs locale and supplies `dayjsLocaleConfigForLanguage` (the per-language calendar formats are no longer bundled)
- Old API:
  - `deTranslations`, `enTranslations`, `esTranslations`, `frTranslations`, `hiTranslations`, `itTranslations`, `jaTranslations`, `koTranslations`, `nlTranslations`, `ptTranslations`, `ruTranslations`, `trTranslations`
  - `isLanguageSupported(language)`, `SupportedTranslations`
  - every translation key (natural-language keys, `aria/…`, `timestamp/…`)
- Replacement: rename keys with `ai-docs/i18n-v15-key-map.json` (old key -> new key) and register a dictionary per language with `i18n.registerTranslation(lang, dict, dayjsLocaleConfig?)`, typing it `TranslationDictionary` (exported) so stale keys fail to compile. Use `LooseTranslationDictionary` only for app-defined keys. Instead of `isLanguageSupported(lang)`, check `i18n.registeredLanguages.has(lang)`. A removed dictionary can be recovered from a v14 tag and then renamed. Full procedure: `ai-docs/i18n-v15-migration.md` ("Renaming your keys", "Supplying a language the SDK used to ship", "Date and time").
- Scope: this entry covers the translation-key changes of every component area (message, composer, recorder, emoji picker, `ai-components`, channel, navigation). The per-area pointers were merged here.
- Evidence:
  - `release-v14:src/i18n/translations.ts:1-28` exported the 12 JSON dictionaries; `release-v14:src/i18n/utils.ts:257` `isLanguageSupported`; `release-v14:src/i18n/types.ts:109` `SupportedTranslations`
  - `master:src/i18n/index.ts` exports none of them; `master:src/i18n` has no `*.json`
  - `master:src/i18n/types.ts:47-49` `TranslationKey`, `TranslationDictionary`, `LooseTranslationDictionary`; `@stream-io/i18n` `Streami18n.d.ts:120` `registerTranslation(language: string, translation: TranslationDictionaryOf<C>, dayjsLocaleConfig?)`, `:135` `get registeredLanguages(): ReadonlySet<string>`
  - commit: `17c91bc70 feat(i18n): english-only bundle with namespaced, type-checked translation keys` (PR #3261)
  - examples: `examples.diff` vite example dictionaries `... as const satisfies TranslationDictionary` and `streamI18n.registerTranslation(code, translations, dayjsLocaleConfig)`
  - corpus: `docs/04-guides__08-date-time-formatting__5.tsx:8` (`'timestamp/DateSeparator'` not in `TranslationDictionaryOf<TranslationCatalog>`, `TS2353`), `docs/04-guides__18-accessibility__15.tsx:8` (`'aria/Opened channel: {{ name }}'`, `TS2353`)
- Docs impact:
  - `04-guides/03-translations.md`, `04-guides/08-date-time-formatting.md`, `04-guides/13-notifications.md`, `04-guides/18-accessibility.md`, `02-ui-components/03-chat/01-chat.md` (`SupportedTranslations`), `03-ui-cookbook/13-accessibility/02-custom-announcements.md`
- Example needed: no (`i18n-v15-migration.md` already carries the examples; do not list keys here)

### BC-068: `t` from `useTranslationContext()` is strictly typed. `t('English text')` and `t(someString)` no longer compile

- Status: confirmed
- Area: i18n
- User impact: compile error `TS2769 No overload matches this call` on every `t('Some English')` and every `t(variable)`. At runtime an unknown key still renders (the inline default, or the key itself). This is the largest single source of new errors in the corpus.
- Old API:
  - `TranslationContextValue.t: TFunction` (i18next, any string key)
  - `TranslationContextValue.userLanguage: TranslationLanguages` (now `string`, a widening)
- Replacement: `t` is `StreamTFunction`, with four overloads: a plural key with `{ count }`; a formatter key (`timestamp.*` / `duration.*`) or bundled key with options; an SDK prose key with an inline English default (`t('common.close.ariaLabel', 'Close')`); and a runtime key via `asDynamicKey` (`t(asDynamicKey(key), 'Default copy')`). App-owned strings use `asDynamicKey` with their own key, and the dictionary supplying them is typed `LooseTranslationDictionary`. `asDynamicKey`, `StreamTFunction`, `TranslationKey`, `DynamicTranslationKey` and `TranslationCatalog` are exported from `stream-chat-react`. The same `StreamTFunction` type flows into label-data callbacks (`ChannelListItemLabelData.t`, `ThreadListItemLabelData.t`, `WithT.t`).
- Evidence:
  - `master:src/context/TranslationContext.tsx:15-19` `t: StreamTFunction; userLanguage: string`
  - `@stream-io/i18n@1.0.2` `dist/esm/types.d.ts:75-77` `DynamicTranslationKey` (branded; a plain `string` is not assignable), `:92-113` the four `StreamTFunctionFor` overloads
  - `master:src/i18n/index.ts` exports `asDynamicKey`; `master:src/i18n/types.ts:47-50`
  - commits: `17c91bc70` (PR #3261), `f68cad332 refactor(i18n)!: adopt the shared i18n layer from stream-chat/i18n` (PR #3271), `eb3ae7a5d refactor(i18n)!: consume the shared runtime from @stream-io/i18n` (PR #3284)
  - examples: `examples.diff` `examples/vite/src/AppSettings/tabs/ChannelDetail/removeMembersHeaderActions.tsx`: `t('Remove')` -> `t(asDynamicKey('viteExample.removeMembers.trigger.label'), 'Remove')`
  - corpus (`TS2769`): `docs/03-ui-cookbook__13-accessibility__01-accessible-list-labels__1.tsx:17,19,21`, `…__3.tsx:14`, `docs/03-ui-cookbook__13-accessibility__02-custom-announcements__1.tsx:11,14`, `docs/04-guides__03-translations__7.tsx:7`, `docs/04-guides__03-translations__17.tsx:8`, `docs/04-guides__18-accessibility__5.tsx:9`, `docs/04-guides__18-accessibility__12.tsx:13,15`; `examples/examples/vite/src/AppSettings/tabs/ChannelDetail/removeMembersHeaderActions.tsx:23,29,44,51`, `examples/examples/vite/src/ChatLayout/ChannelMembersRemoveView.tsx:41,44,45,51,92,104,158,170`, `examples/examples/vite/src/ChatLayout/ConfiguredChannelDetail.tsx:21`, `examples/examples/vite/src/CustomMessageActions/ConfigurableMessageActions.tsx:74,75,84,97,110,123,136,177,186,201,212,226,237,468,479`, `examples/examples/vite/src/InlineEditMessage/InlineEditMessage.tsx:57,65,97`, `examples/examples/vite/src/Sidebar/SidebarToggle.tsx:17`
- Docs impact:
  - `04-guides/03-translations.md`, `04-guides/18-accessibility.md`, `03-ui-cookbook/13-accessibility/01-accessible-list-labels.md`, `03-ui-cookbook/13-accessibility/02-custom-announcements.md`, `03-ui-cookbook/02-channel-list/01-channel_list_preview.md`, `06-release-guides/01-upgrade-to-v14.md`
- Example needed: yes

Before (v14):

```tsx
import { useTranslationContext } from 'stream-chat-react';

export const RemoveButton = ({ label }: { label: string }) => {
  const { t } = useTranslationContext();
  return <button aria-label={t('Remove channel members')}>{t(label)}</button>;
};
```

After (v15):

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

### BC-069: `Streami18n` public API reshaped: members removed, `setLanguage` returns `void`, `t` is read-only, formatter and date-parser types changed

- Status: confirmed
- Area: i18n
- User impact: compile errors on the removed members. A runtime break where code relied on `setLanguage()` returning a `t`, assigned `i18n.t = …`, or registered a `registerSetLanguageCallback`. Custom formatter factories that typed their argument as `Streami18n`, or read members other than those on `FormatterContext`, break.
- Old API:
  - `Streami18n.getTranslators()`, `registerSetLanguageCallback()`, `setLanguageCallback`, `getAvailableLanguages()`, `getTranslations()`, `translations`, `geti18Instance()`, `addOrUpdateLocale()`, `localeExists()`, `validateCurrentLanguage()`, `Dayjs`, `dayjsLocales`, `isCustomDateTimeParser`, `i18nextConfig`
  - `Streami18n.setLanguage(lang): Promise<TFunction | undefined>`; `Streami18n.t` writable field; `Streami18n.init(): Promise<{ t, tDateTimeParser }>`
  - `FormatterFactory<V> = (streamI18n: Streami18n) => …`
  - `TDateTimeParserOutput` including dayjs `Dayjs` / `Moment` instances (81 of 129 members dropped); `isDate(output: unknown)`; `defaultTranslatorFunction` (i18next `TFunction`); `DateFormatterOptions` (removed export)
- Replacement:
  - `getTranslators()` -> `await i18n.init()`, which resolves `Streami18nState` (`{ initialized, language, t, tDateTimeParser }`), is idempotent, and is safe to call concurrently
  - `registerSetLanguageCallback(cb)` / `setLanguageCallback` -> `i18n.state.subscribeWithSelector(({ t }) => ({ t }), handler)` (`state: StateStore<Streami18nState>`). `<Chat>` already subscribes.
  - `const t = await i18n.setLanguage(l)` -> `await i18n.setLanguage(l); const { t } = i18n.state.getLatestValue();` (or `i18n.t`)
  - `i18n.t = fn` -> `i18n.overrideTFunction(fn)`
  - `getAvailableLanguages()` -> `[...i18n.registeredLanguages]` (a `ReadonlySet<string>`); `getTranslations()` / `translations` -> none (render the key with `i18n.t(...)`)
  - `geti18Instance()` -> `i18n.i18nInstance` (public readonly field)
  - `addOrUpdateLocale()` -> pass `dayjsLocaleConfig` to `registerTranslation(lang, dict, dayjsLocaleConfig)` or `dayjsLocaleConfigForLanguage` to the constructor. (`addOrUpdateDayjsLocale` exists in `@stream-io/i18n` but is not re-exported by `stream-chat-react`.)
  - `localeExists`, `validateCurrentLanguage`, `Dayjs`, `dayjsLocales`, `isCustomDateTimeParser`, `i18nextConfig` -> none (private or removed)
  - custom formatter factories receive `FormatterContext` (`{ currentLanguage, logger, dateTimeParser, tDateTimeParser, translate, timezone? }`): `streamI18n.t` -> `context.translate`, `streamI18n.DateTimeParser` -> `context.dateTimeParser`
  - `TDateTimeParserOutput` is `string | number | Date | DateTimeLike`, a structural type exposing only `format`, `calendar?`, `fromNow?`, `diff`, `startOf`, `valueOf`. Cast to your library's type if you call anything else. `isDate(value: TDateTimeParserOutput)` is now a type guard. `moment` is still accepted as `DateTimeParser` (structural `DateTimeParserModule`).
  - `DateFormatterOptions` -> none
- Evidence:
  - `release-v14:src/i18n/Streami18n.ts:443` `i18nInstance`, `:446` `Dayjs`, `:447` `setLanguageCallback`, `:450` `t: TFunction` (field), `:488` `isCustomDateTimeParser`, `:673` `localeExists`, `:679` `validateCurrentLanguage`, `:693` `geti18Instance`, `:696` `getAvailableLanguages`, `:699` `getTranslations`, `:704` `getTranslators`, `:756` `addOrUpdateLocale`, `:765-785` `setLanguage` returning `t`, `:787` `registerSetLanguageCallback`
  - `release-v14:src/i18n/types.ts:7-9` `FormatterFactory` (`streamI18n: Streami18n`), `:106` `TDateTimeParserOutput` with `Dayjs.Dayjs | Moment`, `:123` `DateFormatterOptions`
  - `master:src/i18n/Streami18n.ts:56` `class Streami18n extends CoreStreami18n<TranslationCatalog, BundledKey>`
  - `@stream-io/i18n@1.0.2` `dist/esm/Streami18n.d.ts:47-52` `Streami18nState`, `:70` `readonly i18nInstance`, `:71` `readonly state`, `:87` `get t()` (no setter), `:100` `init()`, `:120` `registerTranslation`, `:125` `setLanguage(): Promise<void>`, `:130` `overrideTFunction`, `:135` `registeredLanguages`; `dist/esm/types.d.ts:133-157` `DateTimeLike` / `TDateTimeParserOutput`, `:181` `DateTimeParserModule`, `:200-216` `FormatterContext`, `:218` `FormatterFactory`; `dist/esm/dayjs.d.ts:100` `isDate`
  - commits: `f68cad332` (PR #3271): "`setLanguage()` returns `void`; `getTranslators()` is now `init()`. No deprecated aliases"; `eb3ae7a5d` (PR #3284)
  - corpus: none (no v14 docs snippet calls the removed members with types the checker reached), but `04-guides/03-translations.md` uses `getTranslators`, `getAvailableLanguages`, `geti18Instance`, `setLanguage(`
- Docs impact:
  - `04-guides/03-translations.md`, `04-guides/08-date-time-formatting.md` ("Custom datetime formatter functions")
- Example needed: yes

Before (v14):

```ts
import { Streami18n } from 'stream-chat-react';

const i18n = new Streami18n({ language: 'de' });
const { t } = await i18n.getTranslators();
i18n.registerSetLanguageCallback((nextT) => setT(() => nextT));
const frT = await i18n.setLanguage('fr');
const hasFr = i18n.getAvailableLanguages().includes('fr');
```

After (v15):

```ts
import { Streami18n } from 'stream-chat-react';

const i18n = new Streami18n({ language: 'de' });
const { t } = await i18n.init();
const unsubscribe = i18n.state.subscribeWithSelector(
  ({ t }) => ({ t }),
  ({ t: nextT }) => setT(() => nextT),
);
await i18n.setLanguage('fr');
const { t: frT } = i18n.state.getLatestValue();
const hasFr = i18n.registeredLanguages.has('fr');
```

## Types that follow stream-chat v10 (umbrella entries)

### BC-070: values typed with stream-chat types changed shape in channel/navigation hooks and contexts (umbrella)

- Status: confirmed
- Area: chat context / channel list hooks
- User impact: compile errors where the app treats these as v14 types (dates as strings/`Date`, optional fields as optional); runtime `Invalid Date` if passed to a date library.
- Old API -> v15 (all caused by stream-chat v10 response types):
  - `useChannelMembershipState(channel)`: `created_at`, `updated_at`, `archived_at`, `pinned_at`, `ban_expires`, `invite_accepted_at`, `invite_rejected_at` `string` -> `TimestampNS`; `banned`, `channel_role`, `created_at`, `notifications_muted`, `shadow_banned`, `updated_at` now required; `channel_role` `Role` -> `string`; `custom` added
  - `ChatContextValue.mutes` / `useChat().mutes`: `Mute[]` -> `UserMuteResponse[]`
  - `ChatContextValue.getAppSettings`: `Promise<AppSettingsAPIResponse>` -> `ReturnType<StreamChat['getAppSettings']>`
  - `MessageSearchResultItem` / `ChannelByMessageSearchResultItemProps.item`: `MessageResponse` -> `MessageResponse & { channel?: ChannelResponse }` (non-exported `SearchResultMessage`)
- Replacement: follow the guide's "Dates on response types are unix-nanosecond numbers" section (`convertTimestampToDate`, `nsToDate`, ...).
- Evidence:
  - diff.md `components/ChannelList` (`useChannelMembershipState.*`), `context` (`ChatContext.mutes`, `ChatContext.getAppSettings`), `components/Search`
  - `master:src/context/ChatContext.tsx:35,37`; `master:src/components/Search/SearchResults/SearchResultItem.tsx:28,117-119`
  - commits: `cb472c35f feat!: move to timestamps in response models` (PR #3278); `aaa7fa31e feat!: adopt stream-chat's branded TimestampNS` (PR #3297)
- Docs impact:
  - `04-guides/07-sdk-state-management.md`, `03-ui-cookbook/02-channel-list/*` where membership dates are read
- Example needed: no
- Note: merge into the timestamps umbrella entry if another area owns it.

---

### BC-071: message-area props typed with `stream-chat` types change shape with `stream-chat` v10 (umbrella)

- Status: confirmed
- Area: message rendering (LLC-typed props)
- User impact: compile errors and runtime differences in custom components and handlers that build or read these values. The React APIs are unchanged; the `stream-chat` v10 types they reference changed.
- Old API -> v15 (representative, all verified in diff.md):
  - Reaction sort: `reactionDetailsSort` (on `Message`, `MessageList`, `VirtualizedMessageList`, `MessageContext`, `MessageReactions`, `MessageReactionsDetail`, `VirtuosoContext`), `MessageReactionsDetail.sort`, and the `sort` argument of `handleFetchReactions` / `useReactionsFetcher`: `ReactionSort` -> `SortParamRequest[]` (`[{ field: 'created_at', direction: -1 }]`). `ReactionSort` no longer exists in `stream-chat`.
  - Delete options: `MessageContext.handleDelete` / `useDeleteHandler` options: `{ deleteForMe?, hardDelete? }` -> `{ delete_for_me?, hard? }`
  - Mutes: `isUserMuted(message, mutes)`: `Mute[]` -> `UserMuteResponse[]` (`target` is optional)
  - Moderation: `isMessageBounced` / `isMessageBlocked` read only `message.moderation`, because `moderation_details` is gone from `LocalMessage`
  - Attachments: `CardProps` / `AttachmentActionsProps` (they extend the LLC `Attachment`) lose `duration`, `file_size`, `mime_type`, `waveform_data`, `latitude`, `longitude` and gain a required `custom`, and `giphy` is `Images`. Custom attachment components must read `attachment.custom.duration` / `.file_size` / `.mime_type` / `.waveform_data` (the SDK does, e.g. `master:src/components/Attachment/FileAttachment.tsx:33`). `AttachmentUploadedSizeIndicator.attachment.file_size` -> `attachment.custom.file_size`.
  - Location: `Attachment.attachments`, `AttachmentContainerProps.attachment`, `Geolocation.location`, `GeolocationContainer.location`, `GeolocationAttachmentMapPlaceholderProps.location`: `SharedLocationResponse` -> `SharedLocationResponseData`. A location entry no longer has `type`, `latitude` or `longitude` on the union.
  - Polls: `PollOptionSelector.option` `PollOption` -> `PollOptionResponseData`; `PollVote.vote`, `PollVoteListing.votes`, `usePollOptionVotesPagination().votes`, `usePollAnswerPagination().answers` -> `PollVoteResponseData`
  - Messages: `EventComponent.message`, `RenderedMessage` fields (`created_at` / `updated_at` / `pinned_at` / `deleted_at` are `TimestampNS`; `args`, `before_message_send_failed`, `channel`, `command_info`, `moderation_details` removed; `user` and `text` now required), `RenderTextMentionEntity` (follows `UserResponse`: `username`, `anon`, `shadow_banned`, `privacy_settings`, `push_notifications`, `notifications_muted`, `channel_last_read_at` removed)
  - Calendar props: `calendar` / `calendarFormats` on `DateSeparator`, `EventComponent`, `MessageTimestamp`, `MessageEditedIndicator`, `TimestampProps` were widened (`boolean | null`, `string | Record`). Not breaking for callers; listed for completeness.
- Replacement: build and read values with the v10 shapes above. For dates, see BC-056 and the TIMESTAMP section of the guide.
- Evidence:
  - diff `components/Attachment`, `components/Message`, `components/MessageList`, `components/Poll`, `components/Reactions`, `components/EventComponent`, `context` (`MessageContext.handleDelete` / `handleFetchReactions` / `reactionDetailsSort`)
  - `master:src/context/MessageContext.tsx` imports `DeleteMessageOptions`, `SortParamRequest` from `stream-chat`; `node_modules/stream-chat/dist/types/types.d.ts:284` `DeleteMessageOptions = NonNullable<Parameters<ChatApi['deleteMessage']>[1]>`; `gen/models/index.d.ts:8432` `SortParamRequest { direction?, field?, type? }`
  - `master:src/components/Message/utils.tsx:42` `isUserMuted(message, mutes?: UserMuteResponse[])`
  - examples: `examples.diff:12306`–`:12307` `onDelete({ deleteForMe, hardDelete })` -> `onDelete({ delete_for_me: deleteForMe, hard: hardDelete })`
  - commits: `99cbe6704` (PR #3237, "attachment `duration`/`file_size`/`mime_type`/`waveform_data` from `attachment.custom` … `moderation_details` is gone"), `ccccce5e4 fix: adapt to removed stream-chat-js hand-written types` (PR #3274), `cb472c35f` (PR #3278)
  - corpus: `examples/examples/vite/src/CustomMessageActions/ConfigurableMessageActions.tsx:119` TS2561 (`deleteForMe`); `docs/03-ui-cookbook__06-attachment__03-geolocation_attachment__1.tsx:13`, `:14` TS2339 (location union)
- Docs impact:
  - `02-ui-components/08-message/12-reactions.md`, `02-ui-components/08-message/01-message.md`, `02-ui-components/08-message/02-message_context.md` (`ReactionSort`, `DeleteMessageOptions`)
  - `02-ui-components/08-message/11-attachment/02-voice-recording.md` (`waveform_data`, `file_size`), `02-ui-components/08-message/11-attachment/01-attachment.md` (`SharedLocationResponse`)
  - `03-ui-cookbook/06-attachment/03-geolocation_attachment.md`
- Example needed: yes (handleDelete is the common one)

Before (v14)

```tsx
import { useMessageContext } from 'stream-chat-react';

export const DeleteForMe = () => {
  const { handleDelete } = useMessageContext();
  return (
    <button onClick={() => handleDelete({ deleteForMe: true })}>Delete for me</button>
  );
};
```

After (v15)

```tsx
import { useMessageContext } from 'stream-chat-react';

export const DeleteForMe = () => {
  const { handleDelete } = useMessageContext();
  return (
    <button onClick={() => handleDelete({ delete_for_me: true })}>Delete for me</button>
  );
};
```

### BC-072: composer prop and type changes that follow stream-chat v10 types (umbrella)

- Status: confirmed
- Area: message composer, suggestion list, attachment previews, media recorder
- User impact: compile errors in custom composer parts that are typed against these props. At runtime, code reading the moved attachment fields gets `undefined`.
- Old API (each now typed with the stream-chat v10 type):
  - `CommandChip.command` / `CommandChipProps.command`, `CommandItem.entity` / `CommandItemProps.entity`, `MessageComposerCommand.command`: `CommandResponse` → `Command`, where `args`, `description` and `set` are required. Passing a hand-built command object without them fails to compile.
  - `DefaultSuggestionListItemEntity`: user fields `anon`, `channel_last_read_at`, `notifications_muted`, `privacy_settings`, `push_notifications`, `shadow_banned` and `username` are gone. `created_at`, `updated_at`, `last_active`, `deactivated_at`, `deleted_at` and `revoke_tokens_issued_before` are `TimestampNS`. `teams_role` is `Record<string, string>`. Custom suggestion items reading e.g. `entity.username` must read `entity.custom.username`, where v10 user custom fields live (per PR #3237).
  - `QuotedMessagePreviewProps.getQuotedMessageAuthor` / `QuotedMessagePreview.getQuotedMessageAuthor`: `(message: LocalMessage) => string` → `(message: LocalMessage | MessageResponse) => string`. A callback typed with `LocalMessage` is rejected under `strictFunctionTypes`.
  - `QuotedMessagePreviewUI.quotedMessage`: `LocalMessageBase` → `LocalMessage | MessageResponse`
  - `GeolocationPreviewProps.location`, `useAttachmentsForPreview().location`: `StaticLocationPayload` → `StaticLocationPreview`
  - `LinkPreviewCard.linkPreview`: `LinkPreview` now extends the v10 `Attachment`, whose `custom` field is required
  - Attachment previews and the voice recording built by the recorder: `duration`, `file_size`, `mime_type` and `waveform_data` moved under `attachment.custom`. This affects custom `AttachmentPreviewList` slot components that read them, and `recordingController.recording.duration` / `.waveform_data`, which are now `recordingController.recording.custom.duration` / `.custom.waveform_data`.
- Replacement: type custom parts with the v15 prop types. Read the moved attachment fields from `attachment.custom`. Pass complete `Command` objects.
- Evidence:
  - `release-v14:src/components/TextareaComposer/SuggestionList/CommandItem.tsx:9` → `master:...:9` (`entity: Command`)
  - `release-v14:src/components/MessageComposer/QuotedMessagePreview.tsx:49,327` → `master:...:52,328`
  - `release-v14:src/components/MediaRecorder/classes/MediaRecorderController.ts:175-190` (top-level `duration`, `file_size`, `mime_type`, `waveform_data`) → `master:...:175-192` (under `custom`)
  - `master:src/components/MessageComposer/AttachmentPreviewList/AudioAttachmentPreview.tsx:49-50` and `FileAttachmentPreview.tsx:38` read `attachment.custom`
  - `master:node_modules/stream-chat/src/gen/models/index.ts:567-568` (`Attachment.custom: CustomAttachmentData`, required)
  - diff.md: components/MessageComposer and components/TextareaComposer, the `DefaultSuggestionListItemEntity.*` member-removed items
  - commits: `99cbe6704` (PR #3237, "v10 data shapes" note), `cb472c35f feat!: move to timestamps in response models` (PR #3278), `aaa7fa31e feat!: adopt stream-chat's branded TimestampNS` (PR #3297)
  - corpus: `docs/03-ui-cookbook__05-message-composer__02-link-previews__2.tsx:17,18,36` TS2345/TS2322 (`custom` missing on `LinkPreview`)
- Docs impact:
  - `03-ui-cookbook/05-message-composer/02-link-previews.md`
  - `03-ui-cookbook/05-message-composer/06-suggestion_list.md` (custom `UserItem` reads `entity.name`, `entity.image`; still valid)
  - `02-ui-components/09-message-composer/05-ui_components.md` (`CommandChip`)
- Example needed: no (belongs under the guide's "Dates on response types" and v10 data-shape umbrella, which other areas will also feed)

## CSS and markup

### BC-073: CSS, channel layout wrappers: `Window` and the `str-chat__main-panel` / `str-chat__container` wrappers are removed

- Status: confirmed
- Area: CSS / layout (Channel, Window)
- User impact: app CSS targeting these wrappers silently stops applying. The v14 getting-started layout (`#root .str-chat__main-panel`, `.str-chat__main-panel--thread-open`) no longer matches anything. Importing `Window` / `WindowProps` is a compile error, and so is `customClasses.chatContainer` (`CustomClasses.chatContainer` is removed from the type).
- Old API:
  - `Window`, `WindowProps` (rendered `div.str-chat__main-panel`, plus `--thread-open` while a thread was open; the prop doc names `str-chat__main-panel---with-thread-opn`)
  - `Channel` rendered its children inside `div.str-chat__container` (or `customClasses.chatContainer`)
  - stylesheet rules `.str-chat__channel .str-chat__container`, `.str-chat__container .str-chat__main-panel`, `.str-chat__main-panel` (removed from `dist/css/index.css`)
- Replacement: none as a component. `Channel` renders `div.str-chat__channel` as its content column (flex column with header / list / composer), and the thread is a separate panel. Target `.str-chat__channel` for the channel column and `.str-chat__thread-container` / `.str-chat__thread` for the thread. For side-by-side panels, use `ChatView` slots (`str-chat__chat-view__slot`) from `stream-chat-react/slot-layout`, or your own layout. Drop `customClasses.chatContainer`; use `customClasses.channel` for the channel column.
- Evidence:
  - `release-v14:src/components/Window/Window.tsx:8-32` (`str-chat__main-panel`, `str-chat__main-panel--thread-open`)
  - `release-v14:src/components/Channel/Channel.tsx:249,1268` `<div className={clsx(chatContainerClass)}>{children}</div>` with `getChatContainerClass` defaulting to `str-chat__container`
  - `release-v14:src/components/Channel/styling/Channel.scss:8-40` `.str-chat__container`, `.str-chat__main-panel`; `release-v14:src/components/MessageList/styling/MessageList.scss:61` `.str-chat__main-panel`
  - `master:src/components/Channel/styling/Channel.scss:1-4`: "It used to wrap a `.str-chat__container` … and a `.str-chat__main-panel`; the thread is a slot now, so both wrappers are gone"
  - `master:src/components/Channel/Channel.tsx:35-40` renders `str-chat <theme> str-chat__channel` with no inner container; `master:src/context/ChatContext.tsx` `CSSClasses` has no `chatContainer`, and `useChannelContainerClasses` no longer computes `chatContainerClass` (both removed in `fix/v15-dead-surface-cleanup`; before that the key was typed and the class computed, but nothing applied it)
  - own class diff of `release-v14/dist/css/*.css` vs `master/dist/css/*.css` (comments stripped): exactly `str-chat__container` and `str-chat__main-panel` removed. `diff.md` reports 0 because the class names survive inside a CSS comment.
  - commit: `99cbe6704` (PR #3237)
  - corpus: `docs/02-ui-components__01-getting_started__1.tsx:7`, `docs/02-ui-components__03-chat__01-chat__5.tsx:10`, `docs/02-ui-components__04-channel__01-channel__4.tsx:11`, `docs/02-ui-components__08-message__13-date_separator__2.tsx:10` (`Window`, `TS2305`)
- Docs impact:
  - `02-ui-components/13-window.md` (whole page obsolete), `02-ui-components/01-getting_started.md` (CSS `#root .str-chat__main-panel` and `Window` usage), `02-ui-components/03-chat/01-chat.md` (`chatContainer -> str-chat__container`), and every page whose snippet wraps the list in `<Window>` (`02-ui-components/04-channel/01-channel.md`, `02-ui-components/08-message/13-date_separator.md`, …)
- Example needed: no

### BC-074: CSS, channel list: `ChannelListUI` wrappers removed; the theme scope moves to `ChatView`, with the channel list carrying its own only outside it

- Status: confirmed
- Area: CSS (ChannelList)
- User impact:
  - app CSS on `.str-chat__channel-list-inner` / `.str-chat__channel-list-inner__main` matches nothing. The SDK's own rules for them are removed too.
  - in v14 the channel list root always rendered `str-chat <theme> str-chat__channel-list`. In v15 the `str-chat <theme>` scope comes from the `ChatView` root, and inside `ChatView` the channel list adds none of its own. `.str-chat` declares the whole token set, so a nested one would reset tokens overridden on the `ChatView` root. App CSS that relied on the list root being a `.str-chat` element (for example `.str-chat { … }` sizing rules) no longer matches it inside `ChatView`.
  - outside `ChatView` the list carries the scope, as in v14. `ChannelNavigation`'s root renders `str-chat <theme> str-chat__channel-list`. A bare `<ChannelList paginator>` wraps itself in `div.str-chat.<theme>.str-chat__theme-scope`, which is `display: contents` and does not affect layout.
  - `customClasses.chat` replaces `str-chat` wherever the scope is applied. `customClasses.channelList` replaces `str-chat__channel-list` on `ChannelNavigation`'s root, inside or outside `ChatView`.
- Old API:
  - classes `str-chat__channel-list-inner`, `str-chat__channel-list-inner__main` (rendered by `ChannelListUI`, which held `role="listbox"`)
  - root classes `str-chat`, `theme`, `customClasses.channelList` (default `str-chat__channel-list`) and `str-chat--windows-flags` on the channel list
- Replacement: target `.str-chat__channel-list .str-chat__infinite-scroll-paginator` (now the `role="listbox"` scroll container, inside `ChannelNavigation`) and `.str-chat__infinite-scroll-paginator__content`. Put overrides that must reach the channel list inside `ChatView` on the `ChatView` root (or `.str-chat` generally), not on a channel-list-specific `.str-chat` element.
- Evidence:
  - `release-v14:src/components/ChannelList/ChannelListUI.tsx:38-41` `str-chat__channel-list-inner`, `__main` (`role='listbox'`)
  - `release-v14:src/components/ChannelList/ChannelList.tsx:341-357` root `clsx(customClasses?.chat ?? 'str-chat', theme, customClasses?.channelList ?? 'str-chat__channel-list', { 'str-chat--windows-flags': … })`
  - `master:src/context/ThemeScopeContext.tsx` (`ThemeScopeProvider`, `useIsInThemeScope`, `ThemeScope`); `master:src/plugins/SlotLayout/ChatView.tsx` wraps its content in `ThemeScopeProvider`
  - `master:src/components/ChannelList/ChannelNavigation.tsx` root `clsx(!isInThemeScope && themeScopeClassName, customClasses?.channelList ?? 'str-chat__channel-list', windowsEmojiClass)`; `master:src/components/ChannelList/ChannelList.tsx` wraps the list in `<ThemeScope>`; `master:src/styling/base.scss` `.str-chat__theme-scope { display: contents }`
  - `master:src/plugins/SlotLayout/ChatView.tsx` root `clsx('str-chat', theme, 'str-chat__chat-view')`; `master:src/styling/variable-tokens.scss:4-6` tokens scoped to `.str-chat`
  - `fix/v15-dead-surface-cleanup`: before it, master rendered `ChannelNavigation`'s root as a bare `str-chat__channel-list`, applied `customClasses.channelList` nowhere, and kept dead `.str-chat__channel-list-inner` rules in `ChannelList.scss`
  - commit: `99cbe6704` (PR #3237)
- Docs impact:
  - `02-ui-components/05-channel-list/06-channel-list-infinite-scroll.md`, `06-release-guides/01-upgrade-to-v14.md` (`str-chat__channel-list-inner`), `02-ui-components/02-theming/01-themingv2.md:172-173` (`customClasses.channelList`)
- Example needed: no

### BC-075: CSS, ChatView: `str-chat__chat-view__channels` / `__threads` render only in `views` mode

- Status: confirmed
- Area: CSS (ChatView)
- User impact: CSS targeting `.str-chat__chat-view__channels` / `.str-chat__chat-view__threads` keeps working only when `ChatView` is given `views`. With the built-in workspace layout, content sits in `.str-chat__chat-view__workspace-layout` / `.str-chat__chat-view__slot` and these wrappers are absent. `diff.md` lists both as "removed from markup", but they are still produced by a template literal, so they are not fully removed.
- Old API:
  - `ChannelsView` / `ThreadsView` wrappers `div.str-chat__chat-view__channels` / `div.str-chat__chat-view__threads`
- Replacement: with `views`, the same classes via `` `str-chat__chat-view__${activeView}` ``. With the workspace layout, `.str-chat__chat-view__workspace-layout`, `.str-chat__chat-view__workspace-layout-slots`, `.str-chat__chat-view__slot` (`--hidden`), `.str-chat__chat-view__slot-layer`.
- Evidence:
  - `release-v14:src/components/ChatView/ChatView.tsx:97,128`
  - `master:src/plugins/SlotLayout/ChatView.tsx:404-412` (`views` mode), `master:src/plugins/SlotLayout/layout/WorkspaceLayout.tsx:28-42`, `master:src/plugins/SlotLayout/layout/Slot.tsx:33-35,67`
  - commit: `99cbe6704` (PR #3237); ChatView moved to `./slot-layout` (see the ChatView area's entry)
- Docs impact:
  - `02-ui-components/11-chat-view.md` (if it shows CSS on these wrappers; not found by grep)
- Example needed: no

### BC-076: CSS, Thread: `str-chat__thread--virtualized` is no longer applied

- Status: confirmed
- Area: CSS (Thread)
- User impact: app CSS keyed on `.str-chat__thread--virtualized` stops matching. The SDK stylesheet never styled it.
- Old API:
  - `str-chat__thread--virtualized` on the thread container when `Thread virtualized`
- Replacement: none on the container. Scope by the list you render instead (`.str-chat__thread .str-chat__virtual-list` or your own class on the child list).
- Evidence:
  - `release-v14:src/components/Thread/Thread.tsx:150-154`
  - `master:src/components/Thread/Thread.tsx:104-107` `customClasses?.thread || 'str-chat__thread-container str-chat__thread'`
  - commit: `c2136f307 refactor!: align Thread with Channel - instance prop, provider, children` (PR #3289)
- Docs impact:
  - none found
- Example needed: no

### BC-077: quote and edit previews set their text colour from the matching bubble token

- Status: confirmed
- Area: composer styling
- User impact: visual change. `.str-chat__quoted-message-preview` now sets `color: var(--str-chat__chat-text-incoming)`, and `--own` sets `var(--str-chat__chat-text-outgoing)`. In v14 the text inherited the surrounding colour and the message text was always the incoming colour. Overrides written to fix the v14 contrast may now double-apply.
- Old API:
  - CSS of `.str-chat__quoted-message-preview` / `.str-chat__quoted-message-preview--own`
- Replacement: theme via `--str-chat__chat-text-incoming` / `--str-chat__chat-text-outgoing`, and remove contrast workarounds.
- Evidence:
  - `release-v14:src/components/MessageComposer/styling/QuotedMessagePreview.scss:11-16,56-60,102-104` → `master:...:11-17,57-61,103-107`
- Docs impact:
  - `02-ui-components/02-theming/01-themingv2.md` (line 152 text-colour note)
- Example needed: no (the guide section is accurate)

## Pending (open PRs)

- `GetStream/stream-chat-react#3306` `feat: adopt TS generator changes` (open, targets `master`). It changes the request shapes for sending, editing and deleting messages, reactions, reminders and poll-option suggestions to follow `GetStream/stream-chat-js#1896`. If it merges before the stable release, re-run the surface diff and update the request-handler entries (search this file for `sendMessageRequest`).

## Not yet ported from v14

These are fixes that landed on `release-v14` after the branch point and are missing from `master`. They are not API breaks, but an upgrading app would see the old behavior return.

- `b470bef37 fix: put unread separator above system messages and stop scrolling the host page on scroll to a message` (`GetStream/stream-chat-react#3305`). `master` has neither the `preventScroll` focus nor the separator placement change.

### Unported fix: autofocus scrolls the host page again (unported v14 fix)

- Status: confirmed (the source difference); likely unintended
- Area: message composer (behavior)
- User impact: silent behavior change. With `MessageComposer focus` (and on the textarea's re-focus after attachment, quote or `focus` changes), v14 focused with `{ preventScroll: true }`. v15 calls `focus()`, so a chat embedded in a scrolling page can scroll the page to the composer.
- Old API:
  - `MessageComposer.focus` autofocus behavior
- Replacement: none. This looks like a v14 fix that was never ported, not an intended change. Recommend porting it (two call sites) instead of documenting it.
- Evidence:
  - `release-v14:src/components/MessageComposer/hooks/useTextareaRef.ts:10` (`focus({ preventScroll: true })`) and `release-v14:src/components/TextareaComposer/TextareaComposer.tsx:366`
  - `master:src/components/MessageComposer/hooks/useTextareaRef.ts:10` and `master:src/components/TextareaComposer/TextareaComposer.tsx:367` (`focus()`)
  - commit (v14 only): `b470bef37 fix: put unread separator above system messages and stop scrolling the host page on scroll to a message` (PR #3305); `git log -S preventScroll` on master finds nothing
- Docs impact:
  - none
- Example needed: no

## Coverage Map And Ruled Out

Every item the surface diff, the corpus, `ai-migration-v14-v15.md` and the `!` commits reported is mapped below to an entry or to `ruled-out` with a reason. Duplicate drafts merged into one entry: CHN-08 -> BC-007, CHN-19 -> BC-051, CHN-21 -> BC-073, CHN-36 -> BC-067, CMP-09 -> BC-050, CMP-11 -> BC-067, MSG-03 -> BC-007, MSG-11 -> BC-004, MSG-14 -> BC-066, MSG-15 -> BC-024, MSG-25 -> BC-067, XC-06 -> BC-020.

### Channel, navigation and layout (CHN)

#### diff.md "Removed exports" (area items)

| Item                                                                                                                                                                             | Mapping                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `useChannelEditMessageHandler`                                                                                                                                                   | BC-023                                                                                                             |
| `useChannelMentionsHandler`                                                                                                                                                      | BC-025                                                                                                             |
| `ChannelListUI`, `ChannelListUIProps`                                                                                                                                            | BC-029                                                                                                             |
| `CustomQueryChannelParams`, `CustomQueryChannelsFn`, `EffectiveQueryParams`, `usePaginatedChannels`, `useConnectionRecoveredListener`                                            | BC-030                                                                                                             |
| `extractSortValue`, `findLastPinnedChannelIndex`, `isChannelArchived`, `isChannelPinned`, `moveChannelUpwards`, `shouldConsiderArchivedChannels`, `shouldConsiderPinnedChannels` | BC-031                                                                                                             |
| `ThreadsViewContextValue`, `useThreadsViewContext`                                                                                                                               | BC-012                                                                                                             |
| `useLegacyThreadContext`                                                                                                                                                         | BC-035                                                                                                             |
| `Window`, `WindowProps`                                                                                                                                                          | BC-010                                                                                                             |
| `getChannel`                                                                                                                                                                     | BC-020                                                                                                             |
| `ChannelUnreadUiState` (types)                                                                                                                                                   | ruled-out: other area (message list unread state; only referenced here by the removed `doMarkReadRequest`, BC-023) |
| `ChannelActionContext`/`ChannelStateContext`/`TypingContext` family                                                                                                              | ruled-out: other area (contexts); `Channel` no longer providing them is noted in BC-027                            |

#### diff.md "Moved between entrypoints" (all 12)

`ChatView`, `ChatViewChannelsSelectorButton`, `ChatViewContext`, `ChatViewSelectorButton`, `ChatViewSelectorEntry`, `ChatViewSelectorItem`, `ChatViewSelectorItemProps`, `ChatViewSelectorProps`, `ChatViewThreadsSelectorButton`, `defaultChatViewSelectorItemSet`, `useActiveThread`, `useChatViewContext` -> BC-011 (shape changes of `ChatView` / `ChatViewContext` -> BC-012)

#### diff.md "Changed", gated items

| Item                                                                                                                                                                                                                                        | Mapping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `Channel.channel` / `ChannelProps.channel` now required                                                                                                                                                                                     | BC-019                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.EmptyPlaceholder`                                                                                                                                                                                                                  | BC-019                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.initializeOnMount`, `Channel.channelQueryOptions`                                                                                                                                                                                  | BC-020                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.activeUnreadHandler`                                                                                                                                                                                                               | BC-021                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.markReadOnMount`                                                                                                                                                                                                                   | BC-022                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.doDeleteMessageRequest`, `doMarkReadRequest`, `doSendMessageRequest`, `doUpdateMessageRequest`                                                                                                                                     | BC-023                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.giphyVersion`, `imageAttachmentSizeHandler`, `videoAttachmentSizeHandler`, `shouldGenerateVideoThumbnail`                                                                                                                          | BC-024                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.onMentionsClick`, `Channel.onMentionsHover`                                                                                                                                                                                        | BC-025                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.skipMessageDataMemoization`                                                                                                                                                                                                        | BC-026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Channel.allowConcurrentAudioPlayback`                                                                                                                                                                                                      | BC-051                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| (all of the above as `ChannelProps.*` member-removed)                                                                                                                                                                                       | same mappings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `ChannelList.*` / `ChannelListProps.*` 26 removed props, `paginator` added required                                                                                                                                                         | BC-028 (`EmptyStateIndicator`, `Paginator`, `renderChannels` also BC-029; `getLatestMessagePreview` also BC-033; `customActiveChannel`, `setActiveChannelOnMount` also BC-013)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `useChannelMembershipState.*` now-required / added-required `custom`                                                                                                                                                                        | BC-070 (LLC-typed umbrella)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ChannelListItem.*` / `ChannelListItemProps.*` `channelUpdateCount`, `getLatestMessagePreview`, `key`, `setActiveChannel`, `watchers`                                                                                                       | BC-033                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChannelListItemTimestamp.lastMessage` / `ChannelListItemTimestampProps.lastMessage`                                                                                                                                                        | BC-033                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChannelListItemUI.*` / `ChannelListItemUIProps.*` incl. `lastMessage`, `latestMessagePreview`                                                                                                                                              | BC-033                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `defaultChannelListItemLabelParts` value-changed                                                                                                                                                                                            | ruled-out: i18n keys only -> BC-067                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `getLatestMessagePreview`, `getLatestMessagePreviewText` signature-changed                                                                                                                                                                  | ruled-out: only `t: StreamTFunction` / `userLanguage: string` (i18n) -> BC-067                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `Chat.defaultLanguage`, `ChatProps.defaultLanguage`, `UseChatParams.defaultLanguage`, `UseChatParams.i18nInstance`                                                                                                                          | BC-017                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `useChat.channel`, `useChat.setActiveChannel`                                                                                                                                                                                               | BC-013, BC-017                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `useChat.latestMessageDatesByChannels`                                                                                                                                                                                                      | BC-015, BC-017                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `useChat.translators`                                                                                                                                                                                                                       | BC-017                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `useCreateChatClient` signature-changed                                                                                                                                                                                                     | BC-018                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChatViewContext.activeChatView`/`setActiveChatView` removed; `activeView`, `entityInferers`, `layoutController`, `registerViewActionSlotResolvers`, `resolveActionTargetSlot`, `setActiveView` added required (and `useChatViewContext.*`) | BC-012                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `InfiniteScrollPaginator` props-mass-removed, `InfiniteScrollPaginatorProps` members-mass-removed + type-params-changed                                                                                                                     | ruled-out: diff artifact. The component became polymorphic (`element?: C`, `C extends ElementType = 'div'`) and forwards `ref`; its props are `PropsWithChildren<OwnProps & { element?: C } & Omit<ComponentPropsWithRef<C>, ...>>`, so every `div` prop is still accepted and `InfiniteScrollPaginatorProps` without a type argument still means the `div` form. Own props (`contentProps`, `listenToScroll`, `loadNextDebounceMs`, `loadNextOnScrollToBottom`, `loadNextOnScrollToTop`, `threshold`, `useCapture`) are unchanged (`release-v14:src/components/InfiniteScrollPaginator/InfiniteScrollPaginator.tsx:17-36` vs `master:...:18-56`). Additive. |
| `NotificationApi.ensureNotificationTimeout` / `useNotificationApi.ensureNotificationTimeout` added required                                                                                                                                 | ruled-out: new member on the object `useNotificationApi()` returns; only breaks code that implements `NotificationApi` by hand (mocks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `Thread.*` / `ThreadProps.*` removed props, `thread` added required                                                                                                                                                                         | BC-035                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ThreadHeader.closeThread`, `ThreadHeader.thread` (and `ThreadHeaderProps.*`)                                                                                                                                                               | BC-036                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `defaultThreadListItemLabelParts` value-changed                                                                                                                                                                                             | ruled-out: i18n keys only -> BC-067                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ThreadContext.*` / `ThreadContextValue.*` removed / added-required (`deactivate`, `loadNextPage`, `loadPrevPage`, `queryReplies`, `config`, `messagePaginator`, `handle*`, ...)                                                            | ruled-out: LLC (stream-chat v10). `ThreadContextValue` is `Thread                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | undefined`, the stream-chat class |
| `ChannelListContext.*` / `ChannelListContextValue.*` / `useChannelListContext.*` `channels`, `hasNextPage`, `loadNextPage`, `setChannels`                                                                                                   | BC-032                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChatContext.channel` / `ChatContextValue.channel` / `useChatContext.channel`                                                                                                                                                               | BC-013                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChatContext.channelsQueryState` (+ value, hook)                                                                                                                                                                                            | BC-014                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChatContext.latestMessageDatesByChannels` (+ value, hook)                                                                                                                                                                                  | BC-015                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChatContext.setActiveChannel` (+ value, hook)                                                                                                                                                                                              | BC-013                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ChatContext.channelManager` (+ value, hook) added required                                                                                                                                                                                 | BC-016                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `useChatContext` signature-changed                                                                                                                                                                                                          | BC-016                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ComponentContext.ChannelListUI` (+ value, hook)                                                                                                                                                                                            | BC-029                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ComponentContext.HeaderStartContent` (+ value, hook)                                                                                                                                                                                       | BC-034                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ComponentContext.ThreadHeader` (+ value, hook)                                                                                                                                                                                             | BC-036                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ComponentContext.Message`, `useComponentContext` signature, `MessageContext.*`, `MessageComposerContext.*`, `MessageListContext.*`, `TranslationContext.*`, `MessageBounceContext`                                                         | ruled-out: other areas (message, composer, message list, i18n, contexts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Non-gated items checked and ruled out: `Chat.isMessageAIGenerated`, `SummarizedMessagePreview.latestMessage`, `UseLatestMessagePreviewParams.latestMessage`, `ChannelListItemLabelData.*`, `ThreadListItemLabelData.*`, `ChannelFileItem`/`ChannelMediaItem`/`ChannelMemberDetail`/`ChannelMembersBrowseView`/`useChannelMemberActionContext`/`useChannelMembersSearch`/`usePinnedMessagesSearch` (channel-detail plugin, LLC underlying types only), `DialogManager.state` (`StateStore` now from `@stream-io/state-store`, same shape), `EmptyStateIndicator.listType` and `LoadingIndicator.textAnchor` (union member order only), `DEFAULT_CHANNEL_LIST_ITEM_LABEL_ORDER` (union order only), `InfiniteScroll.LoadingIndicator` / `LoadMorePaginator.LoadingIndicator` (`BaseIconProps`, icons area), `Search` item types (BC-070), `AttachmentUploadedSizeIndicator` (attachments area). Modal: no API change (one line in `CloseButtonOnModalOverlay.tsx`, CSS only).

#### diff.md "CSS / Classes removed from markup"

| Class                                                                                                 | Mapping                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `str-chat__channel-list-inner`, `str-chat__channel-list-inner__main`                                  | BC-074                                                                                                                                                                                      |
| `str-chat__main-panel`, `str-chat__main-panel---with-thread-opn`, `str-chat__main-panel--thread-open` | BC-073 (with BC-010)                                                                                                                                                                        |
| `str-chat__thread--virtualized`                                                                       | BC-073                                                                                                                                                                                      |
| `str-chat__chat-view__channels`, `str-chat__chat-view__threads`                                       | ruled-out: false positive. v15 `ChatView` still renders them through a template literal (`master:src/plugins/SlotLayout/ChatView.tsx` ``className={`str-chat__chat-view__${activeView}`}``) |
| (missed by the tool) `str-chat__container`                                                            | BC-073                                                                                                                                                                                      |

#### corpus-new.txt lines in this area

| Corpus line                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Mapping                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `Window` TS2305 (`01-getting_started__1:7`, `03-chat__01-chat__5:10`, `04-channel__01-channel__4:11`, `04-channel__05-component_context__2:9`, `__3:8`, `05-channel-list__05-channel_search__1:11`, `07-message-list__01-message_list__2:8`, `02-virtualized_list__1:8`, `05-thread__1:9`, `__2:9`, `08-message__01-message__1:9`, `03-message_bounce_context__2:9`, `05-message_ui__1:9`, `10-poll__1:9`, `12-reactions__2:12`, `13-date_separator__2:10`, `09-message-composer__01-message_composer__1/2/3`, `04-input_ui__1:10`, `10-channel-detail__02-avatar-with-channel-detail__2:3`, `03-ui-cookbook__02-channel-list__02-channel_search__3:12`, `05-message-composer__01-input_ui__3:10`, `06-attachment__02-image_gallery__3:11`, `03-geolocation_attachment__2:10`, `08-app_menu__2:13`, `09-channel_header__2:10`, `12-collapsible-sidebar__3:11`, `13-accessibility__03-skip-navigation__1:9`, `04-guides__05-channel_read_state__3:10`, `13-notifications__12:10`, `16-ai-integrations__02-chat-sdk-integration__3:9`, `__5:9`, `05-experimental-features__01-message-actions__2:11`, `06-release-guides__01-upgrade-to-v14__12/13/26`, tutorial `3-core-component-setup:12`, `4-channel-list:11`, `5-theming:11`, `6-custom-ui-components:15`, `7-emoji-picker:12`, `optional-custom-attachment-type:17`, `optional-livestream:10`, vite `Panels.tsx:22`) | BC-010                                                                            |
| `paginator` missing TS2741 (14 docs lines listed in BC-028)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | BC-028                                                                            |
| `ChannelListProps` TS2322 on `sort`/`filters`/`options`/`showChannelSearch`/`Paginator`/`customActiveChannel` (docs + tutorial + vite lines listed in BC-028)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | BC-028                                                                            |
| `02-ui-components__01-getting_started__2.tsx:15` `options` not in `useCreateChatClient` params                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | BC-018                                                                            |
| `02-ui-components__01-getting_started__2.tsx:4` `StreamChatOptions` not exported from stream-chat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ruled-out: LLC (stream-chat v10); the React side is BC-018                        |
| `02-ui-components__04-channel__01-channel__7.tsx:3` `ChannelQueryOptions` not exported from stream-chat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ruled-out: LLC; the prop it typed is BC-020                                       |
| `02-ui-components__05-channel-list__01-channel_list__3.tsx:6`, `02-channel_list_context__2.tsx:8-9`, `06-release-guides__01-upgrade-to-v14__16.tsx:6` (`ChannelListUI`, `ChannelListUIProps`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | BC-029                                                                            |
| `02-ui-components__05-channel-list__01-channel_list__7.tsx:12` `CustomQueryChannelParams`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | BC-030                                                                            |
| `02-ui-components__05-channel-list__01-channel_list__7.tsx:9` `ChannelSort`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ruled-out: LLC                                                                    |
| `02-ui-components__05-channel-list__01-channel_list__8.tsx:8` `recoverStateOnReconnect` not in `InstanceConfigTree`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ruled-out: LLC (`new StreamChat(...)` options)                                    |
| `02-ui-components__05-channel-list__02-channel_list_context__1.tsx:6` (x2), `__2.tsx:23`, `04-guides__07-sdk-state-management__2.tsx:12`, `06-release-guides__01-upgrade-to-v14__11.tsx:6,9`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | BC-032                                                                            |
| `02-ui-components__05-channel-list__02-channel_list_context__2.tsx:11` `getChannel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | BC-020                                                                            |
| `02-ui-components__05-channel-list__02-channel_list_context__2.tsx:33` `queriedChannels` on `Event`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ruled-out: LLC                                                                    |
| `02-ui-components__05-channel-list__08-advanced-search__3.tsx:16` `last_message_at` in `SortParamRequest[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ruled-out: LLC (search source sort type)                                          |
| `02-ui-components__06-thread-list__01-thread-list__2.tsx:3`, `11-chat-view__1.tsx:7`, `11-chat-view__3.tsx:4`, `06-release-guides__01-upgrade-to-v14__28.tsx:3` (`ChatView`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | BC-011                                                                            |
| `02-ui-components__11-chat-view__3.tsx:8` `useThreadsViewContext`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | BC-012                                                                            |
| `03-ui-cookbook__02-channel-list__01-channel_list_preview__2.tsx:34` `lastMessage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | BC-033                                                                            |
| `03-ui-cookbook__02-channel-list__03-channel-user-lists__3.tsx:14` `user` on `Event`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ruled-out: LLC                                                                    |
| `03-ui-cookbook__10-thread_header__1.tsx:6,8`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | BC-036                                                                            |
| `03-ui-cookbook__13-accessibility__03-skip-navigation__2.tsx:3` `useChatViewContext`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | BC-011 (field rename BC-012)                                                      |
| `03-ui-cookbook__13-accessibility__01-accessible-list-labels__1.tsx:44` `filters`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | BC-028                                                                            |
| `04-guides__07-sdk-state-management__5.tsx:13`, `__6.tsx:7`, vite `Sync.tsx:126-128` (`ThreadManagerState.threads`/`pagination`/`ready`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ruled-out: LLC (thread list moved to `client.threads.paginator`); noted in BC-038 |
| `04-guides__11-blocking-users__4.tsx:15` `useChatContext("...")` TS2554                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | BC-016                                                                            |
| vite `Panels.tsx:145`, `Debug/ComposerStateDialog.tsx:39`, `Debug/StreamDebugHandles.tsx:25` `useChatContext('...')` TS2554                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | BC-016 (and BC-013 for the `channel` field they read)                             |
| vite `Panels.tsx:177` (`customActiveChannel`, `filters`, `onRemovedFromChannel`, `options`, `showChannelSearch`, `sort`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | BC-028                                                                            |
| vite `Panels.tsx:10-11`, `Sync.tsx:4,6`, `App.tsx:25`, `AppSettings.tsx:4`, `Sidebar/ChatViewSelectorItemSet.tsx:2-3`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | BC-011                                                                            |
| vite `Panels.tsx:20`, `Sync.tsx:8` `useThreadsViewContext`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | BC-012                                                                            |
| tutorial `6-custom-ui-components/App.tsx:42` `latestMessagePreview`, `:44` `setActiveChannel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | BC-033 (and BC-013)                                                               |
| tutorial `*/App.tsx` `ChannelSort` TS2305, `name` not in `User`; `6-custom-ui-components/App.tsx:73-78` `ChannelResponse` fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ruled-out: LLC                                                                    |
| vite `Panels.tsx:2`, `App.tsx:5` `ChannelSort`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ruled-out: LLC                                                                    |
| `04-guides__15-audio-playback__1.tsx:7` `allowConcurrentPlayback` on `WithAudioPlayback`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ruled-out: AudioPlayback area (the `Channel` prop is BC-051)                      |
| `ChannelStateContext`/`ChannelActionContext`/`TypingContext` imports (`04-channel__01-channel__3`, `02-channel_header__3`, many others)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ruled-out: contexts area                                                          |

#### `ai-migration-v14-v15.md` headings in this area

| Heading                                                                                         | Mapping / verification                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChatContext.setActiveChannel` -> removed                                                       | BC-013. Inaccurate detail: it says `open({ key, kind: 'channel', source })` is "the mechanism `ChannelListItemUI` uses on selection"; v15 `ChannelListItemUI` calls `useWorkspaceNavigation().openChannel(channel, { event })` (`ChannelListItemUI.tsx:95-102`) |
| `ChatContext.channelsQueryState` -> removed                                                     | BC-014. Inaccurate: it says `Channel`'s loading / error / empty rendering is driven by its own `watch()` (`LoadingIndicator`, `LoadingErrorIndicator`, `EmptyPlaceholder`). v15 `Channel` renders none of these and does not watch (BC-019, BC-020)             |
| `Channel` no longer queries the channel; `initializeOnMount` / `channelQueryOptions` -> removed | BC-020. Verified                                                                                                                                                                                                                                                |
| `ChannelProps.channel` is required; `EmptyPlaceholder` -> removed                               | BC-019. Verified                                                                                                                                                                                                                                                |
| `Channel` no longer writes `document.title`; `activeUnreadHandler` -> removed                   | BC-021. Verified (did not verify `examples/vite/src/DocumentTitleManager` contents)                                                                                                                                                                             |
| `channel.channelMissing.text` translation key -> removed                                        | BC-067 (i18n)                                                                                                                                                                                                                                                   |
| `allowConcurrentAudioPlayback` -> removed                                                       | BC-051 (Channel prop); rest belongs to AudioPlayback area                                                                                                                                                                                                       |
| `ChatContext.latestMessageDatesByChannels` -> removed                                           | BC-015. Names `useIsCooldownActive` as a replacement hook; accurate since `fix/v15-dead-surface-cleanup` exported it from `src/components/MessageComposer/hooks/index.ts` (before that only `useCooldownRemaining` was public)                                  |
| `Channel` no longer jumps to a searched message                                                 | BC-027, BC-039. Verified                                                                                                                                                                                                                                        |
| `ChannelListItem` `getLatestMessagePreview` prop -> removed                                     | BC-033. Two inaccuracies (util still exported; no `Chat`/`Channel` component props)                                                                                                                                                                             |
| `Thread` renders children; its composition props are removed                                    | BC-035. Inaccurate: `Thread` does not register the thread with the `ThreadManager`                                                                                                                                                                              |
| `ComponentContext.HeaderStartContent` -> removed                                                | BC-034. Verified                                                                                                                                                                                                                                                |
| `disableDateSeparator` -> `withDateSeparator`; `Thread.enableDateSeparator` -> removed          | BC-035 (Thread half); list rename belongs to the message-list area                                                                                                                                                                                              |
| Message UI overrides consolidate on the `MessageUI` slot                                        | `Thread.Message` row -> BC-035; rest other area                                                                                                                                                                                                                 |
| `messageActions` / `MESSAGE_ACTIONS` -> removed                                                 | `Thread.messageActions` -> BC-035; rest other area                                                                                                                                                                                                              |
| Context hooks: no `componentName` argument / Required contexts throw                            | BC-016, BC-007 (rows for `useChatContext`, `useChatViewContext`, `useChannelListItemContext`, `useSearchContext`, `useSearchSourceResultsContext`, `useDialogManager`, `useContextMenuContext`)                                                                 |
| Related type changes (`ChatViewContext` has no default)                                         | BC-012                                                                                                                                                                                                                                                          |
| Per-component request-handler props removed                                                     | BC-023. Inaccurate: says removed "from both `<Channel>` and `<Thread>`"; v14 `Thread` never had them (`release-v14:src/components/Thread/Thread.tsx:26-45`); they were v15-only on `Thread`                                                                     |
| `<Channel>` declares the channel active, and owns its message window                            | BC-027. Outdated: the `connection.recovered` -> `channel.reload()` part was removed by `3098a90a6`                                                                                                                                                              |
| The core v15 shift / Removed `ChannelStateContext` / `ChannelActionContext`                     | ruled-out: contexts area                                                                                                                                                                                                                                        |

#### `!` commits (and BREAKING CHANGE bodies) touching this area

| Commit                                                                                                                                                                  | Mapping                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `088c795c1 feat(Channel)!: ...` (#3286)                                                                                                                                 | BC-015, 11, 12, 13, 20, 33, 36                                                                                         |
| `68999a7b3 feat(AudioPlayback)!: ...` (#3287)                                                                                                                           | BC-051                                                                                                                 |
| `b541c45f9 refactor(MessageActions)!: ...` (#3288)                                                                                                                      | BC-035 (`Thread.messageActions`)                                                                                       |
| `c2136f307 refactor!: align Thread with Channel ...` (#3289)                                                                                                            | BC-073, 29, 30                                                                                                         |
| `66557d63b feat!: port the tutorial alignment ...` (#3301)                                                                                                              | BC-012, 28 (its `ChatView maxSlots/minSlots/slotNames` removal was v15-only: ruled-out, never released in v14)         |
| `a41eed56f feat!: replace StreamChat.activeChannels ...` (#3310)                                                                                                        | BC-020 (`getChannel`), 20, 32, 33; `client.activeChannels` etc. ruled-out: LLC                                         |
| `557ffcb3c feat!: pass the stream-chat configuration tree through useCreateChatClient` (#3321)                                                                          | BC-018                                                                                                                 |
| `f68cad332 refactor(i18n)!`, `eb3ae7a5d refactor(i18n)!` (#3271, #3284)                                                                                                 | BC-017, BC-067                                                                                                         |
| `cb472c35f feat!`, `aaa7fa31e feat!` (timestamps, #3278, #3297)                                                                                                         | BC-070                                                                                                                 |
| `3098a90a6 feat: use network and WS connection observer services from LLC` (#3281, BREAKING CHANGE in body)                                                             | BC-027, BC-040                                                                                                         |
| `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (#3237, no `!` but the main source of this area's removals) | BC-010..05, 14..18, 21..27, 31, 32                                                                                     |
| `f66597a13 feat: use configuration service API as a single source of truth` (#3273, BREAKING CHANGE in body)                                                            | BC-023, 16                                                                                                             |
| `9194215f0 feat(context): drop componentName param ...` (#3267)                                                                                                         | BC-016, 08                                                                                                             |
| `be2c8e1e7 feat: rename ChannelPaginatorsOrchestrator to ChannelManager` (#3258)                                                                                        | ruled-out for v14 users (`channelPaginatorsOrchestrator` never existed in v14); `channelManager` requirement -> BC-016 |
| `14e58601f feat(MessageComposer)!` (#3299)                                                                                                                              | ruled-out: composer area                                                                                               |

### Message composer (CMP)

#### diff.md: Removed exports

- `AIStates` → BC-050
- `getAttachmentPreviewUrl` → BC-066
- `hasPendingUploadState` → BC-066
- `isUploadConfirmationPending` → BC-066
- `useChannelEditMessageHandler` → ruled-out: covered by CHN (removed with the `do*Request` props; replacement is an `updateMessageRequest` handler, same wording as BC-060)
- `useChannelMentionsHandler` → ruled-out: covered by CHN/MSG (Channel mention props)

#### diff.md: Moved between entrypoints

- none in this area

#### diff.md: Changed (gated / bold items in this area)

- `DefaultAttachmentSelectorComponents` (value-changed) → ruled-out: same keys (`Command`, `File`, `Location`, `Poll`, `release-v14 AttachmentSelector.tsx:165` vs `master:174`); only the translation keys inside changed (BC-067)
- `MessageComposer.overrideSubmitHandler`, `MessageComposerProps.overrideSubmitHandler` → BC-060
- `MessageComposer.preventClearingOnUnmount`, `MessageComposerProps.preventClearingOnUnmount` → BC-061
- `useAttachmentManagerState.hasCustomDoUploadRequest` (removed) → BC-064
- `useAttachmentManagerState.attachmentsEnabled` / `customCdn` / `locationEnabled` / `maxNumberOfFilesPerMessage` / `pollsEnabled` (added-required) → BC-064 (additive for consumers; affects only mocks of the return type)
- `useMessageComposerBindings.handleSubmit`, `UseMessageComposerBindingsParams.handleSubmit` → BC-062
- `useMessageComposerController.applyServerRestrictions` / `defaultSubmitTarget` / `initializeConfig` / `requestedConfig` / `retainsCompositionOnSubmit` / `send` / `transferTo` / `update` (added-required) → ruled-out: LLC (stream-chat v10); the hook returns the LLC `MessageComposer` instance, and new members are additive
- `DefaultSuggestionListItemEntity.anon` / `channel_last_read_at` / `notifications_muted` / `privacy_settings` / `push_notifications` / `shadow_banned` / `username` (removed) → BC-072
- `MessageComposerContext.handleSubmit`, `MessageComposerContextValue.handleSubmit`, `useMessageComposerContext.handleSubmit` → BC-062
- `MessageComposerContextValue.overrideSubmitHandler`, `useMessageComposerContext.overrideSubmitHandler` → BC-060
- `MessageComposerContextValue.preventClearingOnUnmount`, `useMessageComposerContext.preventClearingOnUnmount` → BC-061
- `useMessageComposerContext` (signature-changed) → BC-008
- `useAttachmentsUploadState`, `useAttachmentUploadState` (signature-changed, in `useAttachmentUploadState.ts`) → ruled-out: only the order of the parameter's union members changed (`Attachment | SharedLocationResponse | LocalAttachment` → `Attachment | LocalAttachment | SharedLocationResponse`); the types are identical
- Non-gated items judged breaking: `CommandChip.command`, `CommandItem.entity`, `MessageComposerCommand.command`, `QuotedMessagePreview(.UI).getQuotedMessageAuthor`, `QuotedMessagePreviewUI.quotedMessage`, `GeolocationPreviewProps.location`, `useAttachmentsForPreview.location`, `LinkPreviewCard.linkPreview`, `RecordingController.recording` → BC-072
- `plugins/AIComponents` (`useAIMessageComposerContext.*`, all non-gated) → ruled-out: `StateStore` now comes from `@stream-io/state-store` (same class, structurally identical); `Readonly<unknown[]>` → `readonly unknown[]` is the same type
- `local#MediaRecorderController.t` (`TFunction` → `StreamTFunction`) → BC-067
- `MessageComposerContext` (the context object) value type `UseMessageComposerBindingsParams | undefined` → `MessageComposerContextValue | undefined` → ruled-out: widened to the full value; `handleSubmit` part covered by BC-062

#### Request-handler props (coordination with CHN)

- `Channel.doSendMessageRequest` / `doUpdateMessageRequest` / `doDeleteMessageRequest` / `doMarkReadRequest` (and the `ChannelProps` members) → ruled-out: covered by CHN. BC-060 uses the same replacement wording (`client.config.set({ channel: { requestHandlers: { sendMessageRequest } } })`, handler `(params, defaultRequest) => Promise<{ message }>`).
- Facts verified for CHN's entry:
  1. `ai-migration-v14-v15.md` § "Per-component request-handler props removed" says the props are removed "from both `<Channel>` and `<Thread>`". On v14 (`release-v14:src/components/Thread/Thread.tsx`) `Thread` never had `do*Request` props, and only `Channel.tsx` references `doSendMessageRequest`. So for v14 integrators this is a `Channel`-only change.
  2. The same section names `channel.updateMessageWithLocalUpdate`, which does not exist in `stream-chat@10.0.0-rc.22`. Updates go through `messageOperations.update`.
  3. The handler's second argument, `defaultRequest`, is undocumented in the guide.
- `Channel.giphyVersion` (read by `QuotedMessagePreview` in v14) → ruled-out: covered by CHN. v15 reads `useAttachmentContext().giphyVersion` (`master:src/components/MessageComposer/QuotedMessagePreview.tsx:348`).
- `Thread.additionalMessageComposerProps` / `ThreadProps.additionalMessageComposerProps` → ruled-out: covered by THR
- legacy-thread composer (v14 `useMessageComposerController` built a `legacy_thread` composer from `useLegacyThreadContext`; removed on master) → ruled-out: covered by THR (`useLegacyThreadContext` removal, `Thread` requires a `thread` instance)

#### corpus-new.txt lines touching this area

- `docs/02-ui-components__09-message-composer__01-message_composer__4.tsx:6,12` → BC-060
- `examples/examples/vite/src/InlineEditMessage/InlineEditMessage.tsx:95` → BC-061
- `docs/03-ui-cookbook__07-emoji_picker__3.tsx:15` TS2554 → BC-008
- `docs/04-guides__16-ai-integrations__01-overview__9.tsx:5`, `docs/04-guides__16-ai-integrations__01-overview__10.tsx:4` → BC-050
- `docs/04-guides__16-ai-integrations__02-chat-sdk-integration__7.tsx:8` (`useChannelActionContext`) → ruled-out: covered by CTX for the import; the `sendMessage(composition)` migration is BC-062
- `docs/03-ui-cookbook__05-message-composer__02-link-previews__2.tsx:17,18,36` → BC-072 (LLC-typed `LinkPreview`)
- `docs/02-ui-components__09-message-composer__12-message_composer_middleware__22.tsx:16` and `examples/examples/vite/src/App.tsx:414` TS2352 (`EmojiMiddleware` → `TextComposerMiddleware` cast) → ruled-out: LLC (stream-chat v10). The v10 `Suggestion` union now includes `Command`, whose `args`, `description` and `set` are required, so an emoji suggestion is not comparable. `src/plugins/Emojis/middleware/textComposerEmojiMiddleware.ts` is byte-identical between v14 and v15. The v15 tutorial and vite examples (`examples/tutorial/src/7-emoji-picker/App.tsx:111`, `examples/vite/src/App.tsx:572`) keep the same `as TextComposerMiddleware` cast and are built with `tsc` in CI, so under `strict` it may still compile. Unverified: the corpus runs with `strict: false`.
- `docs/02-ui-components__09-message-composer__12-message_composer_middleware__21.tsx:13` (`ChannelWithId` lacks `label`) → ruled-out: LLC (stream-chat v10 `CustomTextComposerSuggestion`)
- `docs/02-ui-components__09-message-composer__12-message_composer_middleware__12.tsx:6,9,15,19,21,25`, `__18.tsx:7` (`UserSort`, `MemberSort`, search-source signatures) → ruled-out: LLC (stream-chat v10)
- `docs/04-guides__19-sending-messages-with-pending-uploads__1.tsx:3`, `examples/examples/vite/src/App.tsx:17` (`createSendWithPendingUploadsAttachmentsMiddleware`) → ruled-out: LLC (stream-chat v10). For the guide: the replacement is `client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled: true } } })` (`master:node_modules/stream-chat/src/messageComposer/configuration/types.ts:109`; examples.diff `examples/vite/src/App.tsx`).
- `docs/04-guides__16-ai-integrations__02-chat-sdk-integration__4.tsx:5` (`ai_generated` on `LocalMessage`) → ruled-out: LLC
- `docs/04-guides__16-ai-integrations__01-overview__9.tsx:10`, `__10.tsx:6` (`useChannelStateContext`), `docs/03-ui-cookbook__05-message-composer__06-suggestion_list__1.tsx:6` → ruled-out: covered by CTX
- `docs/03-ui-cookbook__05-message-composer__07-typing_indicator__1.tsx:6,8,14` (`useTypingContext`, `TypingIndicator.threadList`) → ruled-out: covered by CTX / message list area
- `docs/02-ui-components__09-message-composer__01-message_composer__1/2/3.tsx`, `__04-input_ui__1.tsx:10`, `03-ui-cookbook__05-message-composer__01-input_ui__3.tsx:10`, `04-guides__16-ai-integrations__02-chat-sdk-integration__3.tsx:9`, `__5.tsx:9` (`Window`) → ruled-out: covered by the layout area
- `examples/examples/vite/src/Debug/ComposerStateDialog.tsx:39` TS2554 (`useChatContext('ComposerStateDialog')`) → ruled-out: covered by CTX (context-hook umbrella)
- `examples/examples/vite/src/InlineEditMessage/InlineEditMessage.tsx:12` (`useChannelStateContext`) → ruled-out: covered by CTX; `:57,65,97` (`t()` keys) → BC-067 / i18n umbrella
- `docs/04-guides__18-accessibility__5.tsx:9` (`t('Upload complete')`) → ruled-out: i18n umbrella
- `examples/examples/tutorial/src/7-emoji-picker/App.tsx:2,12,25,70` → ruled-out: LLC (`ChannelSort`, `User.name`), layout (`Window`), channel list (`filters`); nothing composer-specific
- `docs/04-guides__17-mentions__1.tsx:5,14-17`, `__2.tsx:11` → ruled-out: LLC (stream-chat v10 client / user-group paginator APIs)

#### ai-migration-v14-v15.md headings in this area

- "`MessageComposer` `overrideSubmitHandler` prop → removed" → BC-060 (correction: `channel.sendMessageWithLocalUpdate()` does not exist)
- "`MessageComposer` `preventClearingOnUnmount` prop → removed" → BC-061 (verified)
- "Composer attachment previews: `UnsupportedAttachmentPreview` and `RemoveAttachmentPreviewButton` are exported" → ruled-out: additive, new root exports (`master:src/components/MessageComposer/index.ts:4,26`); nothing breaks
- "Quote and edit previews take the text colour paired with their background" → BC-077 (verified)
- "Context hooks: no `componentName` argument, and required contexts throw" → BC-008 for `useMessageComposerContext` (umbrella owned by CTX)
- "Attachment/poll availability now reads the composer's resolved config, not raw server flags" → BC-065 (correction about the File action)
- "`useAttachmentManagerState`: `hasCustomDoUploadRequest` → `customCdn`, plus the location and poll gates" → BC-064 (verified)
- "Per-component request-handler props removed — register them on `client.config`" → covered by CHN; see the coordination notes above
- "`AIStates` moves to `stream-chat`" → BC-050 (correction about `ai_indicator.stop`)
- "i18n: English-only bundle, namespaced translation keys" → BC-067 (key-map defect)

#### `!` / BREAKING commits touching this area

- `14e58601f feat(MessageComposer)!: let integrators supply the composer MessageComposer edits` (PR #3299) → BC-061 (and BC-062 for `useMessageComposerSubmitFn`)
- `f66597a13 feat: use configuration service API as a single source of truth` (PR #3273, `BREAKING CHANGE` footers) → BC-064, BC-065, BC-050; request-handler props covered by CHN
- `4f1459e54 feat(Attachment): render live upload progress on messages being sent` (PR #3295, `BREAKING CHANGE` footers) → BC-063, BC-066, BC-067. `useSendMessageFn` / `useUpdateMessageFn` → ruled-out: never shipped in v14 (absent from the v14 export surface)
- `99cbe6704 feat: migrate components from ChannelActionContext, ChannelStateContext to StateStore instances` (PR #3237, `BREAKING CHANGE`) → BC-060, BC-062, BC-072
- `9194215f0 feat(context): drop componentName param from context consumer hooks` (PR #3267) → BC-008
- `cb472c35f feat!: move to timestamps in response models` (PR #3278), `aaa7fa31e feat!: adopt stream-chat's branded TimestampNS` (PR #3297) → BC-072 (composer members only; the umbrella belongs to the cross-cutting dates entry)
- `f68cad332 refactor(i18n)!` (PR #3271), `eb3ae7a5d refactor(i18n)!` (PR #3284), `17c91bc70 feat(i18n)` (PR #3261) → BC-067
- `68999a7b3 feat(AudioPlayback)!` (PR #3287) → ruled-out: audio playback area (the recorder preview uses `useAudioPlayer`, and its props are unchanged)
- `c2136f307 refactor!: align Thread with Channel` (PR #3289) → ruled-out: covered by THR (`additionalMessageComposerProps`, legacy-thread composer)
- `e7ce32fa7 fix(EmojiPicker): drop @emoji-mart/react peer dependency on v15` (PR #3300) → ruled-out: v14 had already dropped `@emoji-mart/react` (both `package.json` files list only `emoji-mart` / `@emoji-mart/data` as optional peers); `stream-chat-react/emojis` exports the same API
- `9d1eacbd2 feat(ai-components): port the ai-components entry point (#3314) to v15` (PR #3315) → ruled-out for the component API (same exports, props and class names as 14.13; the `src/plugins/AIComponents` diff is only the `StateStore` import and `t()` keys) → BC-067 for the keys
- `06c0f3169` / `493383750 chore(MessageComposer): remove the empty EditMessageForm module` → ruled-out: the module was empty and never part of the v14 export surface

### Message rendering (MSG)

#### diff.md: Removed exports (area items)

- `AIStates` -> BC-050
- `getAttachmentPreviewUrl`, `hasPendingUploadState`, `isUploadConfirmationPending` -> BC-066
- `Capabilities`, `getMessageActions`, `MESSAGE_ACTIONS`, `MessageActionsArray`, `OPTIONAL_MESSAGE_ACTIONS` -> BC-041
- `TypingContext`, `TypingContextValue`, `TypingProvider`, `useTypingContext` -> BC-004
- `ChannelUnreadUiState` (types) -> BC-054
- `RetrySendMessage` (context) -> BC-003 (removed with `ChannelActionContext`); usage covered by BC-044

#### diff.md: Moved

- none in this area

#### diff.md: gated Changed items

- components/Attachment
  - `AttachmentActions.*` / `AttachmentActionsProps.*` / `Card.*` / `CardProps.*` `duration`, `file_size`, `latitude`, `longitude`, `mime_type`, `waveform_data` removed; `custom` added-required -> BC-071 (LLC `Attachment` type)
  - `useAttachmentsUploadState`, `useAttachmentUploadState` signature-changed -> ruled-out: the union members are only reordered, so the type is the same
- components/AudioPlayback
  - `WithAudioPlayback.allowConcurrentPlayback`, `WithAudioPlaybackProps.allowConcurrentPlayback` -> BC-051
- components/Message
  - `ACTIONS_NOT_WORKING_IN_THREAD` value-changed -> ruled-out: same runtime value `['pin','reply','markUnread']`, now written as literals; type is still `string[]`
  - `areMessagePropsEqual` -> BC-055
  - `getReadByTooltipText` -> ruled-out: I18N area (`t` is `StreamTFunction`)
  - `isMessageBlocked`, `isMessageBounced`, `isUserMuted` -> BC-071 (LLC)
  - `Message.Message`, `MessageProps.Message` -> BC-042
  - `Message.messageActions`, `MessageProps.messageActions` -> BC-041
  - `Message.retrySendMessage`, `MessageProps.retrySendMessage` -> BC-044
  - `MessageUI.actionsEnabled`, `MessageUI.getMessageActions`, `MessageUIComponentProps.actionsEnabled`, `.getMessageActions` -> BC-041
  - `MessageUI.messageIsUnread`, `MessageUI.mutes`, `MessageUIComponentProps.messageIsUnread`, `.mutes` -> BC-043
  - `RenderTextMentionEntity.anon` / `channel_last_read_at` / `notifications_muted` / `privacy_settings` / `push_notifications` / `shadow_banned` / `username` -> BC-071 (LLC `UserResponse`)
  - `usePinHandler.canPin` member-removed, `usePinHandler` return -> BC-052
  - `useRetryHandler` -> BC-044
  - `useUserRole.canPin` member-added-required -> ruled-out: additive return field
- components/MessageList
  - `getIsFirstUnreadMessage` -> BC-054
  - `insertIntro` -> BC-056
  - `MessageList.disableDateSeparator`, `MessageListProps.disableDateSeparator`, `ProcessMessagesParams.enableDateSeparator` -> BC-049
  - `MessageList.head`, `MessageListProps.head`, `MessageList.threadList`, `MessageListProps.threadList` -> BC-048
  - `MessageList.loadingMoreForJumpToChannelMessage`, `.loadMore`, `.loadMoreNewer` (+ `MessageListProps`) -> BC-046
  - `MessageList.Message`, `MessageListProps.Message`, `SharedMessageProps.Message` -> BC-042
  - `MessageList.messageActions`, `MessageListProps.messageActions`, `SharedMessageProps.messageActions` -> BC-041
  - `MessageList.openThread`, `MessageListProps.openThread` -> BC-045
  - `MessageList.retrySendMessage`, `MessageListProps.retrySendMessage`, `SharedMessageProps.retrySendMessage` -> BC-044
  - default-changed `MessageList.jumpToLatestMessage`, `MessageList.messageLimit` -> BC-046; `MessageList.messages` -> BC-047
  - `RenderedMessage.args` / `before_message_send_failed` / `channel` / `command_info` / `moderation_details` -> BC-071 (LLC `LocalMessage`)
  - `RenderMessagesOptions.channelUnreadUiState` now-required, `RenderMessagesOptions.channel` added-required -> BC-054
  - `ScrollToLatestMessageButton.threadList`, `ScrollToLatestMessageButtonProps.threadList` -> BC-048
  - `useEnrichedMessages`, `useNewMessageNotification`, `UseScrollLocationLogicParams.disableAutoScrollToBottom` / `.disableScrollManagement` -> BC-055
  - `VirtualizedMessageList.channelUnreadUiState` / `hasMore` / `hasMoreNewer` / `highlightedMessageId` / `loadingMore` / `loadingMoreNewer` / `loadMore` / `loadMoreNewer` / `messageLimit` (+ `VirtualizedMessageListProps`) -> BC-046
  - `VirtualizedMessageList.disableDateSeparator` (+ Props) -> BC-049
  - `VirtualizedMessageList.head`, `.threadList` (+ Props) -> BC-048
  - `VirtualizedMessageList.Message` (+ Props) -> BC-042
  - `VirtualizedMessageList.messageActions` (+ Props) -> BC-041
  - `VirtualizedMessageList.openThread` (+ Props) -> BC-045
  - `VirtuosoContext.firstUnreadMessageId` / `head` / `lastReadDate` / `lastReadMessageId` / `loadingMore` / `unreadMessageCount` now-required, `.channel` added-required -> BC-053
  - `VirtuosoContext.Message` -> BC-042 / BC-053; `.messageActions` -> BC-041 / BC-053; `.openThread` -> BC-045 / BC-053; `.threadList` -> BC-048 / BC-053
- components/TypingIndicator
  - `TypingIndicator.threadList`, `TypingIndicatorProps.threadList` -> BC-048 (and BC-004)
- context (message items only)
  - `ComponentContext.Message`, `ComponentContextValue.Message`, `useComponentContext.Message` -> BC-042
  - `MessageContext.actionsEnabled` / `getMessageActions` (+ `MessageContextValue`, `useMessageContext`) -> BC-041
  - `MessageContext.messageIsUnread` / `mutes` (+ `MessageContextValue`, `useMessageContext`) -> BC-043
  - `useMessageContext`, `useMessageListContext`, `useMessageBounceContext` signature-changed -> BC-007
  - `useComponentContext`, `useChatContext`, `useTranslationContext`, `useMessageComposerContext` signature-changed -> ruled-out here: CONTEXT / COMPOSER areas
- Non-gated items judged breaking, included anyway
  - `MessageList.internalInfiniteScrollProps` type -> BC-046
  - `MessageList.headerPosition` -> BC-056
  - `reactionDetailsSort` / `handleFetchReactions` / `handleDelete` / poll / location types -> BC-071
  - `MessageListContext.listElement` -> BC-055
- Referenced types
  - `local#DateSeparatorMessage` -> BC-057
  - `local#AttachmentProps` (added fields) -> BC-024
  - `local#AudioPlayerPool` -> ruled-out: internal (only reachable through the `pool` constructor option of `AudioPlayer`, which the SDK constructs)
  - `local#TimestampProps` -> ruled-out: widened, non-gated

#### corpus-new.txt (area lines)

- `docs/02-ui-components__08-message__01-message__2.tsx:5`, `:7` -> BC-042
- `docs/02-ui-components__08-message__05-message_ui__2.tsx:5`, `:7` -> BC-042
- `docs/02-ui-components__08-message__06-render-text__2.tsx:14` -> BC-042
- `docs/02-ui-components__08-message__04-message_hooks__4.tsx:7` -> BC-044
- `docs/03-ui-cookbook__04-message__02-reactions__4.tsx:15` -> BC-007; `:8`, `:16` (`useChannelStateContext`) -> BC-003
- `docs/03-ui-cookbook__04-message__04-message_actions__1.tsx:14`, `__2.tsx:12` -> BC-007
- `docs/04-guides__11-blocking-users__4.tsx:16` -> BC-007; `:15` (`useChatContext('…')`) -> BC-006 / BC-016
- `docs/02-ui-components__04-channel__01-channel__3.tsx:7`, `docs/02-ui-components__04-channel__02-channel_header__3.tsx:7`, `docs/03-ui-cookbook__05-message-composer__07-typing_indicator__1.tsx:8`, `docs/03-ui-cookbook__09-channel_header__1.tsx:8` -> BC-004
- `docs/03-ui-cookbook__05-message-composer__07-typing_indicator__1.tsx:14` -> BC-048
- `docs/04-guides__15-audio-playback__1.tsx:7` -> BC-051
- `docs/04-guides__16-ai-integrations__01-overview__9.tsx:5`, `__10.tsx:4` -> BC-050
- `docs/04-guides__16-ai-integrations__02-chat-sdk-integration__4.tsx:5` (`ai_generated` not on `LocalMessage`) -> ruled-out: LLC (stream-chat v10; moved to `message.custom.ai_generated`, see `examples.diff:333`)
- `docs/03-ui-cookbook__06-attachment__01-attachment_actions__5.tsx:13`, `:14`, `__6.tsx:67`, `:68` (`Action` needs `text`, `type`) -> ruled-out: LLC (stream-chat v10 `Action` type)
- `docs/03-ui-cookbook__06-attachment__03-geolocation_attachment__1.tsx:13`, `:14` (x2) -> BC-071
- `docs/04-guides__08-date-time-formatting__5.tsx:8` -> BC-067
- `examples/.../Reactions/ReactionsTab.tsx:138` -> BC-041; `:3`, `:4` -> BC-058 (provider exports themselves: BC-003)
- `examples/.../Reactions/reactionsExampleData.ts:9`, `:12`, `:65`, `:96`, `:120`, `:121` -> ruled-out: LLC (stream-chat v10 response types and `TimestampNS`)
- `examples/.../CustomMessageActions/ConfigurableMessageActions.tsx:119` -> BC-071; the TS2769 `t()` lines in the same file -> ruled-out: I18N area
- `examples/examples/tutorial/src/optional-custom-attachment-type/App.tsx:32`, `:59`, `:63`, `:66` (`image` / `url` / `name` not on `Attachment`) -> ruled-out: LLC (stream-chat v10 `Attachment`; custom fields live under `custom`)

#### ai-migration-v14-v15.md headings (area)

- "`messageActions` / `MESSAGE_ACTIONS` → removed; configure the action set instead" -> BC-041 (verified; note the guide says "in v15 changed nothing", but it means v14)
- "Message UI overrides consolidate on the `MessageUI` slot" -> BC-042 (verified)
- "Context hooks: no `componentName` argument, and required contexts throw" / "The optional `componentName` argument is removed" / "Required contexts throw outside their provider" -> BC-006 / BC-007
- "Related type changes" (gallery header bullet) -> BC-059; other bullets -> BC-007
- "`allowConcurrentAudioPlayback` → removed; …" -> BC-051 (guide error: `ThreadProps.allowConcurrentAudioPlayback` never existed)
- "`disableDateSeparator` → `withDateSeparator`; `Thread.enableDateSeparator` → removed" -> BC-049 (the guide's mention of `FloatingDateSeparator` / `useFloatingDateSeparator*` is about non-exported internals, so it is not integrator-facing)
- "`AIStates` moves to `stream-chat`" -> BC-050 (verified)
- "Dates on response types are unix-nanosecond numbers" / "The public React types that changed" / "`MessageList`'s `headerPosition` prop changed unit" -> BC-056, BC-057, BC-053, BC-071
- "Presentational props still take `Date`" -> ruled-out: no change (`DateSeparator.date: Date` unchanged)
- "Peer-dependency gate before release", "Test fixtures have to model the wire" -> ruled-out: maintainer notes, not integrator breaks
- "i18n: English-only bundle, namespaced translation keys" -> BC-067 (pointer only)
- "Removed: `ChannelStateContext` / `ChannelActionContext` and their hooks" -> BC-003. Note: `useMessagePaginator` (pointed to by AGENTS.md and PR #3237) is exported from the package root since `fix/v15-dead-surface-cleanup`; before that it was internal.
- "Per-component request-handler props removed — register them on `client.config`" -> BC-023; related: BC-044

#### `!` / BREAKING CHANGE commits touching this area

- `b541c45f9` (#3288) -> BC-041
- `07664893e` (#3268, BREAKING in body) -> BC-042
- `9194215f0` (#3267, BREAKING in body) -> BC-007, BC-058, BC-059
- `99cbe6704` (#3237, BREAKING in body) -> BC-043, -05, -06, -07, -08, -11, -15, -16, -18, -22, -23
- `68999a7b3` (#3287) -> BC-051
- `f66597a13` (#3273, BREAKING in body) -> BC-004 (typing gate), BC-050
- `c2136f307` (#3289) -> BC-048, BC-049
- `4f1459e54` (#3295, BREAKING in body) -> BC-044, BC-066
- `cb472c35f` (#3278) -> BC-056, BC-057, BC-071
- `aaa7fa31e` (#3297) -> BC-053, BC-056
- `f68cad332` (#3271), `eb3ae7a5d` (#3284) -> BC-067
- `088c795c1` (#3286) -> BC-046 (search jump via paginator); the rest is BC-019 / BC-020
- `14e58601f` (#3299) -> ruled-out: COMPOSER area
- `66557d63b` (#3301) -> ruled-out: CHANNELHEADER / SLOT-LAYOUT areas
- `a41eed56f` (#3310), `557ffcb3c` (#3321), `3098a90a6` (#3281), `a42c3cf97` (#3298) -> ruled-out: CHAT / CHANNEL-LIST / LLC areas

#### Unverified (kept as `likely`)

- BC-041: the existing guide's `defaultMessageActionSet.filter(({ type }) => …)` snippet should fail with `TS2339`, because `QuickDropdownToggleActionSetItem` has no `type`. That conclusion comes from reading the type, not from compiling. The draft uses an `'type' in item` guard instead.
- BC-045, BC-004 snippets: checked against V15 types by reading only; not compiled (the brief allows writing only this file, so no scratch compile was done).

### Cross-cutting (XC)

#### diff.md "Removed exports"

- `ChannelActionContext`, `ChannelActionContextValue`, `ChannelActionProvider`, `useChannelActionContext`, `MarkReadWrapperOptions`, `RetrySendMessage` -> BC-003
- `ChannelStateContext`, `ChannelStateContextValue`, `ChannelStateProvider`, `useChannelStateContext`, `ChannelState`, `ChannelNotifications` -> BC-003
- `TypingContext`, `TypingContextValue`, `TypingProvider`, `useTypingContext` -> BC-004
- `deTranslations`, `enTranslations`, `esTranslations`, `frTranslations`, `hiTranslations`, `itTranslations`, `jaTranslations`, `koTranslations`, `nlTranslations`, `ptTranslations`, `ruTranslations`, `trTranslations` -> BC-067
- `isLanguageSupported`, `SupportedTranslations` -> BC-067
- `DateFormatterOptions` -> BC-069
- `ChannelUnreadUiState` -> BC-009
- `getChannel` -> BC-020
- `Window`, `WindowProps` -> BC-073 (layout/CSS; flag if the Channel area also files it)

#### diff.md "Moved between entrypoints"

- all 12 (`ChatView` family, `useActiveThread`, `useChatViewContext`) -> not XC (ChatView / slot-layout area). Package-level export map in BC-001.

#### diff.md "Changed": gated items in XC scope

- `ComponentContext.ChannelListUI` / `ComponentContextValue.ChannelListUI` / `useComponentContext.ChannelListUI` (member-removed) -> BC-005
- `…HeaderStartContent` (×3) -> BC-005
- `…Message` (×3) -> BC-005
- `…ThreadHeader` (×3) -> BC-005
- `useComponentContext` signature-changed -> BC-006
- `useChatContext` signature-changed -> BC-006
- `useMessageBounceContext` signature-changed -> BC-006
- `useMessageComposerContext` signature-changed -> BC-006
- `useMessageContext` signature-changed -> BC-006
- `useMessageListContext` signature-changed -> BC-006
- `useTranslationContext` signature-changed -> BC-006
- `useComponentContextIcons.IconXCircle` member-added-required -> ruled-out: a member added to a hook's return value (`IconXCircle` was always in `icons.tsx`; `IconName` is now derived from the module), and nothing the consumer supplies changes
- `defaultTranslatorFunction` signature-changed -> BC-069
- `isDate` signature-changed -> BC-069
- `PredefinedFormatters.fromNowFormatter` member-added-required -> ruled-out: `Streami18nOptions.formatters` is `Partial<PredefinedFormatters> & CustomFormatters`, so consumers never supply a full `PredefinedFormatters`
- `Streami18n.addOrUpdateLocale`, `.Dayjs`, `.dayjsLocales`, `.getAvailableLanguages`, `.geti18Instance`, `.getTranslations`, `.getTranslators`, `.i18nextConfig`, `.isCustomDateTimeParser`, `.localeExists`, `.registerSetLanguageCallback`, `.setLanguageCallback`, `.translations`, `.validateCurrentLanguage` (member-removed, listed twice in diff) -> BC-069
- `Streami18n.overrideTFunction`, `.registeredLanguages`, `.state` (member-added-required) -> ruled-out: members added to a class the consumer instantiates; only breaks a hand-written structural `Streami18n` mock (noted in BC-069 replacements)
- `TDateTimeParserOutput` members-mass-removed -> BC-069
- `InfiniteScrollPaginator` / `InfiniteScrollPaginatorProps` props-mass-removed, members-mass-removed, type-params-changed -> ruled-out: tool artifact. `InfiniteScrollPaginatorProps<C extends ElementType = 'div'>` defaults to `'div'` and still includes `ComponentPropsWithRef<'div'>` (`master:src/components/InfiniteScrollPaginator/InfiniteScrollPaginator.tsx:44-53`), so a bare `InfiniteScrollPaginatorProps` keeps every div prop; the component is now polymorphic (`element`) and forwards `ref`
- `NotificationApi.ensureNotificationTimeout`, `useNotificationApi.ensureNotificationTimeout` (member-added-required) -> ruled-out: a member added to the hook's returned API; `startNotificationTimeout` still exists
- Non-gated but checked: `ComponentContext.LoadingIndicator` / `InfiniteScroll.LoadingIndicator` / `LoadMorePaginator.LoadingIndicator` (`SVGProps & { decorative? }` -> `BaseIconProps`) -> ruled-out: `BaseIconProps = ComponentProps<'svg'> & { decorative?: boolean }`, an equivalent type; `ComponentContext.icons` / `IconComponent` (`ComponentPropsWithoutRef<'svg'>` -> `BaseIconProps`) -> ruled-out: the new props are assignable to the old, so v14 icon overrides still type-check; all `Icon*.textAnchor` -> ruled-out: union member reorder; `IconComponent.defaultProps` etc. -> ruled-out: follows `BaseIconProps`; `DialogManager.state` -> ruled-out: `StateStore` now from `@stream-io/state-store` (single-copy requirement covered in BC-001); `TranslationContext.t` / `userLanguage` -> BC-068; `FormatterFactory`, `Translator` -> BC-069 / ruled-out (`Translator.t` widened to `LooseTranslateFunction`)
- Gated items in `ChatContext`, `ChannelListContext`, `MessageComposerContext`, `MessageContext`, `ThreadContext`, `VirtuosoContext` members -> not XC (owned by the Chat / ChannelList / composer / message / thread areas per the area split)

#### diff.md "Package"

- removed `dependencies:dayjs`, removed `dependencies:i18next`, added `dependencies:@stream-io/i18n`, added `dependencies:@stream-io/state-store`, changed `peerDependencies:stream-chat`, added `exports:./slot-geometry`, added `exports:./slot-layout` -> BC-001
- changed `dependencies:use-sync-external-store` `^1.6.0` -> `^1.7.0` -> ruled-out: minor-range bump of an internal dependency

#### diff.md "CSS"

- Classes removed from markup: `str-chat__main-panel`, `str-chat__main-panel---with-thread-opn`, `str-chat__main-panel--thread-open` -> BC-073; `str-chat__channel-list-inner`, `str-chat__channel-list-inner__main` -> BC-074; `str-chat__chat-view__channels`, `str-chat__chat-view__threads` -> BC-075 (partially a false positive); `str-chat__thread--virtualized` -> BC-076
- Classes removed from stylesheets (diff reports 0): actually `str-chat__container`, `str-chat__main-panel` -> BC-073
- Custom properties removed: 0 (confirmed by own diff of `--str-chat*` declarations)

#### corpus-new.txt (XC lines)

- `useChannelStateContext` / `useChannelActionContext` / `ChannelStateProvider` / `ChannelActionProvider` `TS2724` lines (listed in BC-003 evidence) -> BC-003
- `useTypingContext` `TS2305` lines -> BC-004
- `getChannel` `docs/02-ui-components__05-channel-list__02-channel_list_context__2.tsx:11` -> BC-020
- `TS2554 Expected 0 arguments` lines (listed in BC-006) -> BC-006, except `docs/02-ui-components__08-message__04-message_hooks__4.tsx:7` (`useRetryHandler(message)`) -> ruled-out: message-area hook signature, not `componentName`
- all `TS2769` lines (listed in BC-068) -> BC-068
- `docs/04-guides__08-date-time-formatting__5.tsx:8`, `docs/04-guides__18-accessibility__15.tsx:8` (`TS2353` old keys) -> BC-067
- `docs/04-guides__03-translations__13.tsx:3,4,6`, `docs/04-guides__03-translations__16.tsx:3` (`moment/locale/*`, `moment-timezone` not found) -> ruled-out: corpus environment. `moment-timezone` was only a v14 _devDependency_ (`release-v14:package.json:191`), so it resolved in the v14 checkout's `node_modules`; it was never a runtime dependency integrators received. `moment` is still accepted as `DateTimeParser`.
- `docs/04-guides__03-translations__20.tsx:13` (`~`, `Translator` returns `void`) -> ruled-out: pre-existing snippet bug; `Translator` required `string | null` in v14 too
- `Window` `TS2305` lines (`docs/02-ui-components__01-getting_started__1.tsx:7`, `docs/02-ui-components__03-chat__01-chat__5.tsx:10`, `docs/02-ui-components__04-channel__01-channel__4.tsx:11`, `docs/02-ui-components__08-message__13-date_separator__2.tsx:10`, and the rest of the 45 `Window` usages in `corpus-missing.txt`) -> BC-073
- `TimestampNS` / `ERROR_use_SDKs_nsToDate_helper_instead` lines (`docs/03-ui-cookbook__11-hide-channel-history-before__1.tsx:22,39,40`, `websocketEventTemplates.ts:*`, `reactionsExampleData.ts:9,120`) -> BC-002 umbrella; each is an LLC response-model type (ruled-out as separate entries: LLC (stream-chat v10))
- `examples/examples/vite/src/AppSettings/state.ts:1` (`StateStore` not exported from `stream-chat`) -> ruled-out: LLC (stream-chat v10); single-copy note in BC-001
- `Event` property lines (`queriedChannels`, `user`, `cid`, `message`, `member`, `channel`) and `ChannelState.messages` (`websocketEventAutomation.ts:333`) -> ruled-out: LLC (stream-chat v10)

#### ai-migration-v14-v15.md headings

- "The core v15 shift…" / "Removed: `ChannelStateContext` / `ChannelActionContext` and their hooks" -> BC-003 (guide's action table needs fixing, see Notes)
- "Dates on response types are unix-nanosecond numbers", "The public React types that changed", "Presentational props still take `Date`", "`MessageList`'s `headerPosition` prop changed unit" -> BC-002
- "Peer-dependency gate before release" -> ruled-out: stale internal release note (no `portal:` remains; peer is `^10.0.0-rc.20`)
- "Test fixtures have to model the wire" -> ruled-out: SDK-internal test guidance (`mock-builders`), not consumer API; consumer-facing part folded into BC-002
- "i18n: English-only bundle, namespaced translation keys" -> BC-067 / BC-068
- "`ComponentContext.HeaderStartContent` → removed…" -> BC-005
- "Message UI overrides consolidate on the `MessageUI` slot" -> BC-005 (slot only; the `Message` props on lists / `Thread` belong to the message area)
- "Context hooks: no `componentName` argument, and required contexts throw", "The optional `componentName` argument is removed" -> BC-006
- "Required contexts throw outside their provider", "Related type changes" -> BC-007
- "Channel state moves to a single reactive store", "The `*Store` handles are removed", "Reading channel state without re-rendering", "Test mocks" -> ruled-out: LLC (stream-chat v10)
- "`<Channel>` declares the channel active…", "`AIStates` moves to `stream-chat`" -> not XC (Channel / AIStateIndicator areas)

#### `!` / BREAKING commits touching XC

- `99cbe6704` (PR #3237, BREAKING CHANGE body) -> BC-003, 02, 03, 07, 11, 13, 14, 15
- `9194215f0` (PR #3267, BREAKING CHANGE body) -> BC-006, BC-007
- `07664893e` (PR #3268) -> BC-005
- `17c91bc70` (PR #3261) -> BC-067, BC-068
- `f68cad332 refactor(i18n)!` (PR #3271) -> BC-068, BC-069, BC-001
- `eb3ae7a5d refactor(i18n)!` (PR #3284) -> BC-069, BC-001
- `cb472c35f feat!` (PR #3278) -> BC-002
- `aaa7fa31e feat!` (PR #3297) -> BC-002
- `a41eed56f feat!` (PR #3310) -> BC-020 (`getChannel`); the rest is LLC
- `c2136f307 refactor!` (PR #3289) -> BC-005 (`ThreadHeader` slot), BC-076
- `66557d63b feat!` (PR #3301) -> BC-005 (`HeaderStartContent`)
- `baf4b62f6 feat: add icons to ComponentContext…` (PR #3294) -> ruled-out: icon slot typing widened, no consumer break
- `557ffcb3c feat!` (PR #3321, `useCreateChatClient`), `088c795c1 feat(Channel)!`, `68999a7b3 feat(AudioPlayback)!`, `b541c45f9 refactor(MessageActions)!`, `14e58601f feat(MessageComposer)!` -> not XC

#### Components in XC scope with no breaking change

- `Icons`: `icons.tsx` identical; `IconSlots` now `Partial<Record<IconName, IconComponent>>` (a superset) -> ruled-out
- `Avatar`: `Icon` prop un-deprecated -> ruled-out. `Badge/MediaBadge` reads `attachment.custom.duration` -> ruled-out: LLC v10 attachment shape
- `Button`, `Form`, `LoadMore`, `EmptyStateIndicator`, `Accessibility`, `Dialog`, `Loading`, `Notifications`: only i18n key moves (BC-067 / 09), `componentName` drops (BC-006), `useContextMenuContext` / `useDialogManager` throwing (BC-007). Otherwise ruled-out: `DialogAnchor fitAvailableSpace` now actually constrains size (was a no-op, opt-in prop), `NotificationList` uses idempotent `ensureNotificationTimeout`, `AttachmentUploadedSizeIndicator` reads `custom.file_size` (LLC shape).
- `Tooltip`, `Portal`, `UtilityComponents`, `SafeAnchor`, `VisuallyHidden`, `SkipNavigation`: no source changes
- `src/hooks`: new `useIsDmChannel` (internal) and `useMessagePaginator` (exported from the package root since `fix/v15-dead-surface-cleanup`); nothing removed
- `src/store`: `useStateStore` now types against `@stream-io/state-store` -> BC-001
- `WithComponents`: merged value memoized on `[parentOverrides, overrides]`; `useComponentContextIcons` now accepts non-function components (`React.memo` / `forwardRef`) and re-reads when `icons` changes -> ruled-out: fixes, not breaks

### Diff items ruled out by the coordinator

- `ThreadContext` / `ThreadContextValue` members reported as `member-added-required`: `configState`, `handleMessageDeleted`, `handleMessageUpdated`, `handleNewReply`, `handleReactionChanged`, `handleRepliesRead`, `handleRepliesUnread`, `handleThreadUpdated`, `handleUserMessagesDeleted`, `initializeConfig`, `markRead`, `messageOperations`, `updateConfig`. Ruled out as LLC (stream-chat v10): `ThreadContextValue` is `Thread | undefined` on both branches, and these are methods and stores added to the `stream-chat` `Thread` class. Only a hand-built `Thread` mock is affected; build it from a real `client.threads` instance instead.
- Corpus errors caused only by `stream-chat` v10 types, ruled out as LLC: the attachment `Action` type now requires `text` and `type` (`03-ui-cookbook/06-attachment/01-attachment_actions.md`); `StreamChat.unBlockUser` -> `unblockUser` and `queryUsers`-style id arguments (`04-guides/11-blocking-users.md`, `04-guides/04-typescript_and_custom_data_types.md`); custom fields on `MessageWithChannelResponse` (same page); `ReminderResponse` -> `ReminderResponseData` (`04-guides/12-message-reminders.md`); `MessageResponseBase`, and the narrowed `Event` / `EventPayload` unions (`examples/vite` WebSocket event tooling). Also: the `User` type no longer accepts `name` / `image` (type `userData` as `ClientUser`, as `useCreateChatClient` does; v14 tutorial steps 3-7); `ChannelResponse.name` on `Partial<ChannelResponse>`; channel `members` as `ChannelMemberRequest` objects instead of id strings (tutorial steps 3 and 6); `StreamChat.partialUpdateMessage` and other message methods taking `{ message_id }` objects; `delete_for_me` instead of `deleteForMe` in delete options; `ChannelState.messages` (use `channel.messagePaginator`); `ReactionResponse.custom` now required in hand-built fixtures; `LinkPreview.custom`.

## Notes For Migration Guide Drafting

Inaccuracies found in the existing guides while auditing. Fix them when the guides are aligned with this file.

- `ai-migration-v14-v15.md`:
  - "Removed: ChannelStateContext / ChannelActionContext": `channel.sendMessageWithLocalUpdate`, `updateMessageWithLocalUpdate`, `retrySendMessageWithLocalUpdate` and `deleteMessageWithLocalUpdate` do not exist in `stream-chat@10.0.0-rc.22`. The API is `channel.messageOperations.send / retry / update / delete`, or `messageComposer.send()` / `.update()`.
  - The same table maps `loadMore` -> `prev()` and `hasMore` -> `hasPrev`. In rc.22, `prev` / `hasPrev` are deprecated aliases of the newer-messages direction. Its `hasMoreNewer` -> `hasNext` and `loadMoreNewer` -> `next()` rows are inverted too. Correct: `loadMore` -> `toTail()`, `loadMoreNewer` -> `toHead()`, `hasMore` -> `hasMoreTail`, `hasMoreNewer` -> `hasMoreHead`.
  - "Per-component request-handler props removed" says the `do*Request` props were removed from `Thread` too; v14 `Thread` never had them. It also lists `ThreadProps.allowConcurrentAudioPlayback`, which v14 `Thread` never had. And it says thread flows register under the `thread` key; send, update, delete and retry for thread replies go through the parent channel's `requestHandlers`, and `thread.requestHandlers` accepts only `markReadRequest` (BC-023). `instance-configuration.md` repeats the `thread` key claim.
  - "Attachment/poll availability" says the File action now disappears without `upload-file` permission when `customCdn` is unset; v14 already hid it.
  - "`AIStates` moves to `stream-chat`" says only the reactive `useAIState` honors `ai_indicator.stop`; v14 already handled it. Only the reset on connection loss is new.
  - "`ChatContext.channelsQueryState` -> removed" says `Channel` renders loading, error and `EmptyPlaceholder` states. It renders none of them.
  - "`ChatContext.latestMessageDatesByChannels` -> removed" names `useIsCooldownActive`, which was not exported; `fix/v15-dead-surface-cleanup` exports it, so the guide is now right.
  - "`ChannelListItem` `getLatestMessagePreview` prop -> removed" says the util was removed (it is still exported) and suggests overriding through `<Chat>` / `<Channel>` props that do not exist. Drop that mention; `ComponentProvider` (which it also names) works but replaces the parent context, so prefer `WithComponents`, which merges over it.
  - "`Thread` renders children" says `Thread` registers the thread with the `ThreadManager`; it does not. `ThreadHeaderProps` also keeps `StartContent` / `EndContent`, not only `overrideTitle`.
  - "`<Channel>` declares the channel active" still tells readers to reload on `connection.recovered`; the client reloads active channels itself since `3098a90a6`.
  - "`ChatContext.setActiveChannel` -> removed" says `ChannelListItemUI` selects through `open(...)`; it uses `useWorkspaceNavigation().openChannel`.
  - "Peer-dependency gate before release" describes a `portal:` pin that no longer exists.
  - The `messageActions` snippet filters `defaultMessageActionSet` by `type`, but the dropdown-toggle item has no `type`; guard with `'type' in item`. The same section says passing `messageActions={['delete']}` "in v15 changed nothing"; it means v14.
- `i18n-v15-migration.md` says the runtime "now lives in `stream-chat`" and that `stream-chat` depends on `i18next` / `dayjs`. The runtime is `@stream-io/i18n`, and `stream-chat@10` depends on neither. It also sends integrators to `@stream-io/i18n` directly for `addOrUpdateDayjsLocale()`. That export exists, but this package does not re-export it, and AGENTS.md says integrators should not import `@stream-io/i18n` directly; either re-export it or document the exception.
- `i18n-v15-key-map.json` maps "Send message request failed" / "Edit message request failed" to `messageComposer.sendMessageFn...` / `messageComposer.updateMessageFn...`, which do not exist. The keys are `notification.messageSendFailed` / `notification.messageUpdateFailed`.
- `AGENTS.md` (as contributor guidance) and the `GetStream/stream-chat-react#3237` description point to `useMessagePaginator()`. It was not exported from `stream-chat-react`; `fix/v15-dead-surface-cleanup` exports it from `src/index.ts`, so both are now right.
- Group the guide by user task, as in the v14 guide: imports to change, props to remove, override keys to rename, behavior to re-wire (workspace navigation, channel initialization, request handlers).
- The silent breaks deserve top billing because nothing fails to compile: selection and thread opening outside `ChatView` (BC-045 / BC-013 above), `Channel` no longer watching the channel, failed sends no longer restoring the composer, and required context hooks throwing.
