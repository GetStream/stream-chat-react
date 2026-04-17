# stream-chat-react v13 → v14 AI Migration Guide

Execution-only guide for a coding agent migrating a third-party app from `stream-chat-react` v13 to v14. Run the phases in order; stop and fix each phase's errors before moving to the next. For evidence or edge cases, fall back to `./breaking-changes.md`.

## Source of Truth

Before writing any code, and whenever ambiguity hits, verify against the user's installed SDK source. Never rely on training knowledge — the v13 surface is still heavily represented in pretraining data and will mislead you.

Authoritative locations, in order of preference:

1. `node_modules/stream-chat-react/dist/types/index.d.ts` — public type surface. Fastest way to confirm a symbol exists, check a prop signature, or see an override-key name. (The SDK emits `.d.ts` only; there is no `.d.cts`.)
2. `node_modules/stream-chat-react/package.json` — `exports` map and peer dependencies.
3. `node_modules/stream-chat-react/dist/es/` and `dist/cjs/` — transpiled JS when runtime behavior matters more than types.
4. `node_modules/stream-chat/dist/types/index.d.ts` — core client types (channel capabilities, event names, `ReactionSort`, etc.).
5. `node_modules/stream-chat-react/dist/css/index.css` — default class names and CSS variables when auditing selectors.

Required workflow:

- Before claiming a symbol, prop, or override key exists: grep the installed `.d.ts` files.
- Before writing a replacement snippet: read the current signature, don't reconstruct it from memory.
- If a file or symbol referenced in this guide is missing from the installed package, stop and report — don't invent a fallback.

## Prerequisites

1. Upgrade both packages to their latest versions together. The v14 peer-dep floor moved; leaving `stream-chat` on a v13-era version will fail peer resolution.
   - `stream-chat-react` → latest v14
   - `stream-chat` → latest
2. Update stylesheet imports. The `/v2` path no longer resolves.
   ```ts
   // before
   import 'stream-chat-react/dist/css/v2/index.css';
   // after
   import 'stream-chat-react/dist/css/index.css';
   ```
3. If the app uses `EmojiPicker`, also import its dedicated stylesheet:
   ```ts
   import 'stream-chat-react/dist/css/emoji-picker.css';
   ```

---

## Phase 1 — Import and Symbol Renames

Apply these everywhere. Compile-breaks; they apply to imports, JSX usage, `ComponentContext` override keys, and type names (append `Props` where applicable). Also: import `MessageActions` and `Search` from `stream-chat-react`, not `stream-chat-react/experimental`.

- `MessageInput` → `MessageComposer`
- `MessageInputFlat` → `MessageComposerUI`
- `MessageInputContext` → `MessageComposerContext`
- `useMessageInputContext` → `useMessageComposerContext`
- `additionalMessageInputProps` → `additionalMessageComposerProps`
- `MessageDeleted` → `MessageDeletedBubble`
- `MessageEditedTimestamp` → `MessageEditedIndicator`
- `MessageNotification` → `NewMessageNotification`
- `ScrollToBottomButton` → `ScrollToLatestMessageButton`
- `MessageIsThreadReplyInChannelButtonIndicator` → `MessageAlsoSentInChannelIndicator`
- `ReactionsListModal` → `MessageReactionsDetail`
- `ReactionsList` → `MessageReactions`
- `ChannelPreview` → `ChannelListItem`
- `ChannelPreviewMessenger` → `ChannelListItemUI`
- `ChannelPreviewActionButtons` → `ChannelListItemActionButtons`
- `ChannelListMessenger` → `ChannelListUI`
- `ChannelSearch` → `Search`
- `Modal` → `GlobalModal`
- `UploadButton` → `FileInput`
- `AddCommentForm` → `AddCommentPrompt`
- `EndPollDialog` → `EndPollAlert`
- `SuggestPollOptionForm` → `SuggestPollOptionPrompt`
- `useAudioController` → `useAudioPlayer`
- `getDisplayTitle` → `useChannelDisplayName` (hook) or `useChannelPreviewInfo().displayTitle`
- `getDisplayImage` → `getChannelDisplayImage`

---

## Phase 2 — Removed Symbols: Code Rewrites

### `with*Context` HOCs → hooks

```tsx
// before
import { withMessageContext } from 'stream-chat-react';
const CustomMessage = withMessageContext(({ message }) => <div>{message.text}</div>);

// after
import { useMessageContext } from 'stream-chat-react';
const CustomMessage = () => {
  const { message } = useMessageContext();
  return <div>{message.text}</div>;
};
```

Applies to: `withChannelActionContext`, `withChannelStateContext`, `withChatContext`, `withComponentContext`, `withMessageContext`, `withTranslationContext`, `withTypingContext`.

### `MessageOptions` / `MessageActionsBox` / `MessageActionsWrapper` / `CustomMessageActionsList` → `MessageActions` + `messageActionSet`

```tsx
import { MessageActions, defaultMessageActionSet } from 'stream-chat-react';

const messageActionSet = defaultMessageActionSet.filter(
  ({ placement, type }) => placement === 'quick-dropdown-toggle' || type !== 'delete',
);

<MessageActions messageActionSet={messageActionSet} />;
```

Custom action sets MUST include a `quick-dropdown-toggle` item or the dropdown trigger disappears.

### `FixedHeightMessage` → custom `VirtualMessage`

```tsx
import type { MessageUIComponentProps } from 'stream-chat-react';

const VirtualMessage = (props: MessageUIComponentProps) => <CustomMessage {...props} />;

<WithComponents overrides={{ VirtualMessage }}>...</WithComponents>;
```

### `EditMessageForm` / `EditMessageModal` / `useEditHandler` / `clearEditingState` → composer-driven edit

```tsx
// customize preview via EditedMessagePreview in WithComponents
import { useMessageComposer, useMessageContext } from 'stream-chat-react';

const { message } = useMessageContext();
const messageComposer = useMessageComposer();

messageComposer.initState({ composition: message }); // start
messageComposer.clear(); // cancel
```

### `MessageListNotifications` → `NotificationList` + direct overrides

Wrapper is gone. Override individual floating indicators (`NewMessageNotification`, `UnreadMessagesNotification`, `ScrollToLatestMessageButton`) or the layout slot (`MessageListMainPanel`). Use `NotificationList` for client-emitted notifications.

### `ConnectionStatus` → app-owned system banner

```tsx
import { useReportLostConnectionSystemNotification } from 'stream-chat-react';

const ConnectionBanner = () => {
  useReportLostConnectionSystemNotification();
  return null;
};
```

Combine with `useSystemNotifications()` if rendering UI explicitly.

### `ButtonWithSubmenu` → `ContextMenu` primitives

Rebuild submenus with `ContextMenu`, `ContextMenuButton`, `ContextMenuHeader`, `ContextMenuBackButton`.

### `QuotedPoll` / `<Poll isQuoted />` → quoted-message layer

```tsx
import { QuotedMessagePreviewUI } from 'stream-chat-react';

<QuotedMessagePreviewUI quotedMessage={quotedMessage} />;
```

For richer rendering, override `QuotedMessage` or `QuotedMessagePreview` in `WithComponents` and render `quotedMessage.poll` yourself.

### Other removed symbols

- `isOnlyEmojis` → `countEmojis()` or `messageTextHasEmojisOnly()`
- `showMessageActionsBox`, `shouldRenderMessageActions` → build via `messageActionSet`
- `MessageErrorText`, `MessageErrorIcon` → removed; default error badge renders under `.str-chat__message-error-indicator`
- `QuotedMessagePreviewHeader` → `QuotedMessagePreviewUI`
- `CardAudio` → inline the audio card UI in your own component
- `attachmentTypeIconMap` → inline your own map or use `SummarizedMessagePreview`
- `ReactionDetailsComparator`, `sortReactionDetails` prop → `reactionDetailsSort` with `ReactionSort`
- `SimpleReactionsList` → `MessageReactions` or a custom compact list
- Standalone icons (`ActionsIcon`, `ReactionIcon`, `ThreadIcon`, `MessageErrorIcon`, `CloseIcon`, `SendIcon`, `MicIcon`, `MessageSentIcon`, `MessageDeliveredIcon`, `RetryIcon`, `DownloadIcon`, `LinkIcon`) → public `Icons` set (e.g. `IconXmark`, `IconCheckmark1Small`, `IconDoubleCheckmark1Small`) or higher-level components (`SendButton`, `MessageStatus`, `MessageActions`)
- `useChannelDeletedListener`, `useNotificationMessageNewListener`, `useMobileNavigation`, siblings → no shim; remove the calls (`ChannelList` handles these events internally)
- `ToggleSidebarButton`, `ToggleButtonIcon`, `MenuIcon`, `NAV_SIDEBAR_DESKTOP_BREAKPOINT` → app-owned sidebar (see Phase 6)
- `pinPermissions`, `PinPermissions`, `PinEnabledUserRoles`, `defaultPinPermissions` → rely on `channelCapabilities['pin-message']`; remove the props
- `usePinHandler(message, pinPermissions, notifications)` → `usePinHandler(message, notifications?)`
- `ChannelListItemUI.latestMessage` → `latestMessagePreview`
- `EmojiPicker.popperOptions` → `placement`
- `InfiniteScroll` / `LoadMoreButton` / `LoadMorePaginator`: `hasMore`, `loadMore`, `refreshing` → `hasNextPage`, `loadNextPage`, `isLoading`
- `InfiniteScroll` / `LoadMoreButton` / `LoadMorePaginator`: `hasMoreNewer`, `loadMoreNewer` → no alias; use `hasNextPage` / `loadNextPage` where appropriate

---

## Phase 3 — Move UI Overrides to `WithComponents`

`Channel` and `ChannelList` no longer accept UI override props. Move them all to `WithComponents` / `ComponentContext`.

```tsx
// before
<Channel Input={CustomInput} Message={CustomMessage} MessageOptions={CustomActions} Modal={CustomModal}>

// after
<WithComponents overrides={{
  MessageComposerUI: CustomInput,
  Message: CustomMessage,
  MessageActions: CustomActions,
  Modal: CustomModal,
}}>
  <Channel>...</Channel>
</WithComponents>
```

Override-key renames when you move them over:

- `MessageOptions` → `MessageActions`
- `MessageNotification` → `NewMessageNotification`
- `ReactionsListModal` → `MessageReactionsDetail`
- `MessageIsThreadReplyInChannelButtonIndicator` → `MessageAlsoSentInChannelIndicator`
- `ChannelPreviewActionButtons` → `ChannelListItemActionButtons`
- `ChannelPreviewMessenger` → `ChannelListItemUI`
- `FileUploadIcon` → `AttachmentSelectorInitiationButtonContents`
- `Input` → `MessageComposerUI`

Removed override keys (no rename; redesign the surface): `EditMessageInput`, `EditMessageModal`, `QuotedPoll`, `CustomMessageActionsList`, `MessageListNotifications`.

`ChannelList` direct UI props `List`, `Preview`, `Avatar`, `LoadingIndicator`, `LoadingErrorIndicator` are removed. Pass them through `WithComponents` under keys `ChannelListUI`, `ChannelListItemUI`, `Avatar`, `LoadingIndicator`, `LoadingErrorIndicator`.

`Channel` empty-state default changed: no active channel now renders `EmptyStateIndicator` (was blank). To restore v13:

```tsx
<Channel EmptyPlaceholder={null}>...</Channel>
```

---

## Phase 4 — Composer, Edit, and Cooldown

After the `MessageInput*` → `MessageComposer*` rename (Phase 1):

### `handleSubmit` signature

```tsx
// before
handleSubmit(customMessageData, { skip_enrich_url: true });
// after
handleSubmit(event?);
```

Custom message data flows through composer middleware or `messageComposer.customDataManager`, not `handleSubmit` args.

### Cooldown

`MessageComposerContext` no longer exposes `cooldownInterval`, `cooldownRemaining`, `setCooldownRemaining`.

```tsx
import {
  useCooldownRemaining,
  useIsCooldownActive,
  CooldownTimer,
} from 'stream-chat-react';

const cooldownRemaining = useCooldownRemaining();
const isCooldownActive = useIsCooldownActive();

<CooldownTimer />; // zero-prop
```

### Voice recordings

Moved out of `AttachmentPreviewList` into `VoiceRecordingPreviewSlot`. Custom composer UIs must render `<VoiceRecordingPreviewSlot />` separately.

### Smaller behavior changes

- **Textarea default is now 10 rows** (was 1). Pass `<MessageComposer maxRows={1} />` to restore.
- **`LinkPreviewList` default `displayLinkCount` is 1** (was all). Pass `<LinkPreviewList displayLinkCount={5} />` for more. Also: link previews now render while quoting a message (v13 suppressed them).
- **`AutocompleteSuggestionItem`**: inner wrapper is gone; custom items receive `ComponentProps<'button'>` directly. Prefer overriding `CommandItem`, `EmoticonItem`, `UserItem` instead of the full item.
- **`AttachmentSelector` action set**: can include `selectCommand`; filters out upload actions when disabled; cooldown disables the trigger. Custom `attachmentSelectorActionSet` gains `id`, `Header`, `Submenu`, `submenuItems`, `submenuHeader`.

---

## Phase 5 — Message Actions Model

### Props removed from `Message`, `MessageList`, `VirtualizedMessageList`

Delete usages of:

- `customMessageActions`
- `onlySenderCanEdit`
- All `get*Notification` callbacks (`getDeleteMessageErrorNotification`, `getFlagMessageSuccessNotification`, `getMuteUserSuccessNotification`, `getMarkMessageUnreadSuccessNotification`, `getPinMessageErrorNotification`, `getFetchReactionsErrorNotification`, and friends).

For sender-only edit behavior, filter the `edit` action out of your custom `messageActionSet` for foreign messages. For app-owned notifications, use `useNotificationApi()` or override the relevant `Streami18n` translation keys.

### `handleDelete` — new signature and semantics

`(event, options?) => void` → `(options?) => Promise<void>`. Removes unsent/failed messages locally; rethrows server errors.

```tsx
try {
  await handleDelete({ hardDelete: true });
} catch {
  // app-owned recovery; SDK already shows default error notification
}
```

### Default action set changed

- Now includes a built-in `download` action for downloadable attachments.
- Order is different. If UX depends on stable order, define a custom `messageActionSet` rather than relying on `defaultMessageActionSet` passthrough.
- `markUnread` is limited to foreign messages, even with `read-events` capability.

### Custom `Message` overrides

Read `groupedByUser`, `firstOfGroup`, `endOfGroup` from `useMessageContext()`, not props. `MessageUIComponentProps` is no longer guaranteed to be injected.

---

## Phase 6 — Search, Sidebar, Chat View, Query Limits

### Search

```tsx
// before
<ChannelList
  additionalChannelSearchProps={{ placeholder: 'Search...' }}
  ChannelSearch={ChannelSearch}
  showChannelSearch
/>;

// after
const CustomSearch = () => <Search placeholder='Search...' exitSearchOnInputBlur />;

<WithComponents overrides={{ Search: CustomSearch }}>
  <ChannelList showChannelSearch />
</WithComponents>;
```

Drop `additionalChannelSearchProps` and `ChannelSearch` props from `ChannelList`. Customize `Search`, `SearchBar`, `SearchResults` via `WithComponents`.

### `useChannelListContext()` no longer accepts a diagnostic component name

```tsx
// before
const { channels } = useChannelListContext('Sidebar');
// after
const { channels } = useChannelListContext();
```

### Sidebar is app-owned

`Chat` no longer owns sidebar state. Removed: `initialNavOpen` prop, `navOpen`, `openMobileNav`, `closeMobileNav` from `useChatContext()`. `ChannelHeader.MenuIcon` is removed. Put your app-owned toggle UI into the `HeaderStartContent` (or `HeaderEndContent`) override:

```tsx
<WithComponents overrides={{ HeaderStartContent: SidebarToggle }}>
  <Channel>...</Channel>
</WithComponents>
```

### `ChatView.Selector` defaults to icon-only

```tsx
<ChatView.Selector iconOnly={false} />
```

### `ChatView.ThreadAdapter` renders an empty state by default

To preserve the old blank pane, override `EmptyStateIndicator` with a `null`-returning component within that scope, or wire `ThreadProvider` manually.

### Explicit query limits

`Channel` and `ChannelList` no longer inject default query limits.

```tsx
<Channel channelQueryOptions={{ messages: { limit: 20 } }}>...</Channel>
<ChannelList options={{ limit: 30 }} />
```

---

## Phase 7 — Behavior Changes That Compile Cleanly

- **`ChannelHeader.live` removed.** Default header no longer renders `channel.data.subtitle`. If either matters, ship a custom `ChannelHeader`.
- **`ThreadHeader.overrideImage` removed.** Subtitle now includes reply count and can flip to typing state. `data-testid` changed from `close-button` to `close-thread-button`.
- **`TypingIndicator` contract changed.** Custom overrides must accept `scrollToBottom` and optionally `isMessageListScrolledToBottom` to preserve the new pinned-scroll behavior. `TypingIndicatorHeader` is a separate component rendered by the default `ChannelHeader` / `ThreadHeader`.
- **`MessageTimestamp` default is now `HH:mm`.** To restore calendar format, override the `timestamp/MessageTimestamp` key in `Streami18n`.
- **`MessageStatusProps.Avatar` removed.** Default read state no longer renders reader avatar. Implement a custom `MessageReadStatus` if required.
- **`MessageTextProps.theme` removed.** `MessageText` no longer renders quoted messages — handle quotes in the surrounding message UI. Classes like `str-chat__message-${theme}-text-inner` are gone.
- **`DateSeparator.position` / `.unread`.** Props are still accepted but no longer drive rendering. Provide a custom `DateSeparator` if lines or `New -` labels are required.
- **`UnreadMessagesSeparator`.** Now shows unread count and a mark-read button. Pass `showCount={false}` to suppress.
- **`Avatar` contract.** `image`/`name` → `imageUrl`/`userName`, `size` is now required.
- **`ChannelAvatar` / `GroupAvatar`.** `groupChannelDisplayInfo` array of `{image, name}` → `displayMembers`; `size` required.
- **`useChannelPreviewInfo()`** returns a stable empty group info object instead of `null`/`undefined` — any `groupChannelDisplayInfo == null` checks are now always false.
- **`useLatestMessagePreview()`** reports native `giphy` attachments with `type: 'giphy'`, not `image`.
- **`FileIcon` props.** `filename` → `fileName`; `big`, `size`, `sizeSmall`, `type` removed. `mimeTypeToIcon(type, mimeType)` → `mimeTypeToIcon(mimeType?)`.
- **`Gallery` / `ModalGallery`.** `ModalGallery` API went from `{ images, index }` to `{ items, initialIndex? }`. `Gallery` alone no longer renders a thumbnail grid — supply `GalleryUI` or use `ModalGallery` for the old behavior.
- **Low-level attachment containers.** `MediaContainer` now takes `attachments` (plural). Gallery payloads changed `images` → `items`. Audio custom components: rename prop `og` → `attachment`. Native `giphy` stays inline (no `ModalGallery` expansion).
- **`AttachmentProps.Gallery` → `AttachmentProps.ModalGallery`.** `Media` now uses `VideoPlayerProps`, not `ReactPlayerProps`.
- **`PinIndicator`** no longer receives `t` as prop — use `useTranslationContext()` inside.
- **Suggestion `UserItem`** no longer receives `Avatar` prop — render avatar/menu UI directly.
- **Modal prompt components.** `MessageBouncePrompt`, `RecordingPermissionDeniedNotification`, poll `PollOptionsFullList` / `PollResults` / `PollAnswerList` / `SuggestPollOptionPrompt` no longer receive `onClose` / `close` props. Dismiss via `useModalContext().close()`.
- **`handleDelete` behavior.** Unsent and network-failed messages are removed locally without a server round-trip.

---

## Phase 8 — CSS, DOM, and Selector Audit

- `stream-chat-react/dist/css/v2/*` → `stream-chat-react/dist/css/*`
- `.str-chat__modal__inner` → removed; children render directly
- `.str-chat__channel-list-messenger` → `.str-chat__channel-list-inner`
- `.str-chat__channel-list-messenger__main` → `.str-chat__channel-list-inner__main`
- `.str-chat__channel-list-react` → removed
- `.str-chat__message-input-inner` → `.str-chat__message-composer`
- `.str-chat__message-textarea-container` → `.str-chat__message-composer-compose-area`
- `.str-chat__message-textarea-with-emoji-picker` → `.str-chat__message-composer-controls`
- `.str-chat__message-error-icon` → `.str-chat__message-error-indicator`
- `aria-selected` on channel/thread list items → `aria-pressed`
- `.str-chat__header-hamburger` → app-owned toggle via `HeaderStartContent`
- `--str-chat__jump-to-latest-message-*` CSS vars → removed; use current tokens
- `BaseIcon` `viewBox="0 0 16 16"` → `viewBox="0 0 20 20"` (affects custom icons)

---

## Verification

1. **Detect the consumer's package manager.** Inspect the repo root:
   - `pnpm-lock.yaml` → `pnpm`
   - `yarn.lock` → `yarn`
   - `bun.lockb` or `bun.lock` → `bun`
   - `package-lock.json` → `npm`
   - otherwise check `packageManager` in `package.json`; if still ambiguous, ask the user.
2. **Read `package.json` scripts.** Script names vary (`typecheck`, `types`, `tsc`, `lint`, `test`, `build`). Pick the closest matches.
3. **Run in order**, fixing errors before continuing:
   - install dependencies
   - typecheck → expect zero errors
   - lint → expect zero errors
   - tests → expect zero failures
   - build → expect clean build
4. **Smoke-test runtime flows** that compile cleanly but changed in v14:
   - compose, send, edit, delete a message (including an unsent/failed message)
   - add and remove a reaction; open the reactions detail dialog
   - start and reply to a thread
   - open channel search; verify search results
   - toggle sidebar (app-owned)
   - custom message-action menu shows the dropdown toggle (i.e. `quick-dropdown-toggle` item is present)
   - empty channel placeholder renders `EmptyStateIndicator` (or is suppressed via `EmptyPlaceholder={null}`)
