# React v14 Docs Plan

Last updated: 2026-03-15

## Goal

Produce a reliable v13 to v14 migration guide for `@stream-io/stream-chat-react` and keep the v14 docs set aligned with the current source while the release is still in progress.

## Current Phase

- Phase: breaking-change inventory
- Constraint: do not edit v14 docs pages again until the breaking-change list is complete enough to support a coherent migration pass
- During this phase, keep `breaking-changes.md` and this file up to date with confirmed findings and affected docs pages

## Working Baseline

- Code baseline for analysis: `stream-chat-react` `v13.14.2..master`
- Current audited SDK head: `6ea7a78e4184fce6066f7318f9ebd57a5ff1474a` (`6ea7a78e`, `2026-03-13`, `feat: adjust media gallery viewer (#3006)`)
- Future mining starting point: review `stream-chat-react` diff `6ea7a78e4184fce6066f7318f9ebd57a5ff1474a..HEAD`, then map any confirmed changes back to `v13.14.2` before updating `breaking-changes.md` and this file
- Docs content repo: `/Users/oliverlaz/w/repos/stream-chat-sdks/docs/data/docs`
- Docs content branch: `react-chat-v14`
- Site shell repo: `/Users/oliverlaz/w/repos/stream-chat-sdks/docs`

## Working Rules

- Treat source code as the primary evidence for migration items.
- Use PR titles, changelog notes, and `BREAKING CHANGE` labels only as secondary coverage checks.
- Add an entry to `breaking-changes.md` only after the change is confirmed in code.
- During inventory, record the affected v14 docs pages here but defer page edits until the breaking-change list is complete.
- Keep the migration guide focused on integrator-facing changes, not internal refactors.

## Deliverables

- `stream-chat-react/breaking-changes.md`
- v13 to v14 migration guide in the React v14 docs set
- Updated v14 reference pages for any confirmed breaking changes
- Updated v14 sidebar entry and naming

## Confirmed Docs Issues

### 1. v14 sidebar still exposes the old upgrade guide title

- Status: open
- Evidence: `data/docs/_sidebars/[chat-sdk][react][v14-rc].json` still labels the page as `Upgrade to v13`
- Expected fix: rename the nav item and ensure the slug/file name match the actual v13 to v14 migration guide

### 2. v14 release guide file is still the inherited v13 guide

- Status: open
- Evidence: `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v13.md` starts with `Removal of StreamChatGenerics`
- Expected fix: replace with a real v13 to v14 migration guide

### 3. v14 Channel docs still reference unstable experimental MessageActions

- Status: resolved
- Evidence:
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md`
- Expected fix: point to the stable `MessageActions` component and current source path

### 4. v14 ComponentContext docs still reference the removed indicator name

- Status: resolved
- Evidence: `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` still documents `MessageIsThreadReplyInChannelButtonIndicator`
- Expected fix: update to `MessageAlsoSentInChannelIndicator`

### 5. v14 message docs still describe removed `MessageOptions` and `FixedHeightMessage`

- Status: open
- Evidence:
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/05-message_ui.md`
  - `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md`
- Expected fix: replace or rewrite stale references to match current `MessageActions`, `MessageDeletedBubble`, and `VirtualMessage` guidance

### 6. v14 Channel docs still present component overrides as `Channel` props

- Status: open
- Evidence:
  - `v13.14.2:src/components/Channel/Channel.tsx` forwarded many component overrides through `Channel`
  - current `src/components/Channel/Channel.tsx` no longer defines that forwarded override surface in `ChannelProps`
  - current `Channel` also defaults `EmptyPlaceholder` to `EmptyStateIndicator` instead of rendering nothing when no channel is active
  - `src/context/WithComponents.tsx` and `README.md` now point to `WithComponents` for overrides
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` still documents many component overrides on the `Channel` page
- Expected fix: decide whether to rewrite the page around actual `ChannelProps` and move override guidance to `ComponentContext` / `WithComponents`, or clearly split the concepts in docs; also document the new `EmptyPlaceholder={null}` opt-out for the old blank state behavior

### 7. v14 MessageContext docs still document removed edit-state and custom-action fields

- Status: open
- Evidence:
  - current `src/context/MessageContext.tsx` removed `clearEditingState`, `editing`, `handleEdit`, `setEditingState`, `additionalMessageInputProps`, and `customMessageActions`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md` still documents them
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/05-message_ui.md` still composes around them
- Expected fix: rewrite the MessageContext docs around the current contract and point edit flows to `MessageComposer`

### 8. v14 MessageInputContext docs still document cooldown state in context

- Status: open
- Evidence:
  - current `src/context/MessageInputContext.tsx` no longer composes `CooldownTimerState`
  - current public hooks expose cooldown state via `useCooldownRemaining` and `useIsCooldownActive`
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/02-message_input_context.md` still documents `cooldownInterval`, `cooldownRemaining`, and `setCooldownRemaining`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/01-input_ui.md` still consumes cooldown values from `useMessageInputContext()`
- Expected fix: update docs to use the dedicated cooldown hooks

### 9. v14 attachment docs still document the old gallery/image override surface

- Status: open
- Evidence:
  - current `src/components/Attachment/Attachment.tsx` exposes `ModalGallery` instead of `Gallery`
  - current attachment rendering no longer uses separate `gallery` / `image` grouping in the old way
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md` still documents `Gallery`, `Image`, and `ReactPlayer` as the old default surface
- Expected fix: rewrite the Attachment page to match current `AttachmentProps` and render grouping

### 10. v14 ComponentContext docs are still only partially aligned with the current override keys

- Status: open
- Evidence:
  - current `src/context/ComponentContext.tsx` removed or renamed several keys
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` still documents `CustomMessageActionsList`, `EditMessageInput`, `EditMessageModal`, `FileUploadIcon`, `MessageNotification`, `QuotedPoll`, and `ReactionsListModal`
- Expected fix: fully reconcile the page with the current `ComponentContextValue`

### 11. many v14 docs examples still pass component overrides directly to `Channel`

- Status: open
- Evidence:
  - current `ChannelProps` no longer expose the old forwarded override surface
  - many v14 docs examples still use `<Channel Message={...}>`, `<Channel Attachment={...}>`, `<Channel Modal={...}>`, `<Channel Input={...}>`, `<Channel ThreadHeader={...}>`, etc.
  - `rg` over `data/docs/chat-sdk/react/v14` shows affected examples in message, attachment, modal, thread, AI, and cookbook pages
- Expected fix: migrate examples to `WithComponents` / `ComponentContext` where appropriate, and only keep direct `Channel` props where they still exist in current source

### 12. v14 message-list docs still describe `MessageNotification` and `ScrollToBottomButton`

- Status: open
- Evidence:
  - current `stream-chat-react` exports `NewMessageNotification` and `ScrollToLatestMessageButton` instead
  - current `UnreadMessagesSeparator` defaults `showCount` to true and adds a mark-read button
  - current `ScrollToLatestMessageButton` uses different markup/classes than the old floating action button, and the old `--str-chat__jump-to-latest-message-*` CSS variables were removed
  - `data/docs/chat-sdk/react/v14/04-guides/05-channel_read_state.md` still documents `MessageNotificationProps`, `ScrollToBottomButton`, and `<Channel MessageNotification={...}>`
  - `data/docs/chat-sdk/react/v14/04-guides/13-notifications.md` still suggests overriding `MessageListNotifications` through `Channel`
  - `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/03-message_list_context.md` and `04-virtualized_message_list_context.md` still list `MessageNotification`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` and `05-component_context.md` still document `MessageNotification`
- Expected fix: rewrite message-list notification docs around `NewMessageNotification`, `ScrollToLatestMessageButton`, the simplified `MessageListNotifications` contract, and the current unread-separator/scroll-button behavior

### 13. v14 edit-message and cooldown docs still describe removed form/modal and hook APIs

- Status: open
- Evidence:
  - current source removed `EditMessageForm`, `EditMessageModal`, `useEditHandler`, `useCooldownTimer`, and prop-driven `CooldownTimer`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/04-message_hooks.md` still documents `useEditHandler`
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/03-message_input_hooks.md` still documents `useCooldownTimer`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` and `05-component_context.md` still document `EditMessageForm`, `EditMessageModal`, and old `CooldownTimer` customization
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/01-input_ui.md` still renders `CooldownTimer` with props
- Expected fix: rewrite edit-message docs around `MessageComposer` / `EditedMessagePreview`, and cooldown docs around `CooldownTimer`, `useCooldownRemaining`, and `useIsCooldownActive`

### 14. v14 reactions docs still describe `ReactionsListModal` and the old `ReactionSelector` prop surface

- Status: open
- Evidence:
  - current source exports `MessageReactionsDetail` instead of `ReactionsListModal`
  - current `ReactionSelectorProps` no longer accepts `reactionOptions` and the older display/data props
  - current `MessageReactionsDetail` is dialog content with renamed classnames, not a modal component with the old `str-chat__message-reactions-details*` structure
  - current `ReactionSelector` markup/classes changed substantially from the old tooltip/avatar/count layout
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/12-reactions.md` still documents `ReactionsListModal` and `ReactionSelector.reactionOptions`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/02-reactions.md` still passes `reactionOptions` into `ReactionSelector`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md` still assumes array-only `reactionOptions` from `useComponentContext()`
- Expected fix: update reactions docs to the current `MessageReactionsDetail` naming, the narrowed `ReactionSelector` props, the current reaction-options shape, and the new selector/detail markup expectations

### 15. v14 poll docs still describe `QuotedPoll`, `Poll.isQuoted`, and old poll-action component names

- Status: open
- Evidence:
  - current source removed `QuotedPoll` and `Poll.isQuoted`
  - current source renamed direct poll-action exports to `AddCommentPrompt`, `EndPollAlert`, and `SuggestPollOptionPrompt`
  - current poll dialog subcomponents no longer receive `close` props directly and now rely on modal context/dialog primitives
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/10-poll.md` still documents `QuotedPoll`, `SuggestPollOptionForm`, `AddCommentForm`, and `EndPollDialog`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` and `05-component_context.md` still document `QuotedPoll`
- Expected fix: rewrite poll docs around the current `Poll` / `PollActions` surface and remove quoted-poll guidance that no longer maps to exported APIs

### 16. v14 MessageActions docs still describe the removed wrapper/box/custom-actions surface

- Status: open
- Evidence:
  - current source removed `MessageActionsBox`, `MessageActionsWrapper`, and `CustomMessageActionsList`
  - current `MessageActions` uses `messageActionSet`, quick actions, and `ContextMenu`
  - `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md` still centers the old `MessageOptions`, `MessageActionsBox`, and `CustomMessageActionsList` model
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md` still references `CustomMessageActionsList`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/01-message.md` and `07-message-list/01-message_list.md` still describe `customMessageActions` in terms of `MessageActionsBox`
- Expected fix: replace the legacy docs model with current `MessageActions`, action-set items, and `ContextMenu`-based customization

### 17. v14 avatar docs and examples still use the v13 avatar prop names and helper assumptions

- Status: open
- Evidence:
  - current `AvatarProps` use `imageUrl`, `userName`, `isOnline`, and required `size`
  - current channel/group avatar rendering expects `displayMembers` plus optional `overflowCount`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/08-avatar.md` still uses `image`, `name`, and old `displayTitle` / `displayImage` assumptions
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/10-thread_header.md`, `03-ui-cookbook/05-message-input/06-suggestion_list.md`, and `03-ui-cookbook/04-message/06-system_message.md` still render `<Avatar image=... name=... />`
- Expected fix: rewrite avatar docs around the current prop names, the required `size` prop, and the new group/channel avatar data shape

### 18. v14 ChannelHeader docs still document the removed `live` prop

- Status: open
- Evidence:
  - current `ChannelHeaderProps` no longer expose `live`
  - current default `ChannelHeader` no longer renders `channel.data.subtitle`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md` still shows `<ChannelHeader live={true} title={"General"} />`
- Expected fix: remove `live` guidance, stop implying `channel.data.subtitle` is rendered by default, and document the current header behavior plus the need for a custom header if livestream or subtitle metadata is still required

### 19. v14 modal/dialog docs still mix legacy `Modal` usage with stale component-override patterns

- Status: open
- Evidence:
  - current public modal component is `GlobalModal`; the old `Modal` component is no longer exported
  - current `GlobalModal` no longer renders the legacy `.str-chat__modal__inner` wrapper
  - `data/docs/chat-sdk/react/v14/02-ui-components/16-modal.md` still describes the legacy `Modal` as a public option and shows `<Modal ...>`
  - `data/docs/chat-sdk/react/v14/04-guides/10-dialog-management.md` still shows `<Modal ...>`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` and `05-component_context.md` still document `Channel`/`ComponentContext` modal override patterns that need reconciliation with the current `WithComponents` model
- Expected fix: rewrite the modal docs around `GlobalModal` and current dialog primitives, mention the removed inner wrapper, then reconcile any remaining modal override guidance with the actual v14 customization surface

### 20. v14 FileIcon docs still use the old prop API

- Status: open
- Evidence:
  - current `FileIconProps` expose `fileName`, `mimeType`, and `className` only
  - `data/docs/chat-sdk/react/v14/04-guides/15-audio-playback.md` still uses `<FileIcon big={true} mimeType={audioPlayer.mimeType} size={40} />`
- Expected fix: update examples to the current `FileIcon` API

### 21. v14 message status docs still mention removed standalone status-icon exports

- Status: open
- Evidence:
  - current message status UI renders shared `Icons` components instead of exporting `MessageDeliveredIcon` / `MessageSentIcon`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md` still says the default delivered-status UI renders `MessageDeliveredIcon`
- Expected fix: rewrite the status-icon guidance around `MessageStatus` and the current shared icon set

### 22. v14 message-input attachment preview docs still describe the old preview-list and voice-recording model

- Status: open
- Evidence:
  - current `AttachmentPreviewListProps` no longer include `VoiceRecordingPreview`
  - current `MessageInputFlat` renders `VoiceRecordingPreviewSlot` separately above `AttachmentPreviewList`
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/05-ui_components.md` still documents `VoiceRecordingPreview`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/03-attachment_previews.md` still lists `VoiceRecordingPreview` as part of the old attachment preview model
- Expected fix: rewrite the attachment preview docs around the current audio/video preview prop types and the separate `VoiceRecordingPreviewSlot`

### 23. v14 gallery docs still describe the old `Gallery` and `ModalGallery` APIs

- Status: open
- Evidence:
  - current `GalleryProps` use `items`, `GalleryUI`, `initialIndex`, `onIndexChange`, and `onRequestClose`
  - current `ModalGalleryProps` use `items` instead of `images` / `index`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/02-image_gallery.md` still builds custom components against the old `GalleryProps`
  - `data/docs/chat-sdk/react/v14/02-ui-components/16-modal.md` and `04-guides/10-dialog-management.md` still show `<ModalGallery images={[...]} index={0} />`
- Expected fix: rewrite gallery docs around the provider-style `Gallery` plus the new `ModalGallery` prop contract

### 24. v14 styling docs still target pre-v14 DOM/class structures

- Status: open
- Evidence:
  - current `ChannelHeader`, `MessageInputFlat`, and `Avatar` markup/classes changed substantially in v14
  - `data/docs/chat-sdk/react/v14/02-ui-components/01-getting_started.md` still targets `.str-chat__header-hamburger`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/09-channel_header.md` still renders `str-chat__header-livestream`
- Expected fix: rewrite CSS snippets and customization examples against the current header/composer/avatar markup and steer users toward the current styling/token layer

### 25. v14 Chat docs still document `initialNavOpen` as the only initial sidebar-state control

- Status: open
- Evidence:
  - current `ChatProps` added `initialNavOpenResponsive`
  - current `Chat.tsx` explicitly says `initialNavOpen` is ignored when `initialNavOpenResponsive` is true
  - `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/01-chat.md` documents `initialNavOpen` but does not mention `initialNavOpenResponsive`
- Expected fix: document `initialNavOpenResponsive`, clarify its default behavior, and show how to preserve v13-style `initialNavOpen` control

### 26. v14 attachment docs do not cover the low-level attachment-container/export churn

- Status: open
- Evidence:
  - current `AttachmentContainer` exports now include `GiphyContainer`, `OtherFilesContainer`, and `VideoContainer`
  - current `MediaContainer` expects `attachments`, and `GalleryAttachment` now uses `items`
  - `CardAudio` is no longer re-exported from the package root
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md` and `03-ui-cookbook/06-attachment/02-image_gallery.md` do not warn users who customized the low-level attachment layer
- Expected fix: add migration guidance for low-level custom attachment renderers and keep the attachment docs focused on supported override points in v14

### 27. v14 typing indicator docs still document the old prop contract

- Status: open
- Evidence:
  - current `TypingIndicatorProps` use `scrollToBottom`, optional `isMessageListScrolledToBottom`, and `threadList`
  - current `TypingIndicator` no longer exposes an `Avatar` prop and now renders `AvatarStack`
  - `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md` still documents `TypingIndicatorProps.Avatar`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/07-typing_indicator.md` still builds a custom typing indicator against the old `threadList`-only props
- Expected fix: rewrite typing-indicator docs around the current prop contract and scroll behavior

### 28. v14 message bounce and audio-recorder permission docs still document removed close props

- Status: open
- Evidence:
  - current `MessageBouncePromptProps` no longer expose `onClose` and now close via `useModalContext()`
  - current `RecordingPermissionDeniedNotificationProps` no longer expose `onClose`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/03-message_bounce_context.md` still implements custom prompts with `onClose`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md` still documents `MessageBouncePrompt.onClose`
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/07-audio_recorder.md` still treats `RecordingPermissionDeniedNotification` like the old dismissable dialog surface
- Expected fix: rewrite these docs around modal context or the current parent-managed flow instead of explicit close props

### 29. v14 message status and message text docs still describe removed props and old default behavior

- Status: open
- Evidence:
  - current `MessageStatusProps` no longer expose `Avatar`, and the default read/sent/delivered states no longer use the old avatar-plus-standalone-icons model
  - current `MessageTextProps` no longer expose `theme`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md` still documents `MessageStatus.Avatar`, old default status rendering, `MessageText.theme`, and `MessageBouncePrompt.onClose`
- Expected fix: reconcile the message UI-components page with the current `MessageStatus`, `MessageText`, and `MessageBouncePrompt` contracts

### 30. v14 custom-message docs still imply the SDK injects `MessageUIComponentProps` into overrides

- Status: open
- Evidence:
  - current `src/components/Message/Message.tsx` renders `<MessageUIComponent />` and no longer passes `groupedByUser` or other SDK-owned props directly into the override component
  - current `MessageContext` still exposes grouping state via `useMessageContext()`
  - `data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md` still types a custom message override as `(props: MessageUIComponentProps)` and forwards those props into `<MessageSimple {...props} />`
- Expected fix: document that custom message overrides should read SDK state from `useMessageContext()` and simplify examples so they do not imply direct prop injection

### 31. v14 suggestion-list docs still describe a stale `AutocompleteSuggestionItem` customization model

- Status: open
- Evidence:
  - current `src/components/TextareaComposer/SuggestionList/SuggestionList.tsx` and `SuggestionListItem.tsx` drive suggestion items through the current button-based `SuggestionListItem` contract
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/06-suggestion_list.md` still customizes items around old `selected`, `onSelectHandler`, and `onClickHandler` props and still mounts the override through `Channel`
- Expected fix: rewrite the suggestion-list cookbook around the current `SuggestionListItem` contract, current keyboard-selection flow, and the v14 override path

### 32. v14 installation and migration docs do not call out the newer `stream-chat` minimum

- Status: open
- Evidence:
  - current `stream-chat-react/package.json` requires `stream-chat@^9.35.0`
  - v13 baseline required only `stream-chat@^9.27.2`
  - `data/docs/chat-sdk/react/v14/01-basics/02-installation.md` tells users to install both packages but does not call out the v14 minimum or the need to upgrade them together
- Expected fix: mention the new `stream-chat` minimum in the migration guide and add a short version-alignment note to installation docs

### 33. v14 Channel and ChannelList docs still imply old SDK-managed initial query defaults

- Status: open
- Evidence:
  - current `Channel` no longer injects a default initial `messages.limit` into `channelQueryOptions`
  - current `ChannelList` no longer relies on the old internal max query limit when deciding first-load behavior
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` still says the default initial message page is 100
- Expected fix: document that consumers should set `channelQueryOptions.messages.limit` and `ChannelList` `options.limit` explicitly when they care about first-load size or pagination consistency

### 34. v14 TypeScript custom-data docs still imply default components rely on `subtitle`

- Status: open
- Evidence:
  - current `DefaultChannelData` still includes `subtitle`, but the current default `ChannelHeader` no longer renders `channel.data.subtitle`
  - `data/docs/chat-sdk/react/v14/04-guides/04-typescript_and_custom_data_types.md` still warns that default components expect `subtitle`, `image`, and `name`
- Expected fix: narrow the warning so it reflects which default components still actually rely on `DefaultChannelData` fields in v14

### 35. v14 DateSeparator docs still describe the old `position` / `unread` rendering model

- Status: open
- Evidence:
  - current `DateSeparator` no longer renders separator lines or the old `New - ...` unread prefix
  - current `DateSeparator` adds `className` and `floating`, while `position` / `unread` are effectively legacy placeholders in the default implementation
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/13-date_separator.md` still demonstrates `position=\"center\"` / `position=\"left\"` and documents `unread` as current behavior
- Expected fix: rewrite the page around the current default separator behavior, mention `floating`, and tell users to provide a custom `DateSeparator` if they still need unread prefixes or left/center/right line layouts

### 36. v14 thread docs still describe the old `ThreadHeader` behavior and override path

- Status: open
- Evidence:
  - current `ThreadHeader` no longer accepts `overrideImage`
  - current default `ThreadHeader` subtitle can show `threadDisplayName · replyCount` or typing state, and the close button is conditional in the newer thread-instance flow
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/10-thread_header.md` still says the default `ThreadHeader` shows the reply count and a close button, uses old `Avatar image/name` props, and still mounts the override through `Channel`
  - `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/05-thread.md` still demonstrates `ThreadHeader` overrides through `Channel` props
- Expected fix: update thread docs to the current `ThreadHeader` contract, remove the dead `Channel ThreadHeader={...}` path, and document the current default subtitle/close-button behavior

### 37. v14 channel preview docs still describe stale preview helpers, avatar defaults, removed status-icon exports, and old preview controls

- Status: open
- Evidence:
  - current `ChannelPreviewMessenger` defaults its `Avatar` prop to `ChannelAvatar`, not the plain `Avatar`
  - current `useChannelDisplayName()` can synthesize group/direct-message titles, and current `getChannelDisplayImage()` should be preferred over `channel.getDisplayImage()` for the old DM-image fallback behavior
  - current `ChannelPreviewMessenger` uses `aria-pressed`, `SummarizedMessagePreview`, `ChannelPreviewTimestamp`, muted-state modifiers, and the redesigned `str-chat__channel-preview-data*` layout
  - current `ChannelPreviewActionButtons` now use a `ContextMenu` plus DM-specific archive / non-DM mute actions instead of the old dedicated pin/archive buttons
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md` still documents `Avatar` as the plain avatar component and still imports removed `SingleCheckMarkIcon` / `DoubleCheckMarkIcon*` helpers
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/02-channel-list/01-channel_list_preview.md` still needs review against the current preview prop semantics and generated display-title behavior
- Expected fix: rewrite the channel-preview docs around the current `ChannelPreviewMessenger` contract, current avatar/helper recommendations, current preview/action-button behavior, and current status-icon guidance

### 38. v14 AttachmentSelector docs still describe the pre-redesign selector contract

- Status: open
- Evidence:
  - current `AttachmentSelectorAction` now supports `id`, `Header`, `Submenu`, and `selectCommand`, and `AttachmentSelectorActionProps` now include submenu helpers
  - current default `AttachmentSelector` can add a commands submenu, filters out file upload actions when uploads are runtime-disabled, and disables the selector button during cooldown
  - current `SimpleAttachmentSelector` no longer uses the old `str-chat__file-input-container` / `str-chat__file-input-label` markup
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/08-attachment-selector.md` still routes customization through `Channel`, still presents the old modal-only action model, and does not mention the redesigned button/commands/cooldown behavior
- Expected fix: rewrite the attachment-selector docs around `WithComponents`/current overrides, the expanded action contract, command submenu support, runtime upload filtering, and the redesigned selector button DOM

### 39. v14 link-preview docs still describe the old `LinkPreviewList` contract and default behavior

- Status: open
- Evidence:
  - current `LinkPreviewListProps` expose `displayLinkCount`, and the default list now renders only one preview unless overridden
  - current `LinkPreviewList` no longer suppresses previews while quoting and now renders inside the shared composer preview stack
  - current `LinkPreviewCard` renders optional thumbnails plus a URL row instead of the old icon-only card UI
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/05-ui_components.md` still says `LinkPreviewList` has no props
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/02-link-previews.md` still shows `Channel LinkPreviewList={...}` and a fictional `LinkPreviewListProps` shape with injected `linkPreviews`
- Expected fix: update link-preview docs to the current `LinkPreviewList` prop surface and default behavior, remove the stale `Channel` override path, and document how to wrap the default component when consumers want more than one preview or the old quote-mode behavior

### 40. v14 sidebar and thread-list docs still reference pre-redesign selectors and selection semantics

- Status: open
- Evidence:
  - current `ChannelListMessenger` removed `str-chat__channel-list-messenger-react` / `str-chat__channel-list-messenger-react__main` and now wraps the loading state inside `str-chat__channel-list-messenger__main`
  - current `ThreadListItemUI` uses `aria-pressed` plus the new summarized-preview layout instead of the old `aria-selected` / channel-parent-latest-reply DOM
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/06-channel-list-infinite-scroll.md` still tells users to style `.str-chat__channel-list-messenger-react__main`
  - `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md` still demonstrates `threadListItemUiProps={{ "aria-selected": ... }}`
- Expected fix: update sidebar/thread-list docs to current selectors and button-state semantics, and add a brief warning that custom channel/thread list CSS based on the old default DOM must be audited in v14

### 41. v14 ChatView docs still describe `ThreadAdapter` as a pure `ThreadProvider` pass-through

- Status: open
- Evidence:
  - current `ChatView.ThreadAdapter` renders `EmptyStateIndicator` with `messageText="Select a thread to continue the conversation"` once thread state is ready and no thread is selected
  - current `ChatView` tests assert that placeholder behavior explicitly
  - `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md` still says `ChatView.ThreadAdapter` only reads the active thread from `ThreadsViewContext` and forwards it to `ThreadProvider`
  - `data/docs/chat-sdk/react/v14/02-ui-components/06-thread-list/01-thread-list.md` points users to `ChatView` for selection support but does not mention the new default placeholder behavior
- Expected fix: update `ChatView` and thread-list docs to explain the new placeholder behavior and show how to keep the old blank state when needed by wiring `ThreadProvider` manually or overriding `EmptyStateIndicator`

### 42. v14 ChatView docs do not call out the new icon-only default for `ChatView.Selector`

- Status: open
- Evidence:
  - current `ChatView.Selector` now defaults `iconOnly` to `true`
  - current selector items render the visible `Channels` / `Threads` labels only when `iconOnly={false}`, otherwise the text moves into tooltip/`aria-label` behavior
  - `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md` still shows bare `<ChatView.Selector />` usage without mentioning that the visible button labels from v13 are no longer the default
- Expected fix: update the `ChatView` docs to call out the icon-only default and show `iconOnly={false}` as the migration path for apps that want the old labeled selector layout

## Docs Update Checklist

- [ ] Finish the breaking-change inventory before resuming docs edits
- [ ] Create the new v13 to v14 migration guide content
- [ ] Rename or replace the current v14 release-guide file/metadata
- [ ] Update the v14 sidebar entry
- [x] Update Channel docs for current `MessageActions`
- [x] Update ComponentContext docs for `MessageAlsoSentInChannelIndicator`
- [ ] Remove stale `MessageOptions` references from v14 reference docs
- [ ] Sweep v14 docs for stale `experimental/MessageActions` references
- [ ] Sweep v14 docs for stale renamed export references
- [ ] Run docs verification commands

## Page Tracker

| Status  | Page                                                                                               | Reason                                                                                                                                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| open    | `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v13.md`                              | Placeholder content must be replaced with v13 to v14 migration guidance                                                                                                                                                                                      |
| open    | `data/docs/_sidebars/[chat-sdk][react][v14-rc].json`                                               | Nav label and migration guide metadata are stale                                                                                                                                                                                                             |
| partial | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md`                           | Fixed stale `MessageActions`/`MessageOptions` references, but the page still needs a broader rewrite because component overrides no longer match current `ChannelProps` and `channelQueryOptions` docs still imply the removed default initial message limit |
| partial | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md`                 | Updated `MessageActions`, removed `MessageOptions`, and fixed `MessageDeleted`/`MessageDeletedBubble` plus `MessageAlsoSentInChannelIndicator`, but several old override keys are still documented                                                           |
| open    | `data/docs/chat-sdk/react/v14/01-basics/02-installation.md`                                        | Should call out the newer `stream-chat` minimum required by v14                                                                                                                                                                                              |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md`                     | Still describes removed `MessageOptions`, old deleted-message/status APIs, `MessageText.theme`, and `MessageBouncePrompt.onClose`                                                                                                                            |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/05-message_ui.md`                        | Still describes removed `FixedHeightMessage` and `MessageOptions` composition                                                                                                                                                                                |
| open    | `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md`                      | Still documents `MessageActions` as experimental and references `MessageOptions` wrapping semantics                                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md`                   | Still documents removed edit-state fields, `customMessageActions`, and old `handleDelete` signature                                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/02-message_input_context.md`       | Still documents cooldown state as part of `MessageInputContext`                                                                                                                                                                                              |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/03-message_input_hooks.md`         | Still documents `useCooldownTimer` instead of the new cooldown hooks                                                                                                                                                                                         |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/01-input_ui.md`                      | Example still pulls cooldown state from `useMessageInputContext()`                                                                                                                                                                                           |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/04-message_hooks.md`                     | Still documents the removed `useEditHandler` hook                                                                                                                                                                                                            |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md`          | Still documents removed `Gallery` override and outdated attachment grouping/defaults                                                                                                                                                                         |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/10-poll.md`                              | Still documents `QuotedPoll`, `Poll.isQuoted`, and old poll-action component names                                                                                                                                                                           |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/12-reactions.md`                         | Still documents `ReactionsListModal` and the old `ReactionSelector` prop surface                                                                                                                                                                             |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/02-reactions.md`                           | Still passes `reactionOptions` into `ReactionSelector` and references `ReactionsListModal`                                                                                                                                                                   |
| open    | `data/docs/chat-sdk/react/v14/04-guides/05-channel_read_state.md`                                  | Still documents `MessageNotification`, `ScrollToBottomButton`, and old message-actions internals                                                                                                                                                             |
| open    | `data/docs/chat-sdk/react/v14/04-guides/13-notifications.md`                                       | Still suggests `MessageListNotifications` customization through `Channel` overrides                                                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md`                      | Still documents `MessageActionsBox`, `CustomMessageActionsList`, and the old `MessageOptions` model                                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/08-avatar.md`                            | Still uses the old `Avatar` prop names and outdated channel-avatar assumptions                                                                                                                                                                               |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md`           | Still documents the preview avatar/status surface with stale defaults, removed standalone status icons, and the old preview/action-button behavior                                                                                                           |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/06-channel-list-infinite-scroll.md` | Still tells users to style the removed `.str-chat__channel-list-messenger-react__main` selector                                                                                                                                                              |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/02-channel-list/01-channel_list_preview.md`           | Needs review against current synthesized display-title/image helpers, `aria-pressed` semantics, and the current preview/action-button contract                                                                                                               |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/10-thread_header.md`                                  | Example still renders `<Avatar image=... name=... />`                                                                                                                                                                                                        |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/06-suggestion_list.md`               | Suggestion-list examples still use old `Avatar` props, a stale `AutocompleteSuggestionItem` prop contract, and the removed `Channel` override path                                                                                                           |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/06-system_message.md`                      | System-message example still renders `<Avatar image=... />`                                                                                                                                                                                                  |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md`                                    | Custom threads example still uses `aria-selected`, the page still describes `ThreadAdapter` as a pure `ThreadProvider` pass-through, and it does not call out the new icon-only default for `ChatView.Selector`                                              |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/06-thread-list/01-thread-list.md`                   | Selection-support guidance points users to `ChatView`, but does not mention the new `ThreadAdapter` placeholder behavior                                                                                                                                     |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/05-thread.md`                       | Still routes `ThreadHeader` overrides through `Channel` props and needs alignment with the current thread-header behavior                                                                                                                                    |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md`                    | Still documents the removed `live` prop and should stop implying `channel.data.subtitle` is shown by the default header                                                                                                                                      |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/16-modal.md`                                        | Still documents legacy `Modal` usage instead of a `GlobalModal`-only public surface                                                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14/04-guides/10-dialog-management.md`                                   | Still shows `<Modal ...>` and needs reconciliation with the current dialog/menu primitives                                                                                                                                                                   |
| open    | `data/docs/chat-sdk/react/v14/04-guides/15-audio-playback.md`                                      | Still uses removed `FileIcon` props like `big` and `size`                                                                                                                                                                                                    |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/01-message_input.md`               | Needs alignment with the current `MessageComposer`-based edit flow, the redesigned `str-chat__message-composer*` markup, and the new shared preview stack                                                                                                    |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/04-input_ui.md`                    | Still teaches the removed `Channel Input={...}` override path and uses an outdated pre-v14 composer composition example                                                                                                                                      |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/08-attachment-selector.md`         | Still uses the removed `Channel AttachmentSelector={...}` override path and does not reflect the redesigned action/button/commands model                                                                                                                     |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/05-ui_components.md`               | Still documents `VoiceRecordingPreview` instead of the dedicated `VoiceRecordingPreviewSlot` model and still says `LinkPreviewList` has no props                                                                                                             |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/02-link-previews.md`                 | Still uses the removed `Channel LinkPreviewList={...}` override path and describes a stale `LinkPreviewList` prop model/default behavior                                                                                                                     |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/03-attachment_previews.md`           | Still describes the old attachment-preview model with `VoiceRecordingPreview` inside the list                                                                                                                                                                |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/02-image_gallery.md`                    | Still uses the old `GalleryProps` model and needs migration to the new gallery APIs                                                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/01-getting_started.md`                              | Still targets old header selectors like `.str-chat__header-hamburger`                                                                                                                                                                                        |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/13-date_separator.md`                    | Still documents `position` / `unread` as active default behavior even though the current separator no longer renders lines or unread-prefixed text                                                                                                           |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/09-channel_header.md`                                 | Still renders old livestream/header markup that no longer matches current `ChannelHeader`                                                                                                                                                                    |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/01-chat.md`                                 | Still documents `initialNavOpen` without the new `initialNavOpenResponsive` behavior                                                                                                                                                                         |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/01-channel_list.md`                 | Should explain that first-load and pagination sizes depend on explicit `options.limit` rather than the old SDK-managed defaults                                                                                                                              |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md`                                   | Still documents the old `TypingIndicatorProps` shape, including a removed `Avatar` prop                                                                                                                                                                      |
| open    | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-input/07-typing_indicator.md`              | Custom typing-indicator example still targets the pre-v14 prop contract                                                                                                                                                                                      |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/03-message_bounce_context.md`            | Still implements custom bounce prompts with a removed `onClose` prop                                                                                                                                                                                         |
| open    | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-input/07-audio_recorder.md`              | Still documents the old permission-denied notification customization surface and still teaches removed `Channel` override props for audio-recorder UI components                                                                                             |
| open    | `data/docs/chat-sdk/react/v14/04-guides/04-typescript_and_custom_data_types.md`                    | Still warns that default components expect `subtitle`, which no longer matches the default `ChannelHeader` behavior                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md`             | Custom message example still implies the SDK injects `MessageUIComponentProps` directly into the override component                                                                                                                                          |
| open    | `data/docs/chat-sdk/react/v14` (multiple pages)                                                    | Many examples still pass UI override props directly to `Channel`; these need migration to `WithComponents` or other current APIs                                                                                                                             |

## Breaking Change Workflow

1. Diff `v13.14.2..master` in `stream-chat-react`.
2. Confirm whether the change affects imports, props, hooks, context values, override keys, CSS selectors, or behavior relied on by integrators.
3. Record the item in `breaking-changes.md` with evidence.
4. Record the affected v14 docs pages in `docs-plan.md`.
5. Once the inventory is complete enough, update the specific docs pages and fold the item into the migration guide with a before/after example if needed.

## Verification

- Docs shell: `npm run check` in `/Users/oliverlaz/w/repos/stream-chat-sdks/docs`
- Docs shell: `npm run build` in `/Users/oliverlaz/w/repos/stream-chat-sdks/docs`
- React SDK spot-checks as needed while verifying API claims

## Open Questions

- How many CSS/class name changes need explicit migration guidance versus a short warning for custom theming users?
- Which redesign items changed public override points versus only internal markup?
