# stream-chat-react v14 → v15: AI migration guide

Execution-only guide for a coding agent migrating a third-party app from `stream-chat-react` v14 to v15. It covers the root package and its subpath entry points (`stream-chat-react/slot-layout`, `/slot-geometry`, `/channel-detail`, `/emojis`, `/ai-components`, `/mp3-encoder` and the `css/*` stylesheets). v15 requires `stream-chat` v10, itself a breaking client release, so upgrade both together; this guide covers the `stream-chat` changes a React app usually hits, and the [stream-chat guide](#companion-documents) covers the rest. The i18n runtime now comes from `@stream-io/i18n` and the state store from `@stream-io/state-store`, both installed as dependencies of this package.

Every breaking change in [`v15-breaking-changes.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/v15-breaking-changes.md) (`BC-001` to `BC-097`) is covered here. The [index at the end](#index-of-breaking-changes) maps each `BC` entry to its section.

Verified against `master` @ `1c02ba07f` (`stream-chat-react@0.0.0-development`, after the `v15.0.0-rc.3` tag; `stream-chat` peer `^10.0.0-rc.29`, checked against stream-chat-js `release-v10` @ `fdfcb296`), 2026-11-03.

<a id="source-of-truth"></a>

## Rules for the agent

1. **The installed packages are the source of truth, not memory.** The v14 / `stream-chat` v9 surface is heavily represented in training data and will mislead you. Read:
   - `node_modules/stream-chat-react/dist/types/index.d.ts`: the public React type surface (props, override keys, hook signatures). Entry points other than the root have their own folders: `dist/types/plugins/SlotLayout/` for `stream-chat-react/slot-layout`, and so on.
   - `node_modules/stream-chat/dist/types/index.d.ts`: the core client types. `Channel` (`channel.d.ts`: `messagePaginator`, `messageOperations`, `configState`, `watch`), `ChannelManager.d.ts`, `thread.d.ts`, `pagination/paginators/`, `messageOperations/types.d.ts`.
   - `node_modules/stream-chat-react/package.json`: the `exports` map and `peerDependencies`.
2. **Verify before writing.** Before claiming that a symbol, prop or method exists, or writing a replacement snippet, grep the installed `.d.ts` and read the current signature. Do not reconstruct it from memory.
3. **Stop and report when a symbol this guide names is missing** from the installed package. Do not invent a fallback or pick a similar name; record it under open decisions in the [report](#report-template).
4. **Detect before editing.** Run the [detection](#detection) commands and work only on sections with hits. A section with no hits needs no edits.
5. **Make the smallest edit that fixes the break.** Much of the v14 / `stream-chat` v9 surface carries over (`client.channel()`, `channel.watch()`, ...). When existing app code still type-checks and does what the app needs, keep it. One exception compiles but changed meaning: `channel.markRead()` is now the direct request (it skips the delivery reporter and any `markReadRequest` handler, and throws when read events are off); the v14 behavior is `channel.markReadViaReporter()` ([section 5](#markreadonmount-is-removed-the-list-marks-read)). Do not rewrite code into the shape of a snippet below: the snippets show one valid form, not the only one.
6. **Do not stop at a green build.** The [breaks that do not fail to compile](#breaks-that-do-not-fail-to-compile) change behavior at runtime, and a plain-JS app gets no compile errors at all. Walk that table, and run the [leftover-identifier grep](#verification).
7. **Keep the app's behavior.** Where a section says an SDK default changed and the app relied on it, restore the old behavior in app code (the sections show how) or list it as a decision for the human. Do not adopt a new default silently.
8. **Do not hand-edit lockfiles or generated files** (`yarn.lock`, `package-lock.json`, `pnpm-lock.yaml`, build output, generated code). Change them through the package manager or the generator.
9. **`stream-chat` compile errors.** The app also calls `stream-chat` directly, and v10 breaks it too. The changes React apps hit most are covered inline (sections [1](#packages), [5](#channel-input-shape), [9](#stream-chat-v10-store-changes-you-will-meet-here), [16](#16-dates-on-response-types-are-unix-nanosecond-numbers), [17](#17-other-stream-chat-v10-data-shapes)). For any other `stream-chat` error, look the symbol up in the [stream-chat v9 → v10 guide](#companion-documents) and in its [type-rename table](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#type-rename-table).

`ai-docs/` and `examples/` are not in the npm package (`files` ships only `dist`, `package.json` and `README.md`), so you cannot read them from `node_modules`. Fetch them by URL; links to this repository point at `master`.

## Companion documents

Fetch a document only when a section sends you there, or the trigger in the right column applies.

| Document                                   | Raw URL                                                                                                    | Fetch when                                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| stream-chat v9 → v10 guide                 | `https://raw.githubusercontent.com/GetStream/stream-chat-js/release-v10/ai-docs/ai-migration-v9-to-v10.md` | A `stream-chat` compile error or call this guide does not cover (client options, `queryChannels`, events, filters, custom data, moderation, polls, reminders, offline) |
| stream-chat v10 breaking-changes reference | `https://raw.githubusercontent.com/GetStream/stream-chat-js/release-v10/ai-docs/v10-breaking-changes.md`   | The exact v9 → v10 shape of one symbol; its `#type-rename-table` maps every renamed type                                                                               |
| React v15 breaking-changes reference       | `https://raw.githubusercontent.com/GetStream/stream-chat-react/master/ai-docs/v15-breaking-changes.md`     | Evidence or edge cases for one `BC-###` entry (this guide's index names the entry)                                                                                     |
| React v15 i18n guide                       | `https://raw.githubusercontent.com/GetStream/stream-chat-react/master/ai-docs/i18n-v15-migration.md`       | The app registers translations, sets a non-English language, calls `t(...)` with SDK strings, or customizes `Streami18n` ([section 18](#18-i18n))                      |
| v14 → v15 i18n key map                     | `https://raw.githubusercontent.com/GetStream/stream-chat-react/master/ai-docs/i18n-v15-key-map.json`       | Renaming a v14 English key in a dictionary or a `t()` call                                                                                                             |
| Instance configuration                     | `https://raw.githubusercontent.com/GetStream/stream-chat-react/master/ai-docs/instance-configuration.md`   | Registering request handlers, page sizes, composer setup or other `client.config` settings ([sections 13 to 15](#14-request-handlers))                                 |

<a id="how-to-migrate"></a>

## Workflow

### Phase 0: preflight

- Record the current versions from `package.json` and the lockfile: `stream-chat-react`, `stream-chat`, `react`, `react-dom`, `typescript`, `dayjs`, `i18next`. Record the package manager (from the lockfile), the Node version (`node -v`, `.nvmrc`, `engines`, CI config) and whether the app is TypeScript or plain JS.
- Require a clean git tree (`git status`). If it is not clean, stop and ask.
- Run the app's typecheck, lint, tests and build once (find the commands in `package.json` `scripts`) and record the result as the baseline. Failures already present are not yours to fix.

### Phase 1: install and platform

[Section 1](#1-install-and-imports): Node, `stream-chat-react` v15 with `stream-chat` in the declared peer range, `dayjs` / `i18next`, a single `@stream-io/state-store`.

### Phase 2: detect

Run the [detection](#detection) block. List the sections with hits; those are the sections to apply.

### Phase 3: apply the sections in order

Work through the sections with hits in this order, the order an app is usually rebuilt in. Fix each compile error before moving on.

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

### Phase 4: walk the silent breaks

Check every row of [breaks that do not fail to compile](#breaks-that-do-not-fail-to-compile), with its Detect patterns, even when the build is green. Mark each row changed, not applicable, or a decision for the human.

### Phase 5: verify

Run [Verification](#verification): the app's checks against the baseline, the leftover-identifier grep, the dedupe checks and the runtime smoke list.

### Phase 6: report

Write the report below.

### Definition of done

- The typecheck passes, and lint, tests and build are no worse than the Phase 0 baseline.
- Every detection hit is fixed, or listed in the report as deliberately kept (an app identifier that only shares a name).
- The leftover-identifier grep prints nothing outside comments and changelogs.
- Every silent-break row is marked changed, not applicable, or open decision.
- `stream-chat` satisfies the installed `stream-chat-react` peer range, and `@stream-io/state-store` and `dayjs` resolve to one copy each.
- The report is written.

### Report template

```md
## stream-chat-react v14 → v15 migration report

- Versions: stream-chat-react <old> → <new>; stream-chat <old> → <new>; Node <old> → <new>; package manager <name>
- Checks, baseline → now: typecheck <…> → <…>; lint <…> → <…>; tests <…> → <…>; build <…> → <…>
- Changed, by section: §<n> <file>: <one line on what changed> (one line per file and section)
- Skipped sections (no detection hits): §<n>, …
- Silent breaks: <row>: changed | not applicable (<why>) | open decision
- Open decisions for the human: <SDK default that changed and the app relied on; symbol missing from the installed package; …>
- Runtime checks still to do: <smoke-list items not exercised>
```

## Detection

Run from the app's repository root. Each command prints `file:line` hits for the **v14** names a section replaces; a section with no hits needs no edits. `code` searches `.ts .tsx .mts .cts .js .jsx .mjs .cjs`, `styles` searches `.css .scss .sass .less`; both skip `node_modules` and build output. A hit can be the app's own identifier with the same name: read it before editing. The commands need ripgrep (`rg`); without it, run each pattern with `grep -rnE` over the same file types, excluding `node_modules`.

```bash
code()   { rg -n --hidden -t ts -t js -g '!**/node_modules/**' -g '!**/dist/**' -g '!**/build/**' -g '!.git' -e "$1" .; }
styles() { rg -n --hidden -g '*.{css,scss,sass,less}' -g '!**/node_modules/**' -g '!**/dist/**' -g '!**/build/**' -e "$1" .; }

# §1 install and imports: versions, Node in CI, moved imports, StateStore from stream-chat
rg -n --hidden -g 'package.json' -g '!**/node_modules/**' -e '"(stream-chat|stream-chat-react|dayjs|i18next|@stream-io/[a-z-]+)"\s*:' .
rg -n --hidden -g '.nvmrc' -g '.node-version' -g '*.{yml,yaml}' -g 'Dockerfile*' -g '!**/node_modules/**' -g '!.git' -e 'node-version|FROM node|^v?[0-9]+(\.[0-9]+)*$' .
code '\b(ChatView|ChatViewContext|useChatViewContext|useActiveThread|ChatViewSelector\w*|ChatView\w*SelectorButton|defaultChatViewSelectorItemSet|AIStates|getAttachmentPreviewUrl|isUploadConfirmationPending|hasPendingUploadState|StateStore)\b'
# §2 client and <Chat>
code '\b(useCreateChatClient|useChat|defaultLanguage|channelsQueryState|latestMessageDatesByChannels|recoverStateOnReconnect|enableWSFallback|wsUrlParams|isLocalUnreadCountEnabled|StreamChatOptions)\b|connection\.changed'
# §3 layout: Window, ChatView
code '<Window\b|\bWindowProps\b|ChatView\.(Channels|Threads|ThreadAdapter)\b|\b(useThreadsViewContext|ThreadsViewContextValue|activeChatView|setActiveChatView)\b'
# §4 selection and thread opening (workspace navigation)
code '\b(setActiveChannel|openThread|closeThread|setActiveThread|focusedMessage)\b|SearchResultItem'
# §5 <Channel>: required channel, watching, props that moved
code '<Channel\b|\b(EmptyPlaceholder|channelQueryOptions|initializeOnMount|getChannel|markReadOnMount|activeUnreadHandler|giphyVersion|imageAttachmentSizeHandler|videoAttachmentSizeHandler|shouldGenerateVideoThumbnail|onMentionsClick|onMentionsHover|useChannelMentionsHandler|skipMessageDataMemoization|allowConcurrentAudioPlayback)\b|client\.channel\(|connection\.recovered|document\.title'
# §6 channel list
code '<ChannelList\b|\b(ChannelListUI|ChannelListUIProps|usePaginatedChannels|useConnectionRecoveredListener|CustomQueryChannelParams|CustomQueryChannelsFn|EffectiveQueryParams|moveChannelUpwards|findLastPinnedChannelIndex|extractSortValue|isChannelPinned|isChannelArchived|shouldConsiderPinnedChannels|shouldConsiderArchivedChannels|useChannelListContext|setChannels|loadNextPage|latestMessagePreview|getLatestMessagePreview|lastMessage|channelUpdateCount|ChannelSort|setActiveChannelOnMount|allowNewMessagesFromUnfilteredChannels|showChannelSearch)\b'
# §7 threads
code '<Thread\b|<ThreadProvider\b|\b(useLegacyThreadContext|additionalMessageComposerProps|additionalMessageListProps|additionalVirtualizedMessageListProps|additionalParentMessageProps|enableDateSeparator|ThreadHeaderProps)\b|client\.threads\.state'
# §8 headers
code '\b(HeaderStartContent|HeaderEndContent)\b|<(Channel|Thread)Header\b'
# §9 channel state and actions
code '\b(ChannelStateContext|ChannelStateContextValue|ChannelStateProvider|useChannelStateContext|ChannelActionContext|ChannelActionContextValue|ChannelActionProvider|useChannelActionContext|ChannelNotifications|MarkReadWrapperOptions|RetrySendMessage|TypingContext|TypingContextValue|TypingProvider|useTypingContext|ChannelUnreadUiState|channelUnreadUiState|setChannelUnreadUiState|channelConfig|WatcherState)\b|getConfig\(|\.(read|typing|members|watcher|ownCapabilities|mutedUsers)Store\b|\.disconnected\b|\.(hasNext|hasPrev)\b'
# §10 component overrides, context hook arguments, message actions
code '\bMessage=\{|\b(Message|ThreadHeader|HeaderStartContent|ChannelListUI|LoadingErrorIndicator):|use[A-Za-z]+Context\([^)]|\b(messageActions|MESSAGE_ACTIONS|OPTIONAL_MESSAGE_ACTIONS|getMessageActions|MessageActionsArray|Capabilities|actionsEnabled|canEdit|messageActionSet|disableBaseMessageActionSetFilter)\b'
# §11 message lists
code '\bmessages=\{|\b(loadMore|loadMoreNewer|hasMore|hasMoreNewer|loadingMoreNewer|jumpToLatestMessage|messageLimit|highlightedMessageId|threadList|disableDateSeparator|renderMessages|RenderMessagesOptions|getIsFirstUnreadMessage|additionalVirtuosoProps|headerPosition|insertIntro|DateSeparatorMessage|useEnrichedMessages|useNewMessageNotification|useScrollLocationLogic|areMessagePropsEqual|useMessageListScrollManager|NewMessageNotification|ScrollToLatestMessageButton|InfiniteScrollPaginator|loadNextDebounceMs|loadMoreDebounceMs|internalInfiniteScrollProps|noGroupByUser|shouldGroupByUser|groupStyles|defaultItemHeight|overscan|scrollSeekPlaceHolder)\b|\bhead=\{'
# §12 messages
code '<Message\b|\b(messageIsUnread|retrySendMessage|useRetryHandler|usePinHandler|canPin|allowConcurrentPlayback|WithAudioPlayback|GalleryItem|handlePin|handleDelete|handleMute|handleFlag|handleMarkUnread|useUserRole|isAdmin|isModerator|isOwner|disableQuotedMessages|initialMessage|renderText|mentionedUsers?|mentioned_users|MentionedUserEventHandler|onMentionsClickMessage|onMentionsHoverMessage|mentionsMarkdownPlugin|createMentionPluginAndDisplayTextSet|endOfGroup|firstOfGroup|groupedByUser)\b|useMessageContext\(\)\.mutes'
# §13 message composer
code '\b(overrideSubmitHandler|handleSubmit|preventClearingOnUnmount|setMessageComposerSetupFunction|hasCustomDoUploadRequest|doUploadRequest|AttachmentPreviewList|VoiceRecordingPreviewSlot|LinkPreviewList|MessageComposerControllerProvider|PollCreationDialog)\b|stream-io/(text-composer/(active-command-guard|command-string-extraction)|message-composer-middleware/(draft-)?command-string-injection)'
# §14 request handlers
code '\b(doSendMessageRequest|doUpdateMessageRequest|doDeleteMessageRequest|doMarkReadRequest|useChannelEditMessageHandler)\b'
# §15 resolved configuration (review hits; most are covered by §9 and §13)
code '\b(channelConfig|typing_events|read_events|user_message_reminders|shared_locations)\b'
# §16 dates (review every hit that reads a server timestamp)
code 'new Date\([^)]*_at\b|dayjs\([^)]*_at\b|moment\([^)]*_at\b|_at\??\.getTime\(|\blast_read\b'
# §17 other stream-chat v10 data shapes
code '\.data\??\.(name|image)\b|members:\s*\[|\b(ReactionSort|reactionDetailsSort|deleteForMe|hardDelete|moderation_details|CommandResponse|DefaultCommandData|CustomCommandData|unBlockUser|ReminderResponse|UserSort|queryUsers|queryChannels|flagMessage|getThread|updateFields|addMembers|removeMembers)\b'
# §18 i18n
code '\b(Streami18n|registerTranslation|translationsForLanguage|useTranslationContext|isLanguageSupported|SupportedTranslations|DateFormatterOptions|getTranslators|registerSetLanguageCallback|getAvailableLanguages|geti18Instance|[a-z]{2}Translations)\b|\bt\([\x27"`]|dayjs/locale'
# §19 CSS and markup (styles, and CSS-in-JS / className strings in code)
styles 'str-chat__(main-panel|container|channel-list-inner|thread--virtualized|chat-view__(channels|threads)|quoted-message-preview|message--has-single-attachment|channel-list-item|thread-list-item|ul|li|virtual-message__wrapper)|aria-pressed|channel-list-width|thread-list-width'
code 'str-chat__(main-panel|container|channel-list-inner|thread--virtualized|message--has-single-attachment|virtual-message__wrapper)|aria-pressed'
# §20 tests (mocks of channel state, contexts and dates)
rg -n --hidden -t ts -t js -g '*.{test,spec}.*' -g '**/__tests__/**' -g '!**/node_modules/**' -e 'spyOn\(channel|\.disconnected\s*=|getConfig|ChatContextValue|mockChatContext|created_at:\s*(new Date|[\x27"])' .
```

## Quick reference

Old → new for the most common changes. Ctrl-F the v14 name; the section has the details and the conditions.

| v14                                                                                                                  | v15                                                                                                                                                        | Section                                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `stream-chat` v9                                                                                                     | `stream-chat` v10, in the range `peerDependencies['stream-chat']` of the installed `stream-chat-react` declares                                            | [1](#packages)                                                                                 |
| Node < 22.18                                                                                                         | Node `>=22.18.0` locally and in CI                                                                                                                         | [1](#packages)                                                                                 |
| `ChatView`, `useChatViewContext`, `useActiveThread`, `ChatViewSelector*` from `stream-chat-react`                    | The same names from `stream-chat-react/slot-layout`                                                                                                        | [1](#imports-that-moved)                                                                       |
| `AIStates`, `getAttachmentPreviewUrl`, `isUploadConfirmationPending` from `stream-chat-react`                        | The same names from `stream-chat`                                                                                                                          | [1](#imports-that-moved)                                                                       |
| `hasPendingUploadState`                                                                                              | `isPendingUpload` from `stream-chat`                                                                                                                       | [1](#imports-that-moved)                                                                       |
| `StateStore` from `stream-chat`                                                                                      | `StateStore` from `@stream-io/state-store`                                                                                                                 | [1](#imports-that-moved)                                                                       |
| `client.queryChannels(...)` returning `Channel[]`                                                                    | `client.queryChannelsAndHydrate(...)` (`queryChannels` returns the raw response)                                                                           | [1](#packages)                                                                                 |
| `client.queryUsers(filter, sort, options)`                                                                           | `client.queryUsers({ payload: { filter_conditions, sort, limit } })`                                                                                       | [1](#packages)                                                                                 |
| `ChannelSort` / `UserSort` / `ReactionSort` objects (`{ last_message_at: -1 }`)                                      | `SortParamRequest[]` (`[{ field: 'last_message_at', direction: -1 }]`)                                                                                     | [1](#packages), [6](#channellist-is-driven-by-a-channelpaginator)                              |
| `useCreateChatClient({ options })`                                                                                   | `useCreateChatClient({ config: { client: { ... } } })`                                                                                                     | [2](#usecreatechatclient-options--config)                                                      |
| `enableWSFallback`, `wsUrlParams`, `recoverStateOnReconnect`, `isLocalUnreadCountEnabled` options                    | `client.wsConnection.enableWSFallback`, `client.wsConnection.urlParams`, `client.connectionRecovery.enabled`, `channel.readEvents.localUnreadCountEnabled` | [2](#usecreatechatclient-options--config)                                                      |
| `useChat({ client, defaultLanguage, i18nInstance }).translators`                                                     | `useStreami18n({ client, i18nInstance })`                                                                                                                  | [2](#usechat-and-chatdefaultlanguage)                                                          |
| `<Chat defaultLanguage>`                                                                                             | Set the language on the `Streami18n` you pass as `i18nInstance`                                                                                            | [2](#usechat-and-chatdefaultlanguage)                                                          |
| `useChatContext().channel`                                                                                           | `useChannel()` in the channel subtree; `useWorkspaceNavigation().openChannels` elsewhere                                                                   | [2](#chatcontext-fields)                                                                       |
| `useChatContext().setActiveChannel(channel)`                                                                         | `useWorkspaceNavigation().openChannel(channel, { event })`                                                                                                 | [4](#4-selecting-channels-and-opening-threads-workspace-navigation)                            |
| `useChatContext().channelsQueryState`                                                                                | `useChannelPaginatorState(paginator)`                                                                                                                      | [2](#chatcontext-fields)                                                                       |
| `useChatContext().latestMessageDatesByChannels`                                                                      | `useCooldownRemaining()` / `channel.cooldownTimer`                                                                                                         | [2](#chatcontext-fields)                                                                       |
| `useChatContext('MyComponent')` (any context hook with an argument)                                                  | No argument                                                                                                                                                | [10](#context-hooks-take-no-componentname-argument)                                            |
| `client.on('connection.changed', ...)`                                                                               | `useWSConnectionState()` / `useNetworkConnectionState()`                                                                                                   | [2](#the-lost-connection-notification)                                                         |
| `<Window>`                                                                                                           | Nothing: render the header, list and composer directly in `<Channel channel>`                                                                              | [3](#window-and-windowprops-are-removed)                                                       |
| `<ChatView.Channels>` / `<ChatView.Threads>`                                                                         | `<ChatView layouts views slotRenderers>`                                                                                                                   | [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots)              |
| `<ChatView.ThreadAdapter>`                                                                                           | `<ThreadSlot slot>` or `<Slot slot>`                                                                                                                       | [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots)              |
| `useThreadsViewContext().activeThread` / `.setActiveThread(thread)`                                                  | `useSlotThread({ slot })` / `useWorkspaceNavigation().openThread(thread)`                                                                                  | [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots)              |
| `useChatViewContext().activeChatView` / `.setActiveChatView`                                                         | `.activeView` / `.setActiveView`                                                                                                                           | [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots)              |
| `useChannelActionContext().openThread(message)` / `.closeThread`                                                     | `useWorkspaceNavigation().openThread({ channel, message })` / `.closeThread(threadId)`, or `useCloseThread()`                                              | [4](#4-selecting-channels-and-opening-threads-workspace-navigation)                            |
| `<Channel>` without `channel`, `EmptyPlaceholder`                                                                    | `<Channel channel={channel}>`; render `ChannelPlaceholder` (or `ChannelSlot`'s `fallback`) while none is selected                                          | [5](#channel-requires-channel-and-renders-no-placeholder-loading-or-error-state)               |
| `channelQueryOptions`, `initializeOnMount`                                                                           | `await channel.watch(options)` before rendering                                                                                                            | [5](#channel-no-longer-watches-the-channel)                                                    |
| `getChannel({ client, id, type })`                                                                                   | `await client.channel(type, id).watch()`                                                                                                                   | [5](#channel-no-longer-watches-the-channel)                                                    |
| `client.channel(type, { members: [id1, id2] })`                                                                      | `{ members: [{ user_id: id1 }, { user_id: id2 }] }`; render the instance `watch()` resolves with                                                           | [5](#channel-no-longer-watches-the-channel)                                                    |
| `markReadOnMount`                                                                                                    | A message list marks read; without one, `channel.markReadViaReporter()`                                                                                    | [5](#markreadonmount-is-removed-the-list-marks-read)                                           |
| `activeUnreadHandler`, the `(3) Title` tab title                                                                     | App code                                                                                                                                                   | [5](#channel-no-longer-writes-documenttitle)                                                   |
| `Channel` `giphyVersion`, `imageAttachmentSizeHandler`, `videoAttachmentSizeHandler`, `shouldGenerateVideoThumbnail` | The same props on `Attachment`, through a `WithComponents` `Attachment` override                                                                           | [5](#props-that-moved-off-channel)                                                             |
| `Channel` `onMentionsClick` / `onMentionsHover`                                                                      | The same props on `MessageList` / `Message`                                                                                                                | [5](#props-that-moved-off-channel)                                                             |
| `doSendMessageRequest`, `doUpdateMessageRequest`, `doDeleteMessageRequest`, `doMarkReadRequest`                      | `client.config.set({ channel: { requestHandlers: { sendMessageRequest, updateMessageRequest, deleteMessageRequest, markReadRequest } } })`                 | [14](#14-request-handlers)                                                                     |
| `<ChannelList filters sort options>`                                                                                 | `new ChannelPaginator({ client, filters, sort, id })`, `client.channelManager.insertPaginator({ paginator })`, then `<ChannelNavigation />`                | [6](#channellist-is-driven-by-a-channelpaginator)                                              |
| `ChannelList` `options.limit` / other `options`                                                                      | `paginatorOptions.pageSize` / `requestOptions`                                                                                                             | [6](#channellist-is-driven-by-a-channelpaginator)                                              |
| `setActiveChannelOnMount` (default `true`)                                                                           | Nothing opens by default; open the first channel yourself                                                                                                  | [6](#v14-list-defaults-that-changed)                                                           |
| `showChannelSearch`                                                                                                  | `<ChannelNavigation />` (header, search and every registered list)                                                                                         | [6](#channellist-is-driven-by-a-channelpaginator)                                              |
| `ChannelListUI` override                                                                                             | The list slots (`EmptyListIndicator`, `FirstPageLoadingIndicator`, `ListItem`, ...)                                                                        | [6](#channellistui-is-removed-use-the-list-slots)                                              |
| `useChannelListContext().channels` / `.loadNextPage()` / `.setChannels`                                              | `useChannelPaginatorState(paginator).channels` / `paginator.toTail()` / `client.channelManager.ingestChannel(channel)`                                     | [6](#channellistcontext-lost-channels-hasnextpage-loadnextpage-and-setchannels)                |
| `ChannelListItemUIProps.lastMessage` / `latestMessagePreview`                                                        | `previewedMessage` / `<SummarizedMessagePreview latestMessage={previewedMessage} />`                                                                       | [6](#channellistitem-props)                                                                    |
| `<Thread />`                                                                                                         | `<Thread thread={thread}>` with `ThreadHeader`, `MessageList` and `MessageComposer` as children                                                            | [7](#thread-takes-a-thread-prop-and-renders-its-children)                                      |
| `Thread` `autoFocus` (default `true`)                                                                                | `<MessageComposer focus />` inside the thread                                                                                                              | [7](#thread-takes-a-thread-prop-and-renders-its-children)                                      |
| `Thread` `additionalMessageListProps` and the other `additional*Props`                                               | Props on the children you render                                                                                                                           | [7](#thread-takes-a-thread-prop-and-renders-its-children)                                      |
| `ThreadHeaderProps.closeThread` / `.thread`                                                                          | `useCloseThread()` / `useThreadContext()`                                                                                                                  | [7](#threadheader-lost-closethread-and-thread)                                                 |
| `HeaderStartContent` override                                                                                        | `StartContent` prop on `ChannelHeader` / `ThreadHeader`                                                                                                    | [8](#8-channel-and-thread-headers)                                                             |
| `useChannelStateContext()`                                                                                           | `useChannel()`, then `useStateStore(channel.messagePaginator.state, selector)` or `useStateStore(channel.state, selector)`                                 | [9](#channelstatecontext-and-channelactioncontext-are-removed)                                 |
| `loadMore()` / `loadMoreNewer()` / `hasMore` / `hasMoreNewer`                                                        | `messagePaginator.toTail()` / `.toHead()` / `.hasMoreTail` / `.hasMoreHead`                                                                                | [9](#channelstatecontext-and-channelactioncontext-are-removed)                                 |
| `jumpToMessage(id)` / `jumpToLatestMessage()` / `jumpToFirstUnreadMessage()`                                         | `messagePaginator.jumpToMessage(id)` / `.jumpToTheLatestMessage()` / `.jumpToTheFirstUnreadMessage()`                                                      | [9](#channelstatecontext-and-channelactioncontext-are-removed)                                 |
| `sendMessage` / `editMessage` / `retrySendMessage` / `deleteMessage` from the action context                         | `messageComposer.send()` / `.update()`; `channel.messageOperations.retry(...)` / `.delete(...)`                                                            | [9](#channelstatecontext-and-channelactioncontext-are-removed)                                 |
| `useTypingContext().typing`                                                                                          | `useStateStore(channel.state, typingSelector).typing`                                                                                                      | [9](#typingcontext-is-removed)                                                                 |
| `channelUnreadUiState` / `setChannelUnreadUiState`                                                                   | `messagePaginator.unreadStateSnapshot` / `.setUnreadSnapshot(partial)`                                                                                     | [9](#the-unread-snapshot-channelunreaduistate-is-removed)                                      |
| `channelConfig?.typing_events` (and the other flags)                                                                 | `channel.configState` → `typingEvents.enabled`, `readEvents.enabled`, `replies.enabled`, ...                                                               | [9](#channel-configuration-channelconfig--channelconfigstate)                                  |
| `channel.getConfig()`                                                                                                | `channel.serverConfig` (a getter)                                                                                                                          | [9](#stream-chat-v10-store-changes-you-will-meet-here)                                         |
| `channel.state.readStore` / `typingStore` / `membersStore` / `watcherStore` / `ownCapabilitiesStore`                 | `channel.state` (one store; drop the `.<X>Store` segment)                                                                                                  | [9](#stream-chat-v10-store-changes-you-will-meet-here)                                         |
| `WatcherState` / `channel.disconnected`                                                                              | `ChannelWatchState` / `channel.pendingDisposal`                                                                                                            | [9](#stream-chat-v10-store-changes-you-will-meet-here)                                         |
| `ComponentContext.Message`, the `Message={...}` prop                                                                 | `MessageUI` override (`VirtualMessage` in `VirtualizedMessageList`)                                                                                        | [10](#message-ui-overrides-consolidate-on-the-messageui-slot)                                  |
| `ComponentContext.ThreadHeader` override                                                                             | Render `<ThreadHeader />` as a child of `<Thread>` (not the `ThreadHead` slot)                                                                             | [10](#removed-componentcontext-slots)                                                          |
| `messageActions` prop, `MESSAGE_ACTIONS`, `getMessageActions()`                                                      | `messageActionSet` on `MessageActions`; permissions from `useMessagePermissions(message)`                                                                  | [10](#messageactions-and-message_actions-are-removed)                                          |
| `<MessageList messages={...}>`                                                                                       | Removed; `reviewProcessedMessage`, or act on the paginator                                                                                                 | [11](#the-messages-prop-is-removed)                                                            |
| `disableDateSeparator`                                                                                               | `withDateSeparator` (inverted)                                                                                                                             | [11](#disabledateseparator--withdateseparator)                                                 |
| `threadList` / `head` list props                                                                                     | `!!useThreadContext()` / the `ThreadHead` slot                                                                                                             | [11](#threadlist-and-head-are-removed-lists-detect-the-thread)                                 |
| `highlightedMessageId`                                                                                               | `messagePaginator.messageFocusSignal`                                                                                                                      | [11](#pagination-and-state-props-are-removed)                                                  |
| `messageLimit`                                                                                                       | `client.config.set({ channel: { messagePaginator: { pageSize } } })`                                                                                       | [11](#pagination-and-state-props-are-removed)                                                  |
| `noGroupByUser` / `shouldGroupByUser` / `groupStyles`                                                                | `groupByUser` / `getGroupStyles` (one object argument)                                                                                                     | [11](#message-grouping-groupbyuser-and-getgroupstyles)                                         |
| `VirtualizedMessageList` `defaultItemHeight` / `overscan` / `scrollSeekPlaceHolder`                                  | `additionalVirtuosoProps`                                                                                                                                  | [11](#virtualizedmessagelist-defaultitemheight-overscan-and-scrollseekplaceholder-are-removed) |
| `useMessageContext().mutes`                                                                                          | `useChatContext().mutes`                                                                                                                                   | [12](#messagecontextmutes-and-messageisunread-are-removed)                                     |
| `retrySendMessage` prop / `retry(message)`                                                                           | `retrySendMessageRequest` handler / `retry({ localMessage: message })`                                                                                     | [12](#retrysendmessage-and-useretryhandler)                                                    |
| `usePinHandler(message).canPin`                                                                                      | `useMessagePermissions(message).canPin`                                                                                                                    | [12](#usepinhandler-no-longer-returns-canpin)                                                  |
| `useUserRole(message)`                                                                                               | `useMessagePermissions(message)`                                                                                                                           | [12](#useuserrole-is-renamed-to-usemessagepermissions)                                         |
| `useUserRole(message).isAdmin` / `.isModerator` / `.isOwner`                                                         | The `can*` flags, or `useChannelCapabilities()`                                                                                                            | [12](#useuserrole-no-longer-returns-isadmin-ismoderator-or-isowner)                            |
| `disableQuotedMessages`                                                                                              | A `messageActionSet` without the `quote` item                                                                                                              | [12](#the-disablequotedmessages-prop-is-removed)                                               |
| `initialMessage` prop / `useMessageContext().initialMessage`                                                         | `useIsRenderedAsThreadParent()`                                                                                                                            | [12](#initialmessage-is-removed-use-useisrenderedasthreadparent)                               |
| `renderText(text, mentionedUsers, options)`                                                                          | `renderText(text, { ...options, messageMentionEntities: getRenderTextMentionEntities(message) })`                                                          | [12](#rendertext-takes-text-options)                                                           |
| `node.mentionedUser` in a custom mention renderer                                                                    | `node.mentionedEntity`                                                                                                                                     | [12](#custom-mention-renderers-read-nodementionedentity)                                       |
| `onMentionsClick(event, mentioned_users)`                                                                            | `onMentionsClick(event, message)`                                                                                                                          | [12](#mention-handlers-receive-event-message)                                                  |
| `allowConcurrentPlayback` / `allowConcurrentAudioPlayback`                                                           | Removed; one voice message plays at a time                                                                                                                 | [12](#allowconcurrentplayback-is-removed-one-voice-message-plays-at-a-time)                    |
| `overrideSubmitHandler`                                                                                              | A `sendMessageRequest` handler on `client.config`                                                                                                          | [13](#overridesubmithandler-is-removed)                                                        |
| `useMessageComposerContext().handleSubmit`                                                                           | `useMessageComposerSubmitFn()`                                                                                                                             | [13](#handlesubmit-is-removed)                                                                 |
| `preventClearingOnUnmount`                                                                                           | Removed; call `composer.clear()` yourself                                                                                                                  | [13](#preventclearingonunmount-is-removed)                                                     |
| `useAttachmentManagerState().hasCustomDoUploadRequest`                                                               | `.customCdn`                                                                                                                                               | [13](#useattachmentmanagerstate-hascustomdouploadrequest--customcdn)                           |
| `client.setMessageComposerSetupFunction(fn)`                                                                         | `client.config.setSetupFunction('messageComposer', fn)`                                                                                                    | [13](#setmessagecomposersetupfunction-is-deprecated)                                           |
| `new Date(message.created_at)`, `dayjs(created_at)`                                                                  | `convertTimestampToDate(created_at)` from `stream-chat` (may return `undefined`)                                                                           | [16](#16-dates-on-response-types-are-unix-nanosecond-numbers)                                  |
| `channel.data?.name` / `.image`                                                                                      | `channel.data?.custom?.name` / `.image`                                                                                                                    | [17](#17-other-stream-chat-v10-data-shapes)                                                    |
| `handleDelete({ deleteForMe, hardDelete })`                                                                          | `handleDelete({ delete_for_me, hard })`                                                                                                                    | [17](#17-other-stream-chat-v10-data-shapes)                                                    |
| `DefaultCommandData` import, `declare module 'stream-chat' { interface CustomCommandData … }`                        | Delete both; `Command['name']` is `string`                                                                                                                 | [17](#17-other-stream-chat-v10-data-shapes)                                                    |
| `client.flagMessage(id)` / `channel.addMembers(ids)` / `client.getThread(id, options)`                               | `client.moderation.flagMessage({ message_id })` / `channel.addMembers({ members: ids })` / `client.getThreadAndHydrate({ message_id }, { watch: true })`   | [17](#17-other-stream-chat-v10-data-shapes)                                                    |
| `t('English text')`                                                                                                  | `t('namespaced.key', 'English text')`, or `t(asDynamicKey('myApp.key'), 'English text')` for app strings                                                   | [18](#18-i18n)                                                                                 |
| `deTranslations` ... `trTranslations`, `isLanguageSupported`                                                         | Register your own dictionaries; `i18n.registeredLanguages.has(lang)`                                                                                       | [18](#18-i18n)                                                                                 |
| `.str-chat__main-panel`, `.str-chat__container`                                                                      | `.str-chat__channel` (the content column); size panels on the slot or your own row                                                                         | [19](#19-css-and-markup)                                                                       |
| `.str-chat__channel-list-inner`                                                                                      | `.str-chat__channel-list .str-chat__infinite-scroll-paginator`                                                                                             | [19](#19-css-and-markup)                                                                       |
| Row highlight on `[aria-pressed=true]`                                                                               | `[aria-selected=true]`                                                                                                                                     | [19](#19-css-and-markup)                                                                       |

## Breaks that do not fail to compile

These compile cleanly, or are ignored in plain JS, and change behavior at runtime. Check each one explicitly; the absence of an error does not mean the app is migrated. **Detect** lists `rg` patterns (run them with the `code` / `styles` helpers from [Detection](#detection)) or what to review; a row with no hit and nothing to review does not apply.

| Symptom                                                                                                                                                                                                              | Cause                                                                                                                                                              | Fix                                                                                                                                                                                                                                                                                                                                                                       | Detect                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Clicking a channel-list row, a search result, a thread-list row or a message's reply button does nothing; no row shows active                                                                                        | Selection and thread opening go through workspace navigation, whose default outside `ChatView` is a no-op (it logs a one-time console warning per operation)       | Use `ChatView`, or provide `WorkspaceNavigationProvider` ([section 4](#4-selecting-channels-and-opening-threads-workspace-navigation))                                                                                                                                                                                                                                    | `<ChannelList`, `<ThreadList`, `<Search`, `openThread` with no `ChatView` or `WorkspaceNavigationProvider` in the app |
| No channel is open when the app loads                                                                                                                                                                                | v14 `ChannelList.setActiveChannelOnMount` defaulted to `true`; v15 selects nothing                                                                                 | Open the first channel yourself ([section 6](#v14-list-defaults-that-changed))                                                                                                                                                                                                                                                                                            | `<ChannelList` without `setActiveChannelOnMount={false}`                                                              |
| Inside `ChatView`, returning from the threads view shows the first channel instead of the one that was open, and the channel list reloads                                                                            | `ChatView` unmounts the inactive view, so an auto-open guarded by a `useRef`, or a paginator created inside the view, starts over on every switch                  | Create the paginator above `ChatView`; auto-open only while `openChannels` is empty ([section 6](#v14-list-defaults-that-changed))                                                                                                                                                                                                                                        | `new ChannelPaginator` or a `useRef` open-once guard inside `views`                                                   |
| Without `ChatView`, a default `ThreadHeader` shows no close button                                                                                                                                                   | `defaultWorkspaceNavigation.isThreadDismissable` returns `false`                                                                                                   | Override it in your provider ([section 4](#without-chatview))                                                                                                                                                                                                                                                                                                             | `WorkspaceNavigationProvider` with `<ThreadHeader`                                                                    |
| A new message in a channel outside the list's filters no longer adds that channel to the list                                                                                                                        | v14 `allowNewMessagesFromUnfilteredChannels` defaulted to `true`; v15 adds only channels the filters match                                                         | Widen the paginator's filters ([section 6](#v14-list-defaults-that-changed))                                                                                                                                                                                                                                                                                              | `<ChannelList` without `allowNewMessagesFromUnfilteredChannels={false}`                                               |
| The channel list scrolls infinitely instead of showing a "Load more" button                                                                                                                                          | v14 `Paginator` defaulted to `LoadMorePaginator`                                                                                                                   | Keep it, or render your own list ([section 6](#v14-list-defaults-that-changed))                                                                                                                                                                                                                                                                                           | `<ChannelList` without a `Paginator` prop                                                                             |
| Opening a thread no longer focuses its composer                                                                                                                                                                      | v14 `Thread.autoFocus` defaulted to `true`, so every thread focused it                                                                                             | `<MessageComposer focus />` in the thread ([section 7](#thread-takes-a-thread-prop-and-renders-its-children))                                                                                                                                                                                                                                                             | `<Thread`, `autoFocus`                                                                                                |
| A thread renders below the channel instead of beside it, or a panel collapses to a narrow column                                                                                                                     | The channel no longer contains a flex row, and `ChatView` slots are `flex: 1 1 0` siblings                                                                         | Make your container a row; size panels by slot ([section 19](#panel-layout))                                                                                                                                                                                                                                                                                              | `<Thread` beside `<Channel` outside `ChatView`; app CSS sizing `.str-chat__thread` / `.str-chat__channel` (`styles`)  |
| In `views` that render a list beside a `<Slot>`, the channel list or thread list fills the view, the channel or thread beside it is not visible and the page scrolls horizontally                                    | `--str-chat__channel-list-width` and `--str-chat__thread-list-width` default to `100%`, and the lists do not shrink                                                | Set both widths on the `ChatView` root ([section 19](#panel-layout))                                                                                                                                                                                                                                                                                                      | `views=` with `ChannelNavigation` / `ChannelList` / `ThreadList`, and no `--str-chat__channel-list-width` (`styles`)  |
| A channel name or image renders empty                                                                                                                                                                                | `name` / `image` are custom data in `stream-chat` v10: `channel.data.custom.name`                                                                                  | Read `custom` ([section 17](#17-other-stream-chat-v10-data-shapes))                                                                                                                                                                                                                                                                                                       | `.data?.name`, `.data.name`, `.data?.image`                                                                           |
| A held channel throws "pending disposal" after logout or a user switch                                                                                                                                               | `disconnectUser()` disposes the user's channels                                                                                                                    | Drop held channels on disconnect ([section 4](#without-chatview))                                                                                                                                                                                                                                                                                                         | `disconnectUser`, `useState<Channel`                                                                                  |
| A channel renders empty, with no error, and gets no new messages                                                                                                                                                     | `Channel` no longer watches the channel                                                                                                                            | Watch it first: `channel.watch()` ([section 5](#channel-no-longer-watches-the-channel))                                                                                                                                                                                                                                                                                   | `client.channel(` and every `<Channel channel=` source                                                                |
| A direct message the app just created renders, but new messages never arrive                                                                                                                                         | The created members-only instance was superseded by the store's instance for the same cid                                                                          | Render the instance `watch()` resolves with ([section 5](#channel-no-longer-watches-the-channel))                                                                                                                                                                                                                                                                         | `members: [`                                                                                                          |
| After a failed send, the composer is empty instead of holding the text and attachments                                                                                                                               | The composer is released before the request and nothing is put back                                                                                                | Nothing to do; the failed message is retried from the list ([section 13](#a-failed-send-or-edit-no-longer-restores-the-composer))                                                                                                                                                                                                                                         | Review only (no code to find)                                                                                         |
| A component that rendered blank outside its provider now throws                                                                                                                                                      | Required context hooks throw instead of warning and returning `{}`                                                                                                 | Render it inside the provider ([section 10](#required-context-hooks-throw-outside-their-provider))                                                                                                                                                                                                                                                                        | Review: components that call `use*Context()` rendered outside their provider                                          |
| A standalone `<Message>` (a preview, a pinned-message card) throws                                                                                                                                                   | `Message` needs a channel in context                                                                                                                               | Wrap it in `ChannelInstanceProvider` ([section 12](#a-standalone-message-needs-a-channel-in-context))                                                                                                                                                                                                                                                                     | `<Message`                                                                                                            |
| The channel is not marked read                                                                                                                                                                                       | Mark-read moved from `Channel` mount to the message list                                                                                                           | Render a message list, or mark read yourself ([section 5](#markreadonmount-is-removed-the-list-marks-read))                                                                                                                                                                                                                                                               | `<Channel` subtrees without `MessageList` / `VirtualizedMessageList`                                                  |
| The tab title no longer shows `(3) Title`                                                                                                                                                                            | `Channel` no longer writes `document.title`                                                                                                                        | Write it in app code ([section 5](#channel-no-longer-writes-documenttitle))                                                                                                                                                                                                                                                                                               | `activeUnreadHandler`, `document.title`                                                                               |
| Mount effects in a channel's children stop re-running when the channel changes                                                                                                                                       | `Channel` no longer remounts its subtree per channel                                                                                                               | Depend on the `channel` instance ([section 5](#channel-lifecycle-activation-no-remount-no-reload-no-search-jump))                                                                                                                                                                                                                                                         | Review: `useEffect(..., [])` in custom children of `Channel`                                                          |
| After switching channels, a child still shows the previous channel's name, draft or other local state                                                                                                                | `Channel` no longer remounts its subtree, so `useState(valueFromChannel)` keeps the value of the first channel it saw                                              | Reset the state when `channel` changes ([section 5](#channel-lifecycle-activation-no-remount-no-reload-no-search-jump))                                                                                                                                                                                                                                                   | `useState(` seeded from `channel` in children of `Channel`                                                            |
| Search results open unwatched, empty channels in a custom result component                                                                                                                                           | Search results are no longer watched                                                                                                                               | `watch()` on open ([section 4](#search-results))                                                                                                                                                                                                                                                                                                                          | `SearchResultItem`, `SearchSourceResult`                                                                              |
| Translations or overrides stop applying; non-English UI renders English                                                                                                                                              | Keys renamed, non-English dictionaries removed                                                                                                                     | Rename keys, register dictionaries ([section 18](#18-i18n))                                                                                                                                                                                                                                                                                                               | `registerTranslation`, `Translations`, `language:`                                                                    |
| CSS on `.str-chat__main-panel`, `.str-chat__container`, `.str-chat__channel-list-inner` or `.str-chat__thread--virtualized` stops applying                                                                           | Those wrappers and classes are gone                                                                                                                                | Grep for them, combinators included, and retarget ([section 19](#19-css-and-markup))                                                                                                                                                                                                                                                                                      | The section 19 `styles` pattern                                                                                       |
| Plain JS: `useCreateChatClient({ options })` stops applying `baseURL` and other settings                                                                                                                             | `options` was renamed to `config`                                                                                                                                  | [Section 2](#usecreatechatclient-options--config)                                                                                                                                                                                                                                                                                                                         | `useCreateChatClient`                                                                                                 |
| Plain JS: a removed prop or override key (`Message`, `HeaderStartContent`, `do*Request`, `overrideSubmitHandler`, ...) does nothing                                                                                  | Ignored without a warning                                                                                                                                          | Grep for each removed name listed in this guide                                                                                                                                                                                                                                                                                                                           | The [leftover-identifier grep](#verification)                                                                         |
| Plain JS: a mention click handler, a custom `renderText` or a custom mention renderer gets `undefined` where it read the mentioned users, and users passed to `mentionsMarkdownPlugin` render without `data-user-id` | The `mentioned_users` / `mentionedUsers` arguments and `node.mentionedUser` are removed, arguments after them moved up, and the plugin takes mention entities only | Read the metadata from `message` or `options.messageMentionEntities` ([section 12](#rendertext-takes-text-options)); pass `getRenderTextMentionEntities(message)` to `mentionsMarkdownPlugin` ([section 12](#mentionsmarkdownplugin-takes-mention-entities-only))                                                                                                         | `mentioned_users`, `mentionedUsers`, `mentionedUser`, `mentionsMarkdownPlugin`                                        |
| Without `onMentionsClick`, a message with mentions is no longer a separate focus stop. Plain JS: a custom message UI that calls `onMentionsClickMessage(event)` throws                                               | `useMessageContext()` sets `onMentionsClickMessage` / `onMentionsHoverMessage` only when `onMentionsClick` / `onMentionsHover` is passed                           | Pass `onMentionsClick` to `MessageList` or `Message` (`VirtualizedMessageList` has none: render `<Message onMentionsClick={…} />` from its `customMessageRenderer`, and from a `ThreadHead` override for the thread's parent message), and call the handlers with `?.` ([section 12](#onmentionsclickmessage-and-onmentionshovermessage-are-undefined-without-a-handler)) | `onMentionsClickMessage`, `onMentionsHoverMessage`                                                                    |
| A supplied composer keeps its content after `MessageComposer` unmounts                                                                                                                                               | A supplied composer is never cleared on unmount                                                                                                                    | Call `composer.clear()` yourself ([section 13](#preventclearingonunmount-is-removed))                                                                                                                                                                                                                                                                                     | `MessageComposerControllerProvider`                                                                                   |
| A voice message stops another one playing in a different panel                                                                                                                                                       | Playback is exclusive app-wide                                                                                                                                     | Nothing to do ([section 12](#allowconcurrentplayback-is-removed-one-voice-message-plays-at-a-time))                                                                                                                                                                                                                                                                       | `allowConcurrent`                                                                                                     |
| A custom composer without `CommandChip` loses `/giphy` from the text as soon as the command is typed                                                                                                                 | `stream-chat` v10 installs the command middlewares, which move the active command out of the text                                                                  | Remove the four command middlewares ([section 13](#command-middlewares-are-installed-by-stream-chat))                                                                                                                                                                                                                                                                     | `stream-io/text-composer/(active-command-guard                                                                        | command-string-extraction)`, `command-string-injection`, a custom composer that renders no `CommandChip` |
| The attachment menu offers different actions than before                                                                                                                                                             | Actions follow the composer's resolved configuration                                                                                                               | Set `customCdn` where it applies ([section 13](#attachment-and-poll-availability))                                                                                                                                                                                                                                                                                        | `doUploadRequest`, `customCdn`                                                                                        |
| A custom `MessageTimestamp` does not show in the header of a gallery you build yourself                                                                                                                              | The gallery renders outside a message and reads the item; it uses the override only when the item carries its `message`                                            | Set `message` on each `GalleryItem` ([section 12](#the-gallery-header-renders-the-messagetimestamp-override-for-items-that-carry-their-message))                                                                                                                                                                                                                          | `GalleryItem`, `<Gallery`                                                                                             |
| `dayjs(created_at)` renders `Invalid Date`                                                                                                                                                                           | Server timestamps are unix nanoseconds                                                                                                                             | Convert with `convertTimestampToDate` ([section 16](#16-dates-on-response-types-are-unix-nanosecond-numbers))                                                                                                                                                                                                                                                             | The section 16 detection pattern                                                                                      |
| The "New Messages!" notification no longer shows after jumping to older messages                                                                                                                                     | It shows only when a message arrives while the list is scrolled up                                                                                                 | Read `messagePaginator.hasMoreHead` for an "older messages shown" indicator ([section 11](#the-new-messages-notification-shows-only-for-messages-that-arrived))                                                                                                                                                                                                           | `NewMessageNotification`                                                                                              |
| The scroll-to-latest button shows a larger number than before                                                                                                                                                        | It shows the channel's unread count for the current user, not the messages that arrived while scrolled up                                                          | Nothing to do; see [section 11](#scrolltolatestmessagebutton-shows-the-channels-unread-count)                                                                                                                                                                                                                                                                             | `ScrollToLatestMessageButton`                                                                                         |
| A custom loader given to `InfiniteScrollPaginator` (or `ChannelList` / `SearchSourceResultList`) is called earlier and more often                                                                                    | `loadNextDebounceMs` now limits how often the scroll position is checked, rather than waiting for scrolling to stop                                                | Ignore calls while a page is loading ([section 11](#loading-older-messages-keeps-your-place-loadnextdebouncems-rate-limits-the-check))                                                                                                                                                                                                                                    | `InfiniteScrollPaginator`, `loadNextOnScrollTo`, `loadMoreDebounceMs`                                                 |
| A `ChannelDetail` in a side panel or another non-modal container shows no close button                                                                                                                               | Outside a modal, the views render a close button only when `ChannelDetail` or `ChannelDetailProvider` gets `onClose`                                               | Pass `onClose` ([section 10](#channeldetail-takes-onclose-outside-a-modal-it-shows-no-close-button-without-it))                                                                                                                                                                                                                                                           | `\bChannelDetail\b`, `\bChannelDetailProvider\b` (also aliased imports); check each rendered one is in a modal        |
| A channel shown without `<Channel>` misses messages sent while the client was offline, or a channel reloads twice after a reconnect                                                                                  | The client reloads only activated channels after a reconnect, and v14's `Channel` no longer reloads on `connection.recovered`                                      | Call `channel.activate()` in a custom surface; remove app-side reloads on `connection.recovered` ([section 5](#channel-lifecycle-activation-no-remount-no-reload-no-search-jump))                                                                                                                                                                                         | `connection.recovered`, `.reload(`, custom channel surfaces without `<Channel`                                        |
| A custom edit button shows on poll messages and giphies                                                                                                                                                              | `useMessagePermissions(message).canEdit` (`useUserRole` in v14) is the update permission alone                                                                     | Add `!message.poll_id && message.command !== 'giphy'` ([section 10](#messageactions-and-message_actions-are-removed))                                                                                                                                                                                                                                                     | `canEdit`                                                                                                             |
| A custom `messageActionSet` offers Edit on poll messages, or Copy on messages without text                                                                                                                           | Those rules moved from the base filter onto the default items' `isVisible`                                                                                         | Copy the default item's `isVisible` ([section 10](#messageactions-and-message_actions-are-removed))                                                                                                                                                                                                                                                                       | `messageActionSet`, `disableBaseMessageActionSetFilter`                                                               |
| A custom `AttachmentPreviewList`, `VoiceRecordingPreviewSlot` or `LinkPreviewList` no longer shows a location, poll or empty state                                                                                   | Each slot mounts only while its item in `defaultMessageComposerPreviewSet` is visible                                                                              | Replace the item with one whose `isVisible` covers it ([section 13](#new-composer-previews-are-a-configurable-set))                                                                                                                                                                                                                                                       | `AttachmentPreviewList`, `VoiceRecordingPreviewSlot`, `LinkPreviewList` in `WithComponents` overrides                 |
| A custom pin, delete, mute, flag or mark-unread button logs an unhandled promise rejection                                                                                                                           | The handlers reject when the request fails or the message is missing                                                                                               | Catch around the call ([section 12](#message-action-handlers-reject-when-they-fail))                                                                                                                                                                                                                                                                                      | `handlePin`, `handleDelete`, `handleMute`, `handleFlag`, `handleMarkUnread`                                           |
| Plain JS: code that reads `initialMessage` treats the thread's parent message as a reply; a `ThreadHead` override's parent message no longer shows message actions                                                   | `initialMessage` is removed; the SDK detects the thread's parent message itself                                                                                    | Call `useIsRenderedAsThreadParent()` ([section 12](#initialmessage-is-removed-use-useisrenderedasthreadparent))                                                                                                                                                                                                                                                           | `initialMessage`                                                                                                      |
| A message that quotes another and carries a poll shows the quote first; CSS on `--has-single-attachment` misses poll messages                                                                                        | The bubble renders `defaultMessageBubbleContentSet`; poll messages get `str-chat__message--has-poll`                                                               | Reorder with `MessageBubbleContent`, or retarget the CSS ([section 12](#new-the-message-bubbles-content-is-a-configurable-set-the-quoted-message-renders-above-a-poll))                                                                                                                                                                                                   | `has-single-attachment` (`styles`)                                                                                    |

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
| `useUserRole`                                                                                                                                                                    | [Section 12](#useuserrole-is-renamed-to-usemessagepermissions)                            |
| `deTranslations` ... `trTranslations`, `enTranslations`, `isLanguageSupported`, `SupportedTranslations`, `DateFormatterOptions`                                                  | [Section 18](#18-i18n)                                                                    |
| `DefaultCommandData`                                                                                                                                                             | [Section 17](#17-other-stream-chat-v10-data-shapes)                                       |

New root exports: `useMessagePaginator()` returns the active list's paginator (the thread's inside a thread, the channel's otherwise), `useIsCooldownActive()` tells whether slow mode is counting down, and `messageHasMentions(message)` tells whether a message mentions anyone (a user, `@channel`, `@here`, a role or a user group).

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

| v14 `useChatContext()` field   | v15                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channel` (the active channel) | Inside the channel subtree: `useChannel()`. Elsewhere: `useWorkspaceNavigation().openChannels`, or `useSlotChannel({ slot })` from `stream-chat-react/slot-layout`, and only below the navigation provider: a component rendered next to `ChatView` instead of inside it always gets `openChannels: []`. See [section 4](#inside-chatview). |
| `setActiveChannel`             | `useWorkspaceNavigation().openChannel(channel, { event })`. See [section 4](#4-selecting-channels-and-opening-threads-workspace-navigation).                                                                                                                                                                                                |
| `channelsQueryState`           | The channel list's own query state: `useChannelPaginatorState(paginator)` returns `{ channels, hasMoreHead, hasMoreTail, isLoading, lastQueryError }`; `hasMoreTail` says whether `paginator.toTail()` has another page. `ChannelList` reports `lastQueryError` through `client.notifications`.                                             |
| `latestMessageDatesByChannels` | Slow-mode cooldown: `useCooldownRemaining()` or `useStateStore(channel.cooldownTimer.state, selector)`. The channel's latest message: `channel.messagePaginator.aggregateState` (`latestMessage`). When the current user last posted: not available; track it from `message.new` yourself.                                                  |
| `mutes`                        | Unchanged, but typed `UserMuteResponse[]` (was `Mute[]`).                                                                                                                                                                                                                                                                                   |
| `getAppSettings`               | Returns `ReturnType<StreamChat['getAppSettings']>`.                                                                                                                                                                                                                                                                                         |

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

// `layouts` (and `resolveDuplicateEntity`, if you pass it) must be referentially stable: a new value
// re-creates the layout controller and closes everything that was open. Keep `slotRenderers` stable
// too: a new object re-renders every `useWorkspaceNavigation()` consumer. `views` may be built in render.
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

// Module scope here because nothing depends on props. `layouts` must be stable (a new array closes
// everything that was open); keep `slotRenderers` stable too (`useMemo` when it needs props).
// `views` can be built in render.
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

The same holds for your own components. Anything that reads `useWorkspaceNavigation()` (an "in a call" panel, a header badge for the open channel) has to render inside `ChatView`. Pass it as a `ChatView` child in a `views` layout: children render inside the provider, before the active view, and stay mounted when the view switches. The built-in `layout="nav-rail-entity-list-workspace"` does not render `children`. `openChannels` lists the active view's channels, so it is empty while the threads view is shown.

```tsx
// `CallControls` stands for a component of your own.
const CallPanel = () => {
  const { openChannels } = useWorkspaceNavigation();
  const channel = openChannels[0];
  return channel ? <CallControls channel={channel} /> : null;
};

<Chat client={client}>
  <ChatView layouts={layouts} slotRenderers={slotRenderers} views={views}>
    <CallPanel />
  </ChatView>
</Chat>;
```

### Without `ChatView`

Hold what is open in your own state and provide `WorkspaceNavigationProvider` with an object built from `defaultWorkspaceNavigation`. Every member you do not override keeps its inert default (`false`, a no-op, an empty list). Override:

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
  Thread as StreamThread,
} from 'stream-chat';
import {
  Channel,
  ChannelList,
  ChannelPlaceholder,
  Chat,
  defaultWorkspaceNavigation,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  type WorkspaceNavigation,
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

  const navigation = useMemo<WorkspaceNavigation>(
    () => ({
      ...defaultWorkspaceNavigation,
      closeThread: () => setActiveThread(undefined),
      isChannelActive: (cid) => !!cid && cid === activeChannel?.cid,
      isThreadActive: (threadId) => !!threadId && threadId === activeThread?.id,
      // the default ThreadHeader renders its close button only when this returns true
      isThreadDismissable: (threadId) => !!threadId && threadId === activeThread?.id,
      openChannel: (channel) => {
        setActiveChannel(channel);
        setActiveThread(undefined);
      },
      openChannels: activeChannel ? [activeChannel] : [],
      openThread: (target) =>
        setActiveThread(
          target instanceof StreamThread
            ? target
            : client.threads.ensure({
                channel: target.channel,
                parentMessage: target.message,
              }),
        ),
      openThreads: activeThread ? [activeThread] : [],
    }),
    [activeChannel, activeThread, client],
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

- An `openThread` target is either a `Thread` or `{ channel, message }`. `client.threads.ensure({ channel, parentMessage })` turns the latter into a registered `Thread`.
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

**Channel input shape (`stream-chat` v10).** The third argument of `client.channel()` is `ChannelInput`. `members` is `ChannelMemberRequest[]`, `{ user_id }` objects instead of an id list, and custom fields such as `name` go under `custom` (`{ custom: { name } }`). Plain ids now fail to compile (`TS2769`), though the API still accepts them at runtime, so this is a type fix, not a behavior change.

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
- **No reload on reconnect.** `Channel` no longer calls `channel.reload()` on `connection.recovered`. After a reconnect, `client.connectionRecovery` re-queries the registered channel lists and reloads every active channel and thread itself, then dispatches `connection.recovered`. Do not add a `connection.recovered` handler that reloads channels: they are already reloaded, and it would reload them twice. A channel that nobody activated is not reloaded ([`stream-chat` reference](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#channel-activate-recovery)), so a custom surface needs the activation:

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

`Channel` no longer marks the channel read when it mounts. `MessageList` / `VirtualizedMessageList` mark it read (`useMarkRead`) while the list is at the bottom, showing the live head, the tab is visible and the channel is not flagged unread. **A `Channel` rendered without a message list is never marked read**; call `channel.markReadViaReporter()` yourself there. It goes through the delivery reporter and your `markReadRequest` handler, and resolves `null` when read events are off; `channel.markRead()` is the direct request, which skips both and throws when read events are off. `markReadOnMount={false}` has no direct equivalent. To change how read requests go out, register a `markReadRequest` handler ([section 14](#14-request-handlers)).

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

**Mention handlers.** The handler type is `(event, message)`; the v14 `mentioned_users` argument is removed, read the metadata from `message` ([section 12](#mention-handlers-receive-event-message)). `VirtualizedMessageList` has no such prop (v14 virtualized lists got the handlers only from `Channel`), so a virtualized list needs a custom message UI to handle mention clicks.

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
- `ChannelNavigation` finds every registered paginator through `client.channelManager`, so it takes no prop. Pass the paginator down only to code that needs it, such as `useOpenFirstChannel` [below](#v14-list-defaults-that-changed). `views` may take it as a prop directly; it does not need to be referentially stable.

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
  - It opens once per load of the list: closing the last channel, or a channel moving to the top, opens nothing. After `client.disconnectUser()` resets the list, the next load opens its first channel again, once the previous user's channel is closed: inside `ChatView`, mount `<DisposedChannelRelease />` (from `stream-chat-react/slot-layout`); without it, clear your own state as described in [Without `ChatView`](#without-chatview).
  - With several lists, call it once, for the list whose first channel should open. Each call knows only its own paginator, so with one call per list the first page to arrive wins, and two pages arriving before a re-render can both open.
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

`ChannelListUI`, `ChannelListUIProps` and the `ComponentContext.ChannelListUI` slot are removed. `ChannelList` renders an `InfiniteScrollPaginator` and reads these `ComponentContext` slots instead (`ThreadList` reads `FirstPageLoadingIndicator` and `ListLoadErrorIndicator` too; only `ChannelList` reads the others today). To give the lists different overrides, wrap each in its own `WithComponents`; under `ChatView`, do it in `slotRenderers.channelList` / `slotRenderers.threadList`, which render `ChannelNavigation` and `ThreadList`. The slots:

| Slot                        | Props                          | Default                                                           |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `EmptyListIndicator`        | none                           | the empty state                                                   |
| `EndReachedIndicator`       | `{ hasEnded, reached }`        |                                                                   |
| `FirstPageLoadingIndicator` | none                           | `LoadingChannels`                                                 |
| `ListItem`                  | `{ item }`                     | renders `ChannelListItem`                                         |
| `ListLoadErrorIndicator`    | `{ error, isRetrying, retry }` | an icon, the list's "Couldn't load …" text and a Try again button |
| `LoadingNextPageIndicator`  | `{ isLoading? }`               |                                                                   |

`ComponentContext.LoadingIndicator` no longer affects the channel list (the `LoadingErrorIndicator` slot is removed, [section 5](#channel-requires-channel-and-renders-no-placeholder-loading-or-error-state)). A first page that fails to load renders `ListLoadErrorIndicator` in place of the list; its `retry` calls `paginator.reload()`. The list keeps it on screen while the retry runs, with `isRetrying` set, so a focused retry button keeps focus, also when the retry fails; a retry that loads the list is announced. A query error that happens while the list is mounted is also reported as an error notification in the `channel-list` panel, which `ChannelNavigation` renders; a `ChannelList` used without it renders no `NotificationList` for that panel. For a fully custom list, read `useChannelPaginatorState(paginator)` and render your own.

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

| v14                                                                                                                      | v15                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lastMessage` (on `ChannelListItemUIProps` and `ChannelListItemTimestamp`)                                               | `previewedMessage`. `ChannelListItem` also takes `previewedMessage` to preview a specific message (a search result previewing the match); it defaults to `channel.messagePaginator.aggregateState.lastMessage`.                                                                                                                                                                           |
| `latestMessagePreview` (`ChannelListItemUIProps`), `getLatestMessagePreview` (`ChannelListItem` and `ChannelList` props) | Render `<SummarizedMessagePreview latestMessage={previewedMessage} ... />`, or override the `SummarizedMessagePreview` slot with `WithComponents` (`SummarizedMessagePreviewProps`: `{ latestMessage, messageDeliveryStatus, participantCount }`).                                                                                                                                        |
| `setActiveChannel`, `watchers`                                                                                           | `useWorkspaceNavigation().openChannel(channel, { event })`, or the `onSelect` prop ([section 4](#4-selecting-channels-and-opening-threads-workspace-navigation))                                                                                                                                                                                                                          |
| `channelUpdateCount`, `key`                                                                                              | None; the item subscribes to the channel's stores                                                                                                                                                                                                                                                                                                                                         |
| `active`                                                                                                                 | Unchanged prop; it now defaults to `useWorkspaceNavigation().isChannelActive(cid)`. `ChannelListItem` passes the resolved value to `ChannelListItemUI` as `active`. The SDK's CSS highlights `.str-chat__channel-list-item[aria-selected=true]` only (v14 also matched `[aria-pressed=true]`), so a custom row that keeps the SDK class sets `role="option"` and `aria-selected={active}` |

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
  active,
  channel,
  displayTitle,
  messageDeliveryStatus,
  previewedMessage,
}: ChannelListItemUIProps) => {
  const { openChannel } = useWorkspaceNavigation();
  return (
    <button
      aria-selected={active}
      className='str-chat__channel-list-item'
      onClick={(event) => openChannel(channel, { event })}
      role='option'
    >
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

| Removed `ThreadProps`                   | v15                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `additionalMessageComposerProps`        | Props on your `MessageComposer` child                                                                                                                                                                                                                                                                                                      |
| `additionalMessageListProps`            | Props on your `MessageList` child                                                                                                                                                                                                                                                                                                          |
| `additionalVirtualizedMessageListProps` | Props on your `VirtualizedMessageList` child                                                                                                                                                                                                                                                                                               |
| `additionalParentMessageProps`          | The list's own message props, which reach the parent message too; for anything else, a `ThreadHead` override on `ComponentContext` (typed `ComponentType<MessageProps>`). The default `ThreadHead` is not exported, so an override renders the whole head (`DateSeparator` for the parent's `created_at`, `<Message />` and `ThreadStart`) |
| `autoFocus` (default `true`)            | `<MessageComposer focus />` in every thread that should focus, whether or not you passed `autoFocus`                                                                                                                                                                                                                                       |
| `enableDateSeparator`                   | `withDateSeparator` on the list                                                                                                                                                                                                                                                                                                            |
| `Message`                               | A `MessageUI` override scoped with `WithComponents`                                                                                                                                                                                                                                                                                        |
| `messageActions`                        | Removed ([section 10](#messageactions-and-message_actions-are-removed))                                                                                                                                                                                                                                                                    |
| `virtualized`                           | Render the list you want                                                                                                                                                                                                                                                                                                                   |

**Defaults changed.** A `MessageList` inside a thread now shows date separators unless you pass `withDateSeparator={false}` (v14's `Thread` turned them off). `autoFocus` defaulted to `true`, so every v14 thread focused its composer on open, not only threads that passed the prop; in v15 the composer is focused only if you render `<MessageComposer focus />`.

**The parent message** is rendered by the message list, inside the scroll container; both lists resolve it from the thread context. It gets the list-wide message props the replies get, so `onMentionsClick` or `onUserClick` on `MessageList` works on the parent message too. `MessageList` passes `onMentionsClick`, `onMentionsHover`, `onUserClick`, `onUserHover`, `renderText`, `formatDate`, `unsafeHTML`, `showAvatar`, `reactionDetailsSort`, `sortReactions` and `closeReactionSelectorOnClick`; `VirtualizedMessageList` passes the ones it has (`renderText`, `formatDate`, `showAvatar`, `reactionDetailsSort`, `sortReactions`, `closeReactionSelectorOnClick`). Both lists also pass `additionalMessageComposerProps`, which no message component reads. The read state does not reach the parent message: neither list passes `returnAllReadData`, `readBy` or `deliveredTo` to it, and `MessageStatus` shows no read state inside a thread. A `ThreadHead` override that needs them sets them itself. Only the props you set are passed, so a `ThreadHead` override receives them too, without overwriting its own defaults with `undefined`.

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
- The first-load skeleton is the shared `FirstPageLoadingIndicator` slot (no props, default `LoadingChannels`), the same one the channel list reads. The shared `ListLoadErrorIndicator` slot (`{ error, isRetrying, retry }`) renders in place of the list when the first load fails; its `retry` calls `client.threads.reload({ force: true })`. A query error that happens while the list is mounted is also reported as an error notification in the `thread-list` panel.

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
- `ChannelHeader` also takes `Title`, which replaces only the title and receives `{ channel, displayTitle }` (`ChannelHeaderTitleProps`; the default is `ChannelHeaderTitle`). Render the title as a button there instead of rebuilding the header. `Subtitle` likewise replaces only the subtitle (default `ChannelHeaderSubtitle`). A header you build yourself keeps the default subtitle by rendering `ChannelHeaderSubtitle` (Online/Offline for a direct message, member and online counts otherwise, the typing indicator while someone types), or reads the status text with `useChannelHeaderOnlineStatus()`.
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

| v14                                                                          | v15                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loadMore` (older) / `loadMoreNewer`                                         | `channel.messagePaginator.toTail()` / `.toHead()`. `MessageList` uses exactly these: `toTail` on scroll to the top, `toHead` on scroll to the bottom.                                                                                                  |
| `loadMoreThread`                                                             | `thread.messagePaginator.toTail()`                                                                                                                                                                                                                     |
| `jumpToMessage(id)` / `jumpToLatestMessage()` / `jumpToFirstUnreadMessage()` | `messagePaginator.jumpToMessage(id)` / `.jumpToTheLatestMessage()` / `.jumpToTheFirstUnreadMessage()`                                                                                                                                                  |
| `sendMessage`                                                                | `messageComposer.send()`, or `useMessageComposerSubmitFn()` in a composer UI. Lower level: `channel.messageOperations.send({ localMessage, message, options })`                                                                                        |
| `retrySendMessage`                                                           | `channel.messageOperations.retry({ localMessage })`, or `handleRetry` from `useMessageContext()`                                                                                                                                                       |
| `editMessage`                                                                | `messageComposer.update()`, or `channel.messageOperations.update({ localMessage, options })`                                                                                                                                                           |
| `deleteMessage`                                                              | `channel.messageOperations.delete({ localMessage, options })`, or `handleDelete` from `useMessageContext()`                                                                                                                                            |
| `updateMessage` / `removeMessage` (local-only list writes)                   | `messagePaginator.ingestItem(message)` / `.removeItem({ id })`. Normally unnecessary: the client applies WebSocket events itself.                                                                                                                      |
| `markRead`                                                                   | `channel.markReadViaReporter()` (`channel.markRead()` is now the direct request: it skips the reporter and the `markReadRequest` handler). The unread UI snapshot is separate state on the paginator; there is no `updateChannelUiUnreadState` option. |
| `setChannelUnreadUiState`                                                    | `channel.messagePaginator.setUnreadSnapshot(partial)`                                                                                                                                                                                                  |
| `openThread` / `closeThread`                                                 | `useWorkspaceNavigation().openThread({ channel, message })` / `.closeThread(threadId)`; inside a thread, `useCloseThread()` ([section 4](#4-selecting-channels-and-opening-threads-workspace-navigation))                                              |
| `onMentionsClick` / `onMentionsHover`                                        | The props on `MessageList` / `Message`                                                                                                                                                                                                                 |
| `dispatch`                                                                   | None; there is no React reducer                                                                                                                                                                                                                        |

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

`TypingContext`, `TypingContextValue`, `TypingProvider` and `useTypingContext` are removed. Subscribe to the channel's own store: `typing` is keyed by user id and holds each user's `typing.start` event. The non-reactive snapshot is `channel.state.typing`. The SDK's own `TypingIndicator`, `TypingIndicatorHeader`, `ChannelHeader` and `ThreadHeader` read this slice and filter it by `parent_id` for threads. The text composer keeps no copy (`TextComposerState` has no `typing`), so read `channel.state` in a thread too.

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

**Reading who is typing.** The slice is typed `Record<string, EventPayload<'typing.start'>>`, so `event.user` is available directly:

```tsx
// v14
const { typing } = useTypingContext();
const names = Object.values(typing ?? {}).map(({ user }) => user?.name);
```

```tsx
import type { ChannelStateData } from 'stream-chat';
import { useChannel, useChatContext, useStateStore } from 'stream-chat-react';

const typingSelector = ({ typing }: ChannelStateData) => ({ typing });

export const TypingUsers = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { typing } = useStateStore(channel.state, typingSelector);
  const names = Object.values(typing)
    .filter(({ user }) => user?.id !== client.user?.id)
    .map(({ user }) => user?.name ?? user?.id);
  return names.length ? <span>{names.join(', ')} typing</span> : null;
};
```

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

**If your custom message UI calls `getMessageActions()` or checks `MESSAGE_ACTIONS`** (for example to show a reply or react button only when allowed), it has to change: read the permissions from `useMessagePermissions(message)` instead (example at the end of this section). The call fails to compile, and in untyped code throws `TypeError: getMessageActions is not a function`.

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
- An action's own rule about the message lives on its item as `isVisible({ isMyMessage, isThreadReply, message })`. In `defaultMessageActionSet`, `edit` hides for a poll message and a giphy, `copyMessageText` for a message without text and `download` for one without a downloadable attachment. Replace the item to change its rule. `isVisible` can only hide an action: the capabilities, the features enabled on the server and the message's status are still checked by the base filter. Item rules apply even with `disableBaseMessageActionSetFilter`, and to failed messages: v14 offered Edit on any message that failed to send for a network reason, while a network-failed poll message or giphy now gets no Edit. For example, to let users edit the text and attachments sent with a poll:

  ```tsx
  import { defaultMessageActionSet, type MessageActionSetItem } from 'stream-chat-react';

  const messageActionSet = defaultMessageActionSet.map(
    (item): MessageActionSetItem =>
      'type' in item && item.type === 'edit'
        ? { ...item, isVisible: ({ message }) => message.command !== 'giphy' }
        : item,
  );
  ```

- A hand-written `edit`, `copyMessageText` or `download` item without `isVisible` now shows wherever the base filter allows it, e.g. `edit` on a poll message the user may update. Copy the default item's `isVisible` to keep the default rule.
- `useMessagePermissions(message).canEdit` (`useUserRole` in v14) is now the permission alone (`update-any-message`, or `update-own-message` on the user's own message), the same check the base filter makes. It no longer excludes poll messages and giphies; a custom UI that gated an edit button on it and wants that rule adds `!message.poll_id && message.command !== 'giphy'` itself.
- There is no `actionsEnabled` replacement. The base filter already drops actions on deleted, bounced and failed messages.
- **A custom `MessageUI` that gated its own buttons** on `getMessageActions()` / `MESSAGE_ACTIONS` (for example showing a react or reply button only when allowed) reads the permission from `useMessagePermissions(message)`, which returns `canReact`, `canReply`, `canPin`, `canEdit`, `canDelete`, `canFlag`, `canMute`, `canQuote`, `canMarkUnread`, `canBlockUser`, `canSendMessage` and `isMyMessage`:

  ```tsx
  import { useMessageContext, useMessagePermissions } from 'stream-chat-react';

  export const ReplyButton = () => {
    const { handleOpenThread, message } = useMessageContext();
    const { canReply } = useMessagePermissions(message);
    return canReply ? <button onClick={handleOpenThread}>Reply</button> : null;
  };
  ```

- Adding an action means adding an item with a `Component` and a `placement` of `quick`, `dropdown` or `quick-dropdown-toggle`.

### `ChannelDetail` takes `onClose`; outside a modal it shows no close button without it

The channel detail views (from `stream-chat-react/channel-detail`) close through the nearest modal. In v14, a `ChannelDetail` rendered outside a modal, for example in a side panel, showed close buttons that did nothing. In v15:

- `ChannelDetail` and `ChannelDetailProvider` take `onClose`. The views' close buttons call it, and so do the actions that close the channel detail when they finish: opening a pinned message, leaving or deleting the channel, and sending a direct message. Inside a modal it is called instead of the modal's `close`, so close the modal from it. A modal opened inside the channel detail, such as a confirmation alert, still closes itself.
- Without `onClose`, outside a modal the views render no close button. Inside a modal they close the modal, as in v14.
- `useChannelDetailContext()` returns `close` next to `channel`. A custom section passes it to `SectionNavigatorHeader`; it is `undefined` when there is nothing to close.
- `ChannelDetail.onLayoutChange` is called on every layout change. v14 ignored it.

An app that wrapped `ChannelDetail` in `ModalContextProvider` to make the close buttons work keeps working. Replace the wrapper with `onClose`:

```tsx
import { useMemo } from 'react';
import type { Channel } from 'stream-chat';
import { ChannelInstanceProvider } from 'stream-chat-react';
import { ChannelDetail } from 'stream-chat-react/channel-detail';

type ChannelDetailsPanelProps = { channel: Channel; closePanel: () => void };

// A panel outside the channel's `<Channel>` provides the channel itself: the channel info
// section reads it for the online status.
export const ChannelDetailsPanel = ({
  channel,
  closePanel,
}: ChannelDetailsPanelProps) => {
  const channelContext = useMemo(() => ({ channel }), [channel]);

  return (
    <ChannelInstanceProvider value={channelContext}>
      <ChannelDetail channel={channel} onClose={closePanel} />
    </ChannelInstanceProvider>
  );
};
```

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
- `MessageProps.threadList` and `MessageContextValue.threadList` are removed too. A custom `MessageUI` or message child that read `useMessageContext().threadList` uses `!!useThreadContext()` instead.
- `ReactionSelector.getDialogId` takes only `{ messageId }`, and the reaction selector's dialog id no longer has a `-thread` part. The channel list and the thread list each have their own dialog manager, so the same message open in both still gets two separate dialogs.

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

### Message grouping: `groupByUser` and `getGroupStyles`

Both lists take `groupByUser`; the defaults are unchanged.

| Component                | v14                                   | v15                             |
| ------------------------ | ------------------------------------- | ------------------------------- |
| `MessageList`            | `noGroupByUser` (default `false`)     | `groupByUser` (default `true`)  |
| `VirtualizedMessageList` | `shouldGroupByUser` (default `false`) | `groupByUser` (default `false`) |

The `groupStyles` prop of both lists is renamed `getGroupStyles`, and the function takes one object instead of five positional arguments: `{ groupByUser, maxTimeBetweenGroupedMessages, message, nextMessage, previousMessage }` (`GetGroupStylesParams`; `nextMessage` and `previousMessage` are `undefined` at the ends of the list). `groupByUser` replaces the inverted `noGroupByUser` argument. The exported default `getGroupStyles` takes the same object, so a custom function can still delegate to it. `useEnrichedMessages` takes `getGroupStyles` and `groupByUser` instead of `groupStyles` and `noGroupByUser`. `VirtuosoContext.shouldGroupByUser` is `groupByUser`.

In untyped code the old props are ignored and the defaults apply: `MessageList noGroupByUser` groups again, `VirtualizedMessageList shouldGroupByUser` stops grouping, and a `groupStyles` function is never called. A positional function passed as `getGroupStyles` receives the object as its first argument and `undefined` for the others, so it computes wrong styles or throws, for example on `previousMessage.created_at`; TypeScript rejects it.

```tsx
// v14
<MessageList noGroupByUser />
<VirtualizedMessageList shouldGroupByUser />
<MessageList
  groupStyles={(message, previousMessage, nextMessage, noGroupByUser, maxTime) =>
    'pinned' in message && message.pinned
      ? 'single'
      : getGroupStyles(message, previousMessage, nextMessage, noGroupByUser, maxTime)
  }
/>

// v15
<MessageList groupByUser={false} />
<VirtualizedMessageList groupByUser />
<MessageList
  getGroupStyles={(params) =>
    'pinned' in params.message && params.message.pinned ? 'single' : getGroupStyles(params)
  }
/>
```

### Custom `renderMessages` gets different options

- `RenderMessagesOptions.channel: Channel` is new and required.
- `channelUnreadUiState` is now required and typed `UnreadSnapshotState` (`firstUnreadMessageId`, `lastReadAt`, `lastReadMessageId`, `unreadCount`); `focusedMessageId?` is new. Reading the v14 snake_case fields yields `undefined`, so a hand-rolled unread separator never renders.
- `getIsFirstUnreadMessage` takes `UnreadSnapshotState & { channel?, isFirstMessage, message, previousMessage? }` (`lastReadDate` → `lastReadAt`, `unreadMessageCount` → `unreadCount`) and returns `false` without a `channel` or inside a thread.
- The default renderer no longer places the unread separator before a system message.

### `VirtuosoContext` (the context of `additionalVirtuosoProps.components`)

- Removed: `Message`, `messageActions`, `openThread`, `threadList`.
- New and required: `channel: Channel`. New: `focusedMessageId?`.
- Renamed: `shouldGroupByUser` → `groupByUser`.
- `head`, `firstUnreadMessageId` and `lastReadMessageId` are `... | null` (checks written as `=== undefined` miss them); `lastReadDate` is `TimestampNS | null` (unix nanoseconds); `loadingMore: boolean`; `unreadMessageCount: number`.

### `VirtualizedMessageList`: `defaultItemHeight`, `overscan` and `scrollSeekPlaceHolder` are removed

Pass them to `react-virtuoso` through `additionalVirtuosoProps`. `react-virtuoso` defaults `overscan` to `0`, as the v14 prop did, so leaving it out keeps the v14 behavior.

| v14 prop                | v15                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `defaultItemHeight`     | `additionalVirtuosoProps.defaultItemHeight`                                                                      |
| `overscan`              | `additionalVirtuosoProps.overscan`                                                                               |
| `scrollSeekPlaceHolder` | `additionalVirtuosoProps.scrollSeekConfiguration` and `additionalVirtuosoProps.components.ScrollSeekPlaceholder` |

In v14, `scrollSeekPlaceHolder` reached `react-virtuoso` as its deprecated `scrollSeek` prop, which logged a warning. `scrollSeekConfiguration` with `components.ScrollSeekPlaceholder` keeps the same behavior without the warning. `defaultItemHeight` and `scrollSeekPlaceHolder` used to win over `additionalVirtuosoProps`; now `additionalVirtuosoProps` is the only source.

```tsx
// v14
<VirtualizedMessageList defaultItemHeight={80} overscan={200} />
```

```tsx
<VirtualizedMessageList
  additionalVirtuosoProps={{ defaultItemHeight: 80, overscan: 200 }}
/>
```

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

### `MessageContext` grouping flags are removed; read `groupStyles`

`endOfGroup`, `firstOfGroup` and `groupedByUser` are removed from `MessageContextValue`. The message lists never set them, so in v14 they were always `undefined`. A message's place in its group of consecutive messages from one user is `groupStyles?.[0]` from `useMessageContext()`: `top`, `middle`, `bottom` or `single`, and `undefined` for a message no list groups (a standalone `<Message>`, or the thread's parent message). The default `MessageUI` renders the metadata on every message, and the default CSS hides it on `top` and `middle` list items (`.str-chat__li--top`, `.str-chat__li--middle`), so an app can show it again with CSS alone. The `str-chat__virtual-message__wrapper--end`, `--first` and `--group` classes these flags added are removed too ([section 19](#19-css-and-markup)).

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

`usePinHandler(message, notifications?)` returns `{ handlePin }`. Read `canPin` from `useMessagePermissions(message).canPin`. In untyped code the removed field is `undefined`, so a pin button gated on it never shows.

### `useUserRole` is renamed to `useMessagePermissions`

The hook returns what the current user may do with one message, not their role, so it is now `useMessagePermissions`. It takes only the message (the `disableQuotedMessages` argument is removed, see [The `disableQuotedMessages` prop is removed](#the-disablequotedmessages-prop-is-removed)) and returns `canBlockUser`, `canDelete`, `canEdit`, `canFlag`, `canMarkUnread`, `canMute`, `canPin`, `canQuote`, `canReact`, `canReply`, `canSendMessage` and `isMyMessage`. Rename the import and the call. In untyped code the old import is `undefined`, so the call throws `TypeError: useUserRole is not a function`.

```tsx
// v14
import { useUserRole } from 'stream-chat-react';

const { canReply } = useUserRole(message);
```

```tsx
import { useMessagePermissions } from 'stream-chat-react';

const { canReply } = useMessagePermissions(message);
```

### `useUserRole` no longer returns `isAdmin`, `isModerator` or `isOwner`

The three flags read the user's role, which is not what decides what they may do in a channel. Gate on a permission instead: `useMessagePermissions(message)` returns `canDelete`, `canEdit`, `canFlag`, `canMarkUnread`, `canMute`, `canPin`, `canQuote`, `canReact`, `canReply`, `canSendMessage`, `canBlockUser` and `isMyMessage`, all built from the channel's capabilities. For any other capability, read `useChannelCapabilities({ cid: channel.cid })`, a `Set` of capability names. Where the role itself is needed, read `client.user?.role` or `channel.state.membership`. In untyped code the removed flags are `undefined`, so UI gated on them never shows.

```tsx
// v14
const { isAdmin, isModerator } = useUserRole(message);
const showModerationTools = isAdmin || isModerator;
```

```tsx
const channel = useChannel();
const capabilities = useChannelCapabilities({ cid: channel.cid });
const showModerationTools = capabilities.has('ban-channel-members');
```

### The `disableQuotedMessages` prop is removed

`MessageList` and `Message` no longer take `disableQuotedMessages`, and `useMessagePermissions` takes only the message; its `canQuote` is the `quote-message` capability alone. Passing either is a compile error; in untyped code both are ignored. Nothing changes on screen: v14's default message actions already ignored the flag and showed Quote whether or not it was set. To hide Quote, leave it out of the action set ([section 10](#messageactions-and-message_actions-are-removed)):

```tsx
// v14
<MessageList disableQuotedMessages />
```

```tsx
import {
  defaultMessageActionSet,
  MessageActions,
  MessageList,
  WithComponents,
} from 'stream-chat-react';

const messageActionSet = defaultMessageActionSet.filter(
  // the dropdown-toggle item has no `type`; keep it
  (item) => !('type' in item) || item.type !== 'quote',
);

const MessageActionsWithoutQuote = () => (
  <MessageActions messageActionSet={messageActionSet} />
);

export const List = () => (
  <WithComponents overrides={{ MessageActions: MessageActionsWithoutQuote }}>
    <MessageList />
  </WithComponents>
);
```

### `initialMessage` is removed; use `useIsRenderedAsThreadParent()`

`Message` no longer takes `initialMessage`, and `MessageContextValue` no longer has it. The SDK tells the thread's parent message from its replies itself: `useIsRenderedAsThreadParent()` returns whether the message in `MessageContext` is the parent message of the thread in `ThreadContext`, because a `stream-chat` `Thread`'s `id` is its parent message's id. It returns `false` for the thread's replies and outside a thread. Call it in a component that `<Message>` renders, such as a `MessageUI` override.

- Passing `initialMessage` or reading `useMessageContext().initialMessage` is a compile error. In untyped code the prop is ignored and the field is `undefined`, so a check such as `!!useThreadContext() && !initialMessage` takes the parent for a reply.
- The parent message still gets no message actions, and now gets none without the flag too. A `ThreadHead` override renders `<Message {...props} />`.

For example, a component under each message that should skip the thread's replies but not its parent:

```tsx
// v14
const { initialMessage } = useMessageContext();
const isThreadReply = !!useThreadContext() && !initialMessage;
```

```tsx
import { useIsRenderedAsThreadParent, useThreadContext } from 'stream-chat-react';

const isThreadParent = useIsRenderedAsThreadParent();
const isThreadReply = !!useThreadContext() && !isThreadParent;
```

### `renderText` takes `(text, options)`

The `mentionedUsers` argument is removed, so `renderText(text, mentionedUsers, options)` becomes `renderText(text, options)`, and so does the `RenderTextFunction` type of the `renderText` prop on `MessageList`, `VirtualizedMessageList`, `Message`, `MessageText`, `QuotedMessage` and `QuotedMessagePreview`. Pass mentions as `options.messageMentionEntities`, built from a message with `getRenderTextMentionEntities(message)`; it covers `@channel`, `@here`, roles and user groups too. A custom `renderText` written for the old order reads the options object as `mentionedUsers` and loses them.

```tsx
// v14
const customRenderText: RenderTextFunction = (text, mentionedUsers, options) =>
  renderText(text, mentionedUsers, { ...options, customMarkDownRenderers });
```

```tsx
const customRenderText: RenderTextFunction = (text, options) =>
  renderText(text, { ...options, customMarkDownRenderers });
```

### `mentionsMarkdownPlugin` takes mention entities only

`mentionsMarkdownPlugin` and `createMentionPluginAndDisplayTextSet` no longer accept a users array. Pass `RenderTextMentionEntity[]`, built with `getRenderTextMentionEntities(message)`, which also covers `@channel`, `@here`, roles and user groups. Passing users fails to compile. In untyped code a user without `mentionType` matches by name and by ID, and renders with `data-mention-id` but without `data-mention-type="user"` or `data-user-id`.

```tsx
// v14
renderText(message.text, {
  getRehypePlugins: (plugins) => [
    mentionsMarkdownPlugin(message.mentioned_users ?? []),
    ...plugins,
  ],
});
```

```tsx
renderText(message.text, {
  getRehypePlugins: (plugins) => [
    mentionsMarkdownPlugin(getRenderTextMentionEntities(message)),
    ...plugins,
  ],
});
```

### Custom mention renderers read `node.mentionedEntity`

The `mention` node given to `customMarkDownRenderers.mention` no longer carries `mentionedUser`. Read `node.mentionedEntity`: for a user mention its `mentionType` is `'user'` and it carries the user's fields.

```tsx
// v14
const CustomMention = ({ children, node }: MentionProps) => (
  <span data-user-id={node.mentionedUser?.id}>{children}</span>
);
```

```tsx
const CustomMention = ({ children, node: { mentionedEntity } }: MentionProps) => (
  <span
    data-user-id={mentionedEntity.mentionType === 'user' ? mentionedEntity.id : undefined}
  >
    {children}
  </span>
);
```

### Mention handlers receive `(event, message)`

`onMentionsClick` and `onMentionsHover` (on `MessageList` or `Message`) are called with `(event, message)`; the v14 `mentioned_users` argument between them is removed, and so is the `MentionedUserEventHandler` type; type such handlers as `CustomMentionHandler`. Read `message.mentioned_users`, `mentioned_channel`, `mentioned_here`, `mentioned_roles` and `mentioned_groups`. The handler runs for an event anywhere in the message text; to find the mention that was clicked, read `data-mention-id`, `data-mention-type` or `data-user-id` from the target element. Enter or Space on the focused message text also calls the handler; its target is the text element, not a mention.

```tsx
// v14
<MessageList
  onMentionsClick={(event, mentionedUsers) => openProfile(mentionedUsers[0]?.id)}
/>
```

```tsx
const getMentionedUserId = (event: React.BaseSyntheticEvent, message: LocalMessage) => {
  // Enter or Space targets the message text, not a mention, so it identifies a user only when
  // the message's one mention is a user (no second user, @channel, @here, role or group).
  if (event.type === 'keydown') {
    const [mention, ...otherMentions] = getRenderTextMentionEntities(message);
    if (otherMentions.length || mention?.mentionType !== 'user') return undefined;
    return mention.id;
  }
  return (event.target as HTMLElement).closest<HTMLElement>('[data-user-id]')?.dataset
    .userId;
};

<MessageList
  onMentionsClick={(event, message) => {
    const userId = getMentionedUserId(event, message);
    if (userId) openProfile(userId);
  }}
/>;
```

### `onMentionsClickMessage` and `onMentionsHoverMessage` are `undefined` without a handler

`useMessageContext()` returns `onMentionsClickMessage` and `onMentionsHoverMessage` only when `onMentionsClick` / `onMentionsHover` was passed to `MessageList` or `Message`. `useMentionsHandler(message, { onMentionsClick, onMentionsHover })` likewise returns each handler only when you pass the matching one. A custom message UI that calls them directly needs `?.`, or passes them as event props. In untyped code a direct call throws `TypeError: onMentionsClickMessage is not a function`. In a thread, the parent message gets the list's handlers like the replies do. Without `onMentionsClick`, mentions in `MessageText` are plain text for the user: no separate focus stop, no Enter or Space handling, and the default cursor. With it, the text element gets `str-chat__message-text-inner--mentions-clickable` and mentions get a pointer cursor.

```tsx
// v14
const { onMentionsClickMessage } = useMessageContext();
const onKeyDown = (event) => onMentionsClickMessage(event);
```

```tsx
const { onMentionsClickMessage } = useMessageContext();
const onKeyDown = (event) => onMentionsClickMessage?.(event);
```

### Message action handlers reject when they fail

`handlePin`, `handleDelete`, `handleMute`, `handleFlag` and `handleMarkUnread` from `useMessageContext()` (and the `usePinHandler`, `useDeleteHandler`, `useMuteHandler`, `useFlagHandler` and `useMarkUnreadHandler` hooks) now reject:

- when the request fails. `handlePin` rolls the optimistic pin back and rethrows; v14 rolled back and resolved.
- when called without the message they act on (a custom message UI or hook call outside a message). v14 logged a `console.warn` or returned without a request.

The default `MessageActions` show the error notification. A custom button that calls one of them catches the rejection, or it goes unhandled. The handlers are typed `ReactEventHandler`, so `await` them in an `async` handler rather than chaining `.catch`:

```tsx
import { useMessageContext } from 'stream-chat-react';

export const PinButton = () => {
  const { handlePin } = useMessageContext();
  return (
    <button
      onClick={async (event) => {
        try {
          await handlePin(event);
        } catch (error) {
          console.error('Failed to update the pin', error);
        }
      }}
    >
      Pin
    </button>
  );
};
```

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

### New: the message bubble's content is a configurable set; the quoted message renders above a poll

`MessageUI` renders the bubble's content through `MessageBubbleContent`, which renders a `messageBubbleContentSet` the way `MessageComposerPreviews` renders the composer's previews. Each item names itself with a `type`, renders a `Component` without props (read the message with `useMessageContext()`), and shows while `isVisible({ isAIGenerated, message })` holds.

`defaultMessageBubbleContentSet` renders `quotedMessage`, `poll`, `attachments` and `text`. v14 rendered the poll above the quoted message; a message that both quotes and carries a poll now shows the quote first. Anything else renders as before.

A message can carry a poll next to its text and attachments, and the root element now has `str-chat__message--has-poll` while it does. Such a message no longer gets `str-chat__message--has-single-attachment`, whose layout is meant for an attachment alone in the bubble.

Reorder, filter or extend the default set, then install it with the `MessageBubbleContent` slot:

```tsx
import {
  defaultMessageBubbleContentSet,
  MessageBubbleContent,
  WithComponents,
} from 'stream-chat-react';

// Text above the poll and attachments, quote still first.
const order = ['quotedMessage', 'text', 'poll', 'attachments'];
const contentSet = order.flatMap((type) =>
  defaultMessageBubbleContentSet.filter((item) => item.type === type),
);

const CustomBubbleContent = () => (
  <MessageBubbleContent messageBubbleContentSet={contentSet} />
);

export const App = ({ children }: { children: React.ReactNode }) => (
  <WithComponents overrides={{ MessageBubbleContent: CustomBubbleContent }}>
    {children}
  </WithComponents>
);
```

The props passed to `MessageUI` still override `MessageContext` for the bubble's content.

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

### Command middlewares are installed by `stream-chat`

A `stream-chat` v10 change ([command middlewares installed by default](https://github.com/GetStream/stream-chat-js/blob/release-v10/ai-docs/v10-breaking-changes.md#composer-command-middlewares-default)). Every composer now installs the four command middlewares that v14 apps installed themselves, as the v14 examples did: `createActiveCommandGuardMiddleware` and `createCommandStringExtractionMiddleware` in the text chain, `createCommandInjectionMiddleware` and `createDraftCommandInjectionMiddleware` in the composition chains.

- v14: without them, typing `/giphy cats` showed the `CommandChip` and kept `/giphy cats` in the text. A command picked from the Commands menu was sent without the command: the GIPHY chip with `cats` sent plain `cats`.
- v15: typing `/giphy cats` moves `giphy` into the chip and leaves `cats` in the text. Typed or picked, the message is sent as `/giphy cats`, and the draft keeps `/giphy cats`. While a command is active, typing `/` suggests no other command.
- A command that takes no arguments (empty `args`, for example a custom `/shrug`) is sent with the chip alone: the send button is enabled and `messageComposer.hasSendableData` is `true`. A command that takes arguments, such as `giphy`, still needs text.

To migrate:

- Delete your own installs of these middlewares, usually `insert()` calls in the composer setup function with the ids `stream-io/text-composer/active-command-guard`, `stream-io/text-composer/command-string-extraction`, `stream-io/message-composer-middleware/command-string-injection` and `stream-io/message-composer-middleware/draft-command-string-injection`.
- A custom composer that shows the command in the text instead of rendering `CommandChip` removes all four, so the text keeps `/giphy cats` and is sent as typed. Removing only the guard and the extraction is not enough: the command stays active after the user deletes `/giphy` from the text, and the injection puts it back (`cats` is sent as `/giphy cats`). Without the injection, a command activated with `textComposer.setCommand()` is not added to the text, so such a UI writes `/giphy ` into the text itself.

```ts
client.config.setSetupFunction('messageComposer', ({ composer }) => {
  composer.textComposer.middlewareExecutor.remove([
    'stream-io/text-composer/active-command-guard',
    'stream-io/text-composer/command-string-extraction',
  ]);
  composer.compositionMiddlewareExecutor.remove(
    'stream-io/message-composer-middleware/command-string-injection',
  );
  composer.draftCompositionMiddlewareExecutor.remove(
    'stream-io/message-composer-middleware/draft-command-string-injection',
  );
});
```

### Attachment and poll availability

`AttachmentSelector` used to decide which actions to offer from the channel type's raw server flags. It now reads the composer's resolved configuration (server flags ANDed with `client.config`). Existing React APIs keep their shape, but the actions offered differ:

- **File:** v14 required `upload-file` capability, `channelConfig.uploads` and `isUploadEnabled`. v15 offers File while `attachments.enabled && (customCdn || hasUploadPermission)`: `attachmentManager.isUploadEnabled` without its free-slot condition. Once the message holds `maxNumberOfFilesPerMessage` files, File stays in the menu, disabled; v14 hid it.
  - With `customCdn: true`, the File action now appears for users without `upload-file`; v14 always hid it from them.
  - With a custom `doUploadRequest` and `customCdn` unset, uploads the v14 client let through without `upload-file` are now blocked, for example paste, which skipped the capability check when `doUploadRequest` was set. The File action itself was already hidden in v14.
- **`SimpleAttachmentSelector`** (the default while editing a message) applies the same File rule, and so does the identical button `AttachmentSelector` renders when File is its only action (`FileUploadButton`). v14 checked only `upload-file`. It now appears without `upload-file` when `customCdn: true`, and it is hidden when attachments are disabled. Once the message holds `maxNumberOfFilesPerMessage` files it is disabled; v14 left it enabled.
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

Only the four built-in action types (`uploadFile`, `createPoll`, `addLocation`, `selectCommand`) are filtered, whatever `ActionButton` they carry. An action with a `type` of its own is always offered, so that is how to show an action the rules above would hide, for example `{ ActionButton: DefaultAttachmentSelectorComponents.File, type: 'myUpload' }`. Showing an action does not grant what it needs: `AttachmentManager.uploadFiles()` still drops files while `isUploadEnabled` is `false` (attachments disabled, the file limit reached, or neither `customCdn` nor `upload-file`), and Stream's server still refuses a poll without `send-poll`. Some behaviour is tied to the built-in types, so a custom type gives it up:

- When an action is the only one offered, the selector renders the action's `StandaloneButton` in place of the menu. It sits in the selector's root element, which is hidden while a command is active, and its `buttonProps.disabled` is set during the send cooldown. `uploadFile` gets `FileUploadButton` by default; a custom type sets it itself, for example `{ ActionButton: DefaultAttachmentSelectorComponents.File, StandaloneButton: FileUploadButton, type: 'myUpload' }`. Without one, a lone action is the only item of the menu.
- `createPoll` and `addLocation` get `PollCreationDialog` and `ShareLocationDialog` as `ModalContent` by default. A custom type passes its own `ModalContent` and needs its own `ActionButton` that calls `openModalForAction('<its type>')`: the default Poll and Location buttons open the built-in types' modals. `DefaultAttachmentSelectorComponents.File` can be reused as it is, because it clicks the selector's shared file input, and so can `.Command`, given the action's `Submenu` and `Header`.
- `createPoll` resets `messageComposer.pollComposer` each time its dialog opens, and its modal gets the `str-chat__create-poll-modal` class (`str-chat__share-location-modal` for `addLocation`). A custom type does neither.

`useAttachmentManagerState().isUploadEnabled` still does not re-render on an `own_capabilities` change; subscribe with `useChannelCapabilities` where that matters. The attachment selectors already do.

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

### New: composer previews are a configurable set

Mostly not a break (see the slot overrides below). The previews above the composer's textarea (`.str-chat__message-composer-previews`) come from `MessageComposerPreviews`, which renders a `messageComposerPreviewSet` the way `MessageActions` renders a `messageActionSet`. Each item names itself with a `type`, renders a `Component` without props, and shows while `isVisible(state)` holds. `state` (`MessageComposerPreviewVisibilityFilterParams`) carries the composer's `attachments`, `customData`, `editedMessage`, `linkPreviews` (loading or loaded), `location`, `pollId` and `quotedMessage`. The preview area renders when any item is visible.

`defaultMessageComposerPreviewSet` keeps v14's previews in v14's order (`editedMessage`, `quotedMessage`, `voiceRecording`, `attachments`, `linkPreviews`, `location`). It has no poll preview: by default the poll creation dialog sends the poll on its own, so the composer never holds one for long. An app that attaches polls to the message adds its own item (see below).

Filter, reorder or extend the default set, then install it with the `MessageComposerPreviews` slot:

```tsx
import {
  defaultMessageComposerPreviewSet,
  MessageComposerPreviews,
  type MessageComposerPreviewSetItem,
  useMessageComposerController,
  WithComponents,
} from 'stream-chat-react';

const ReplyingInChannelHint = () => {
  const messageComposer = useMessageComposerController();
  return <div>Replying in {messageComposer.channel.data?.name}</div>;
};

const previewSet: MessageComposerPreviewSetItem[] = [
  ...defaultMessageComposerPreviewSet.filter(({ type }) => type !== 'linkPreviews'),
  {
    Component: ReplyingInChannelHint,
    isVisible: ({ quotedMessage }) => !!quotedMessage,
    type: 'replyingInChannelHint',
  },
];

const CustomComposerPreviews = () => (
  <MessageComposerPreviews messageComposerPreviewSet={previewSet} />
);

export const App = ({ children }: { children: React.ReactNode }) => (
  <WithComponents overrides={{ MessageComposerPreviews: CustomComposerPreviews }}>
    {children}
  </WithComponents>
);
```

- `useMessageComposerPreviewSetFilter(set)` returns the visible items, and `useMessageComposerPreviewState()` the state they are checked against, for a custom container.
- `isVisible` sees only the state above, so a preview that depends on something else must read it inside its `Component` and return `null`. To drive visibility from app state, put it in `messageComposer.customDataManager.setCustomData(...)` and read `customData`.
- `EditedMessagePreview` and `GeolocationPreview` are now exported from the root.
- **Custom `AttachmentPreviewList`, `VoiceRecordingPreviewSlot` and `LinkPreviewList` slots mount only while their default item is visible.** v14 mounted them whenever the preview area showed. The `attachments` item shows while the composer holds an attachment other than a voice recording, `voiceRecording` while it holds a voice recording, and `linkPreviews` while a link preview is loading or loaded. A custom component that also rendered something else, e.g. the `location` or `poll` from `useAttachmentsForPreview()` or an empty or upload state, stops mounting when its item is hidden. Replace that item with one whose `isVisible` covers what the component renders, and drop the default item that would render the same thing again:

  ```tsx
  // The custom AttachmentPreviewList also renders the location.
  const previewSet = defaultMessageComposerPreviewSet
    .filter(({ type }) => type !== 'location')
    .map(
      (item): MessageComposerPreviewSetItem =>
        item.type === 'attachments'
          ? {
              ...item,
              isVisible: ({ attachments, location }) =>
                attachments.length > 0 || !!location,
            }
          : item,
    );
  ```

The default poll creation dialog sends the poll as soon as it is created. To have the dialog attach the poll to the message being composed instead:

1. Remove `stream-chat`'s poll-only step from the composition chain. With it, `stream-chat` sends a composer's poll as a message of its own and keeps the text and attachments in the composer. Without it, the poll is sent with them and the composer clears:

   ```ts
   import { POLL_ONLY_COMPOSITION_MIDDLEWARE_ID } from 'stream-chat';

   client.config.setSetupFunction('messageComposer', ({ composer }) => {
     composer.compositionMiddlewareExecutor.remove(POLL_ONLY_COMPOSITION_MIDDLEWARE_ID);
   });
   ```

2. Replace the dialog's footer through the new `PollCreationDialogControls` slot (`PollCreationDialogControls` and `PollCreationDialogControlsProps` are exported) and call `createPoll()` without `send()`:

```tsx
import { useState } from 'react';
import {
  type PollCreationDialogControlsProps,
  Prompt,
  useMessageComposerController,
  WithComponents,
} from 'stream-chat-react';

const AttachPollControls = ({ close }: PollCreationDialogControlsProps) => {
  const messageComposer = useMessageComposerController();
  // Blocks a second request, and a Cancel that the pending poll would ignore.
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Prompt.Footer>
      <Prompt.FooterControls>
        <Prompt.FooterControlsButtonSecondary
          disabled={isCreating}
          onClick={close}
          type='button'
        >
          Cancel
        </Prompt.FooterControlsButtonSecondary>
        <Prompt.FooterControlsButtonPrimary
          disabled={isCreating}
          onClick={async () => {
            setIsCreating(true);
            try {
              // The poll waits in `messageComposer.state.pollId` and goes out with the message.
              await messageComposer.createPoll();
            } catch {
              // `createPoll()` already reported the failure as a notification.
            } finally {
              setIsCreating(false);
              // Closed once the poll is attached, so a message sent meanwhile cannot miss it.
              close();
            }
          }}
          type='submit'
        >
          Attach poll
        </Prompt.FooterControlsButtonPrimary>
      </Prompt.FooterControls>
    </Prompt.Footer>
  );
};

export const App = ({ children }: { children: React.ReactNode }) => (
  <WithComponents overrides={{ PollCreationDialogControls: AttachPollControls }}>
    {children}
  </WithComponents>
);
```

3. Show the attached poll above the textarea with your own preview item. `pollId` in the visibility params holds the poll created with `createPoll()` and not sent yet. Its remove button should only detach the poll (`pollId: null`), not delete it: the composer cannot tell whether it created the poll or whether it was sent, e.g. a `poll_id` restored from a draft. The Vite example's `examples/vite/src/ComposerPreviews/PollPreview.tsx` is a complete one (question, options, settings, a poll fetched when it is not cached):

```tsx
import type { MessageComposerState } from 'stream-chat';
import {
  defaultMessageComposerPreviewSet,
  MessageComposerPreviews,
  type MessageComposerPreviewSetItem,
  RemoveAttachmentPreviewButton,
  useChatContext,
  useMessageComposerController,
  useStateStore,
} from 'stream-chat-react';

const pollIdSelector = ({ pollId }: MessageComposerState) => ({ pollId });

const PollPreview = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { pollId } = useStateStore(messageComposer.state, pollIdSelector);
  const poll = pollId ? client.polls.fromState(pollId) : undefined;

  return (
    <div className='app-poll-preview'>
      {poll?.data.name ?? 'Poll'}
      <RemoveAttachmentPreviewButton
        aria-label='Remove poll'
        onClick={() => messageComposer.state.partialNext({ pollId: null })}
      />
    </div>
  );
};

const previewSet: MessageComposerPreviewSetItem[] = [
  ...defaultMessageComposerPreviewSet,
  {
    Component: PollPreview,
    // An edited message keeps its poll; it cannot be replaced or removed.
    isVisible: ({ editedMessage, pollId }) => !editedMessage && !!pollId,
    type: 'poll',
  },
];

export const ComposerPreviews = () => (
  <MessageComposerPreviews messageComposerPreviewSet={previewSet} />
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

React props typed with `stream-chat` types change with them. The React APIs are unchanged, apart from the removed `DefaultCommandData` (see the command names bullet under **Composer**); build and read the values with the v10 shapes.

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
- **Command names are `string`.** `stream-chat` v10 removes `CustomCommandData`, and `stream-chat-react` removes `DefaultCommandData` with it. In v14, `command.name` / `command.set` were `CommandVariants` (the built-in names plus the keys of `CustomCommandData`); in v15 they are plain `string`. Delete the `interface CustomCommandData extends DefaultCommandData {}` line from your `declare module 'stream-chat'` block and the `DefaultCommandData` import (`TS2305`). A leftover `CustomCommandData` augmentation without that import still compiles and does nothing, so search for the name. To keep a checked set of command names, declare the union in your app:

  ```ts
  import type { Command } from 'stream-chat';

  type AppCommandName = 'giphy' | 'poll';

  export const isAppCommand = (
    command: Command,
  ): command is Command & { name: AppCommandName } =>
    command.name === 'giphy' || command.name === 'poll';
  ```

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
   For each `t('...')` call and each dictionary key, look the string up in the key map's `keys`. Found: use its `key`. Not found: either the string was never an SDK key (for example `t('Message Failed · Click to try again')` in a custom message UI), or v15 dropped it from the catalog (`live`, `Create`, `Submit`, `Remove`, `Menu`, the typing-indicator strings, ...; full list in [`i18n-v15-migration.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/i18n-v15-migration.md#keys-removed-without-a-replacement)). Either way it is app-owned now. Give it a key of your own through `asDynamicKey`, with the English copy inline, and keep its translations in your dictionaries: `t(asDynamicKey('myApp.message.failed.text'), 'Message Failed · Click to try again')`. A strict-`t` error (`TS2769`) on a v14 string that is not in the map means exactly this.
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

| v14 markup or class                                                                                                                   | v15                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `div.str-chat__main-panel` (+ `--thread-open`), rendered by `Window`                                                                  | Gone. `Channel` renders `div.str-chat__channel` as the content column (flex column with header, list, composer). Target `.str-chat__thread-container` / `.str-chat__thread` for the thread panel. The v14 getting-started CSS on `#root .str-chat__main-panel` matches nothing.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `div.str-chat__container` inside `Channel` (or `customClasses.chatContainer`)                                                         | Gone, and `customClasses.chatContainer` is removed from the type. Use `customClasses.channel` for the `.str-chat__channel` column.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `.str-chat__channel-list-inner`, `.str-chat__channel-list-inner__main` (from `ChannelListUI`, which held `role="listbox"`)            | Gone. Target `.str-chat__channel-list .str-chat__infinite-scroll-paginator` (the `role="listbox"` scroll container, inside `ChannelNavigation`) and `.str-chat__infinite-scroll-paginator__content`. A bare `<ChannelList>` has no `.str-chat__channel-list` ancestor.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| The channel list root carried `str-chat <theme> str-chat__channel-list` and `customClasses.channelList`                               | Inside `ChatView` the `str-chat <theme>` scope comes from the `ChatView` root, and the channel list adds none of its own: a nested `.str-chat` would reset the tokens you override on the `ChatView` root. Outside `ChatView`, `ChannelNavigation`'s root renders `str-chat <theme> str-chat__channel-list`, and a bare `<ChannelList>` wraps itself in `div.str-chat.<theme>.str-chat__theme-scope` (`display: contents`). `customClasses.chat` replaces `str-chat` where the scope is applied; `customClasses.channelList` replaces `str-chat__channel-list` on `ChannelNavigation`'s root. App CSS that targeted the list root as a `.str-chat` element no longer matches it inside `ChatView`. |
| `.str-chat__chat-view__channels` / `.str-chat__chat-view__threads`                                                                    | Rendered only when `ChatView` is given `views`. With the built-in workspace layout, content sits in `.str-chat__chat-view__workspace-layout`, `.str-chat__chat-view__workspace-layout-slots`, `.str-chat__chat-view__slot` (`--hidden`) and `.str-chat__chat-view__slot-layer`.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `str-chat__virtual-message__wrapper--end`, `--first`, `--group` on `.str-chat__message`                                               | Not applied; the SDK stylesheet never styled them. Target the list item's group class instead: `.str-chat__li--top`, `--middle`, `--bottom` or `--single`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `.str-chat__thread--virtualized` on the thread container                                                                              | Not applied. Scope by the list you render (`.str-chat__thread .str-chat__virtual-list`, or your own class).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.str-chat__quoted-message-preview` text inherited the surrounding colour                                                             | It sets `color: var(--str-chat__chat-text-incoming)`, and `--own` `var(--str-chat__chat-text-outgoing)`, matching the bubble backgrounds. In the default light theme your own quotes change to the outgoing bubble's text colour. Remove contrast workarounds written for v14; theme with those two tokens.                                                                                                                                                                                                                                                                                                                                                                                        |
| `.str-chat__channel-list-item[aria-pressed=true]` and `.str-chat__thread-list-item[aria-pressed=true]` highlighted the active row     | Only `[aria-selected=true]` is styled. A custom row UI sets `role="option"` and `aria-selected`, not `aria-pressed`: `aria-selected={active}` on a channel row, `aria-selected={isThreadActive(thread.id)}` (from `useWorkspaceNavigation()`) on a thread row                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `.str-chat__message--has-single-attachment` on a message that carries a poll                                                          | Not applied while the message carries a poll; such a message gets `.str-chat__message--has-poll`. The quoted message now renders above the poll ([section 12](#new-the-message-bubbles-content-is-a-configurable-set-the-quoted-message-renders-above-a-poll))                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| The first message of the channel's list had `padding-top: 4.5rem` (`.str-chat__main-panel .str-chat__ul .str-chat__li:first-of-type`) | No top padding. Remove app rules that compensated for it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Find every app rule that uses a removed class. They also hide inside combinators and pseudo-classes, where a rule does more than style the element: `.create-channel-panel + .str-chat__main-panel { display: none }` hid the channel while another panel was open, and without it both render side by side. Nothing reports such a rule; it simply stops matching.

```bash
grep -rnE "str-chat__(main-panel(--[a-z-]+)?|container|channel-list-inner(__main)?|thread--virtualized|virtual-message__wrapper--(end|first|group))([^a-z0-9_-]|$)" \
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

**Give the lists a width.** `ChannelNavigation` / `ChannelList` and `ThreadList` size themselves from `--str-chat__channel-list-width` and `--str-chat__thread-list-width`. Both default to `100%` with `flex-shrink: 0`. In a view that puts a list beside a `<Slot>` (the [channels and threads views](#channels-and-threads-views) above), the list takes the whole row, the slot collapses to nothing and the page scrolls sideways. Set both on the `ChatView` root (`div.str-chat.str-chat__chat-view`):

```css
.str-chat.str-chat__chat-view {
  --str-chat__channel-list-width: 320px;
  --str-chat__thread-list-width: 320px;
}
```

On narrow screens (`max-width: 767px`) the lists switch to an overlay sized by `--str-chat__channel-list-mobile-width` / `--str-chat__thread-list-mobile-width`.

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

## Verification

Run after every section is applied.

1. **The app's checks.** Read `package.json` `scripts` and run the typecheck (`tsc --noEmit`, `yarn types`, ...), lint, unit tests and production build. Compare each with the Phase 0 baseline; a new failure is a migration bug.
2. **Leftover identifiers.** Every v14 name below was removed or renamed. In a plain-JS app this grep is the only thing that finds them. It must print nothing outside comments, changelogs and app identifiers that only share the name (record those in the report). Uses the `code` / `styles` helpers from [Detection](#detection).

   ```bash
   code '\b(WindowProps|ChannelStateContext|ChannelStateContextValue|ChannelStateProvider|useChannelStateContext|ChannelActionContext|ChannelActionContextValue|ChannelActionProvider|useChannelActionContext|ChannelNotifications|MarkReadWrapperOptions|RetrySendMessage|TypingContext|TypingContextValue|TypingProvider|useTypingContext|ChannelUnreadUiState|channelUnreadUiState|setChannelUnreadUiState|updateChannelUiUnreadState|useThreadsViewContext|ThreadsViewContextValue|ThreadAdapter|activeChatView|setActiveChatView|setActiveChannel|setActiveChannelOnMount|customActiveChannel|channelsQueryState|latestMessageDatesByChannels|useChannelEditMessageHandler|useChannelMentionsHandler|ChannelListUI|ChannelListUIProps|usePaginatedChannels|useConnectionRecoveredListener|CustomQueryChannelParams|CustomQueryChannelsFn|EffectiveQueryParams|moveChannelUpwards|findLastPinnedChannelIndex|extractSortValue|isChannelPinned|isChannelArchived|shouldConsiderPinnedChannels|shouldConsiderArchivedChannels|allowNewMessagesFromUnfilteredChannels|lockChannelOrder|showChannelSearch|sendChannelsToList|renderChannels|channelRenderFilterFn|customQueryChannels|recoveryThrottleIntervalMs|onMessageNewHandler|channelUpdateCount|useLegacyThreadContext|additionalMessageComposerProps|additionalMessageListProps|additionalVirtualizedMessageListProps|additionalParentMessageProps|enableDateSeparator|disableDateSeparator|HeaderStartContent|MESSAGE_ACTIONS|OPTIONAL_MESSAGE_ACTIONS|getMessageActions|MessageActionsArray|actionsEnabled|messageIsUnread|initializeOnMount|channelQueryOptions|markReadOnMount|activeUnreadHandler|skipMessageDataMemoization|allowConcurrentAudioPlayback|allowConcurrentPlayback|doSendMessageRequest|doUpdateMessageRequest|doDeleteMessageRequest|doMarkReadRequest|overrideSubmitHandler|preventClearingOnUnmount|loadMoreNewer|loadMoreThread|loadingMoreNewer|jumpToLatestMessage|jumpToFirstUnreadMessage|highlightedMessageId|threadSuppressAutoscroll|loadingMoreForJumpToChannelMessage|messageLimit|hasPendingUploadState|recoverStateOnReconnect|wsUrlParams|isLocalUnreadCountEnabled|StreamChatOptions|isLanguageSupported|SupportedTranslations|DateFormatterOptions|getTranslators|registerSetLanguageCallback|getAvailableLanguages|geti18Instance|deTranslations|enTranslations|esTranslations|frTranslations|hiTranslations|itTranslations|jaTranslations|koTranslations|nlTranslations|ptTranslations|ruTranslations|trTranslations|ChannelSort|UserSort|ReactionSort|WatcherState|unBlockUser|ReminderResponse|CommandResponse|DefaultCommandData|CustomCommandData|chatContainer|useUserRole|disableQuotedMessages|initialMessage|MentionedUserEventHandler|mentionedUser|noGroupByUser|shouldGroupByUser|defaultItemHeight|scrollSeekPlaceHolder|endOfGroup|firstOfGroup|groupedByUser)\b|<Window\b|ChatView\.(Channels|Threads)\b|\.(read|typing|members|watcher|ownCapabilities|mutedUsers)Store\b|getConfig\(|\bMessage=\{|\b(Message|ThreadHeader):\s|use[A-Za-z]+Context\([\x27"]|messageActions=|connection\.changed'
   styles 'str-chat__(main-panel|container|channel-list-inner|thread--virtualized)([^a-z0-9_-]|$)|str-chat__virtual-message__wrapper--|aria-pressed'
   ```

   Read each hit before changing it. App code often keeps names that only match: a `useState` setter called `setActiveChannel`, an app dictionary called `deTranslations`, an object key `Message:` outside `WithComponents`. Those stay; list them in the report. The v14 `handleDelete` options `deleteForMe` / `hardDelete` are not in this grep because app variables use the same names; the [section 17](#17-other-stream-chat-v10-data-shapes) detection finds them.

3. **One copy of the shared packages.** `npm ls stream-chat @stream-io/state-store dayjs` (or `yarn why <pkg>` / `pnpm why <pkg>`) shows a single version of each, and `stream-chat` satisfies `peerDependencies['stream-chat']` of the installed `stream-chat-react`.
4. **Runtime smoke test.** Start the app and check, with two users where a step needs another sender:
   - The app loads with the channel it opened in v14 (or none, if the human decided so), and the browser console shows no "outside of `<Provider>`" errors and no workspace-navigation warnings.
   - Clicking a channel-list row opens that channel and marks the row active; a channel, message or user search result opens a watched channel with its messages.
   - A message from the other user arrives live; the open channel is marked read; unread badges update.
   - Sending works; a failed send stays in the list marked failed and can be retried.
   - Replying opens the thread beside the channel; its close button works; the composer focuses where it did in v14.
   - Inside `ChatView`: switching to threads and back keeps the open channel and does not reload the list.
   - Scrolling up loads older messages and keeps the reading position; the scroll-to-latest button returns to the newest messages.
   - Toggling the network shows the lost-connection notification; messages sent meanwhile appear once after reconnecting.
   - Channel names and images, dates and date separators render (no empty names, no `Invalid Date`); a non-English UI is still translated.
   - Logging out and in as another user throws no "pending disposal" error and shows the new user's channels.
   - The layout matches v14: thread beside the channel, lists sized, custom CSS applied.
   - Each feature the app customizes still works: message actions (pin, delete, mute, flag), attachments and the attachment menu, voice messages, polls, the document title.

---

## Index of breaking changes

`BC-###` IDs refer to [`ai-docs/v15-breaking-changes.md`](https://github.com/GetStream/stream-chat-react/blob/master/ai-docs/v15-breaking-changes.md).

| ID     | Change                                                                                   | Section                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| BC-001 | `stream-chat` ^10, dependencies, single `@stream-io/state-store`, new subpaths           | [1](#packages)                                                                                                                 |
| BC-002 | Timestamps are `TimestampNS`                                                             | [16](#16-dates-on-response-types-are-unix-nanosecond-numbers)                                                                  |
| BC-003 | `ChannelStateContext` / `ChannelActionContext` removed                                   | [9](#channelstatecontext-and-channelactioncontext-are-removed)                                                                 |
| BC-004 | `TypingContext` removed                                                                  | [9](#typingcontext-is-removed)                                                                                                 |
| BC-005 | `ComponentContext` slots removed                                                         | [10](#removed-componentcontext-slots)                                                                                          |
| BC-006 | Context hooks take no `componentName`                                                    | [10](#context-hooks-take-no-componentname-argument)                                                                            |
| BC-007 | Required context hooks throw                                                             | [10](#required-context-hooks-throw-outside-their-provider)                                                                     |
| BC-008 | `useMessageComposerContext` takes no argument and throws                                 | [10](#required-context-hooks-throw-outside-their-provider)                                                                     |
| BC-009 | `ChannelUnreadUiState` removed                                                           | [9](#the-unread-snapshot-channelunreaduistate-is-removed)                                                                      |
| BC-010 | `Window` removed                                                                         | [3](#window-and-windowprops-are-removed)                                                                                       |
| BC-011 | `ChatView` moved to `slot-layout`                                                        | [1](#imports-that-moved), [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots)                    |
| BC-012 | `ChatView` rebuilt around slots                                                          | [3](#chatview-moved-to-stream-chat-reactslot-layout-and-was-rebuilt-around-slots)                                              |
| BC-013 | `setActiveChannel` / `channel` removed; workspace navigation                             | [2](#chatcontext-fields), [4](#4-selecting-channels-and-opening-threads-workspace-navigation)                                  |
| BC-014 | `ChatContext.channelsQueryState` removed                                                 | [2](#chatcontext-fields)                                                                                                       |
| BC-015 | `ChatContext.latestMessageDatesByChannels` removed                                       | [2](#chatcontext-fields)                                                                                                       |
| BC-016 | `useChatContext` argument, throws, `channelManager`                                      | [2](#chatcontext-fields), [10](#context-hooks-take-no-componentname-argument)                                                  |
| BC-017 | `useChat` params and results; `Chat.defaultLanguage`                                     | [2](#usechat-and-chatdefaultlanguage)                                                                                          |
| BC-018 | `useCreateChatClient` `options` → `config`                                               | [2](#usecreatechatclient-options--config)                                                                                      |
| BC-019 | `Channel.channel` required, `EmptyPlaceholder` removed                                   | [5](#channel-requires-channel-and-renders-no-placeholder-loading-or-error-state)                                               |
| BC-020 | `Channel` no longer watches; `getChannel` removed                                        | [5](#channel-no-longer-watches-the-channel)                                                                                    |
| BC-021 | `document.title`, `activeUnreadHandler`                                                  | [5](#channel-no-longer-writes-documenttitle)                                                                                   |
| BC-022 | `markReadOnMount` removed                                                                | [5](#markreadonmount-is-removed-the-list-marks-read)                                                                           |
| BC-023 | `do*Request` props, `useChannelEditMessageHandler`                                       | [14](#14-request-handlers)                                                                                                     |
| BC-024 | Attachment props moved to `Attachment`                                                   | [5](#props-that-moved-off-channel)                                                                                             |
| BC-025 | Mention handlers moved to the lists                                                      | [5](#props-that-moved-off-channel)                                                                                             |
| BC-026 | `skipMessageDataMemoization` removed                                                     | [5](#props-that-moved-off-channel)                                                                                             |
| BC-027 | `Channel` lifecycle behavior                                                             | [5](#channel-lifecycle-activation-no-remount-no-reload-no-search-jump)                                                         |
| BC-028 | `ChannelList` takes a `ChannelPaginator`                                                 | [6](#channellist-is-driven-by-a-channelpaginator)                                                                              |
| BC-029 | `ChannelListUI` removed                                                                  | [6](#channellistui-is-removed-use-the-list-slots)                                                                              |
| BC-030 | `usePaginatedChannels`, `useConnectionRecoveredListener`, query types removed            | [6](#channel-list-hooks-types-and-utilities-are-removed)                                                                       |
| BC-031 | Channel-list utilities removed                                                           | [6](#channel-list-hooks-types-and-utilities-are-removed)                                                                       |
| BC-032 | `ChannelListContext` fields removed                                                      | [6](#channellistcontext-lost-channels-hasnextpage-loadnextpage-and-setchannels)                                                |
| BC-033 | `ChannelListItem` props                                                                  | [6](#channellistitem-props)                                                                                                    |
| BC-034 | `HeaderStartContent` → `StartContent` / `EndContent`                                     | [8](#8-channel-and-thread-headers)                                                                                             |
| BC-035 | `Thread` takes `thread`, renders children                                                | [7](#thread-takes-a-thread-prop-and-renders-its-children)                                                                      |
| BC-036 | `ThreadHeader` props, `ComponentContext.ThreadHeader`                                    | [7](#threadheader-lost-closethread-and-thread)                                                                                 |
| BC-037 | `ThreadProvider` no longer mounts a `Channel`                                            | [7](#threadprovider-no-longer-wraps-its-children-in-a-channel)                                                                 |
| BC-038 | `ThreadList` reload and selection                                                        | [7](#threadlist), [4](#4-selecting-channels-and-opening-threads-workspace-navigation)                                          |
| BC-039 | Search results not watched; selection through navigation                                 | [4](#search-results)                                                                                                           |
| BC-040 | Lost-connection notification                                                             | [2](#the-lost-connection-notification)                                                                                         |
| BC-041 | `messageActions` and related exports removed                                             | [10](#messageactions-and-message_actions-are-removed)                                                                          |
| BC-042 | Message UI overrides on `MessageUI`                                                      | [10](#message-ui-overrides-consolidate-on-the-messageui-slot)                                                                  |
| BC-043 | `MessageContext.mutes` / `messageIsUnread` removed                                       | [12](#messagecontextmutes-and-messageisunread-are-removed)                                                                     |
| BC-044 | `retrySendMessage`, `useRetryHandler`                                                    | [12](#retrysendmessage-and-useretryhandler)                                                                                    |
| BC-045 | Opening a thread from a message                                                          | [4](#messageopenthread-and-the-lists-openthread)                                                                               |
| BC-046 | List pagination and state props                                                          | [11](#pagination-and-state-props-are-removed)                                                                                  |
| BC-047 | `messages` prop removed                                                                  | [11](#the-messages-prop-is-removed)                                                                                            |
| BC-048 | `threadList` / `head` removed                                                            | [11](#threadlist-and-head-are-removed-lists-detect-the-thread)                                                                 |
| BC-049 | `withDateSeparator`                                                                      | [11](#disabledateseparator--withdateseparator)                                                                                 |
| BC-050 | `AIStates` from `stream-chat`                                                            | [12](#aistates-moved-to-stream-chat)                                                                                           |
| BC-051 | One voice message at a time                                                              | [12](#allowconcurrentplayback-is-removed-one-voice-message-plays-at-a-time)                                                    |
| BC-052 | `usePinHandler` no `canPin`                                                              | [12](#usepinhandler-no-longer-returns-canpin)                                                                                  |
| BC-053 | `VirtuosoContext` reshaped                                                               | [11](#virtuosocontext-the-context-of-additionalvirtuosopropscomponents)                                                        |
| BC-054 | `RenderMessagesOptions`                                                                  | [11](#custom-rendermessages-gets-different-options)                                                                            |
| BC-055 | Low-level list hooks and utils                                                           | [11](#low-level-list-hooks-and-utils)                                                                                          |
| BC-056 | `headerPosition` / `insertIntro` in nanoseconds                                          | [11](#headerposition-and-insertintro-take-unix-nanoseconds)                                                                    |
| BC-057 | `DateSeparatorMessage`                                                                   | [11](#dateseparatormessage)                                                                                                    |
| BC-058 | Standalone `Message` needs a channel                                                     | [12](#a-standalone-message-needs-a-channel-in-context)                                                                         |
| BC-059 | Gallery header timestamp                                                                 | [12](#the-gallery-header-renders-the-messagetimestamp-override-for-items-that-carry-their-message)                             |
| BC-060 | `overrideSubmitHandler` removed                                                          | [13](#overridesubmithandler-is-removed)                                                                                        |
| BC-061 | `preventClearingOnUnmount` removed                                                       | [13](#preventclearingonunmount-is-removed)                                                                                     |
| BC-062 | `handleSubmit` removed                                                                   | [13](#handlesubmit-is-removed)                                                                                                 |
| BC-063 | Failed sends do not restore the composer                                                 | [13](#a-failed-send-or-edit-no-longer-restores-the-composer)                                                                   |
| BC-064 | `hasCustomDoUploadRequest` → `customCdn`                                                 | [13](#useattachmentmanagerstate-hascustomdouploadrequest--customcdn)                                                           |
| BC-065 | Attachment selectors follow resolved config                                              | [13](#attachment-and-poll-availability)                                                                                        |
| BC-066 | Upload helpers moved to `stream-chat`                                                    | [1](#imports-that-moved), [13](#upload-helpers-moved-to-stream-chat)                                                           |
| BC-067 | English-only bundle, namespaced keys                                                     | [18](#18-i18n)                                                                                                                 |
| BC-068 | Strict `t`                                                                               | [18](#18-i18n)                                                                                                                 |
| BC-069 | `Streami18n` API                                                                         | [18](#18-i18n)                                                                                                                 |
| BC-070 | Channel and navigation types follow v10                                                  | [17](#17-other-stream-chat-v10-data-shapes)                                                                                    |
| BC-071 | Message-area types follow v10                                                            | [17](#17-other-stream-chat-v10-data-shapes)                                                                                    |
| BC-072 | Composer types follow v10                                                                | [17](#17-other-stream-chat-v10-data-shapes)                                                                                    |
| BC-073 | `Window` / `str-chat__main-panel` / `str-chat__container` CSS                            | [19](#19-css-and-markup)                                                                                                       |
| BC-074 | Channel list CSS                                                                         | [19](#19-css-and-markup)                                                                                                       |
| BC-075 | `ChatView` view wrappers                                                                 | [19](#19-css-and-markup)                                                                                                       |
| BC-076 | `str-chat__thread--virtualized`                                                          | [19](#19-css-and-markup)                                                                                                       |
| BC-077 | Quote and edit preview colours                                                           | [19](#19-css-and-markup)                                                                                                       |
| BC-078 | `CustomCommandData` / `DefaultCommandData` removed                                       | [17](#17-other-stream-chat-v10-data-shapes)                                                                                    |
| BC-079 | `useUserRole().canEdit` is the permission alone                                          | [10](#messageactions-and-message_actions-are-removed)                                                                          |
| BC-080 | Action rules moved onto `defaultMessageActionSet` items (`isVisible`)                    | [10](#messageactions-and-message_actions-are-removed)                                                                          |
| BC-081 | Quote above poll; `--has-poll` / `--has-single-attachment`                               | [12](#new-the-message-bubbles-content-is-a-configurable-set-the-quoted-message-renders-above-a-poll), [19](#19-css-and-markup) |
| BC-082 | Custom preview slots mount only while their item is visible                              | [13](#new-composer-previews-are-a-configurable-set)                                                                            |
| BC-083 | Message action handlers reject                                                           | [12](#message-action-handlers-reject-when-they-fail)                                                                           |
| BC-084 | First message loses its top padding                                                      | [19](#19-css-and-markup)                                                                                                       |
| BC-085 | `MessageContext` grouping flags and `virtual-message__wrapper--*` classes                | [12](#messagecontext-grouping-flags-are-removed-read-groupstyles), [19](#19-css-and-markup)                                    |
| BC-086 | `groupByUser`, `getGroupStyles`                                                          | [11](#message-grouping-groupbyuser-and-getgroupstyles)                                                                         |
| BC-087 | `renderText(text, options)`                                                              | [12](#rendertext-takes-text-options)                                                                                           |
| BC-088 | Mention node lost `mentionedUser`                                                        | [12](#custom-mention-renderers-read-nodementionedentity)                                                                       |
| BC-089 | Mention handlers get `(event, message)`                                                  | [12](#mention-handlers-receive-event-message)                                                                                  |
| BC-090 | `useUserRole` role flags removed                                                         | [12](#useuserrole-no-longer-returns-isadmin-ismoderator-or-isowner)                                                            |
| BC-091 | `VirtualizedMessageList` Virtuoso props removed                                          | [11](#virtualizedmessagelist-defaultitemheight-overscan-and-scrollseekplaceholder-are-removed)                                 |
| BC-092 | `useUserRole` renamed to `useMessagePermissions`                                         | [12](#useuserrole-is-renamed-to-usemessagepermissions)                                                                         |
| BC-093 | Mention handlers in the message context and from `useMentionsHandler` can be `undefined` | [12](#onmentionsclickmessage-and-onmentionshovermessage-are-undefined-without-a-handler)                                       |
| BC-094 | `mentionsMarkdownPlugin` takes mention entities only                                     | [12](#mentionsmarkdownplugin-takes-mention-entities-only)                                                                      |
| BC-095 | `disableQuotedMessages` removed                                                          | [12](#the-disablequotedmessages-prop-is-removed)                                                                               |
| BC-097 | Channel detail close buttons need `onClose` outside a modal; `onLayoutChange` is called  | [10](#channeldetail-takes-onclose-outside-a-modal-it-shows-no-close-button-without-it)                                         |
| BC-102 | `initialMessage` removed; `useIsRenderedAsThreadParent()`                                | [12](#initialmessage-is-removed-use-useisrenderedasthreadparent)                                                               |
