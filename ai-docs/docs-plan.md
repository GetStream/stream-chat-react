# React v14 Docs Plan

Last updated: 2026-04-16

## Goal

Produce a reliable v13 to v14 migration guide for `stream-chat-react` and keep the v14 docs set aligned with the current source while the release is still in progress.

## Current Phase

- Phase: post-snapshot docs maintenance against audited head `a41311edd9caf6f828bdaf1d8fb071c44d0ca0f1`
- Constraint: keep `breaking-changes.md` as the source of truth for confirmed migration items, but treat this file as the execution tracker for the remaining v14 docs work
- Migration-guide and sidebar work is already in flight on `docs-content#1080`; keep the guide aligned with new SDK changes until that PR is merged
- New SDK changes after the audited head should be mined from `a41311edd9caf6f828bdaf1d8fb071c44d0ca0f1..HEAD`, then folded back into both trackers before related docs edits are made

## Working Baseline

- Code baseline for analysis: `stream-chat-react` `v13.14.2..master`
- Current audited SDK head: `a41311edd9caf6f828bdaf1d8fb071c44d0ca0f1` (`a41311edd`, `2026-04-16`, `chore(release): enable stable releases for v14 (#3121)`)
- Future mining starting point: review `stream-chat-react` diff `a41311edd9caf6f828bdaf1d8fb071c44d0ca0f1..HEAD`, then map any confirmed changes back to `v13.14.2` before updating `breaking-changes.md` and this file
- Docs content repo: `/docs/data/docs`
- Docs content branch: `react-chat-v14`
- Active migration-guide PR: `docs-content#1080` (`docs/react-v14-migration-guide` -> `react-chat-v14`)
- Site shell repo: `/docs`

## Working Rules

- Treat source code as the primary evidence for migration items.
- Use PR titles, changelog notes, and `BREAKING CHANGE` labels only as secondary coverage checks.
- Add an entry to `breaking-changes.md` only after the change is confirmed in code.
- Keep `docs-plan.md` and `breaking-changes.md` in `stream-chat-react/ai-docs`.
- The coordinator owns tracker updates, merge order, and final verification.
- Feature branches/worktrees should only edit assigned docs pages; do not have multiple agents update this tracker file in parallel.
- Run parallel work only when file overlap is low and the shared v14 patterns for that area have already been established.
- Keep the migration guide focused on integrator-facing changes, not internal refactors.
- Keep the existing page writing style and section structure where practical; update stale details and code snippets instead of turning reference pages into migration guides.
- Keep `Best Practices` near the top of the page whenever the page already has that section.
- Do not add `What is new in v14` sections to the v14 docs set. Version-to-version migration framing belongs in the dedicated migration guide.

## Deliverables

- `stream-chat-react/ai-docs/breaking-changes.md`
- `stream-chat-react/ai-docs/docs-plan.md`
- v13 to v14 migration guide in the React v14 docs set
- Updated v14 reference pages for any confirmed breaking changes
- Updated v14 sidebar entry and naming

## Execution Model

- Coordinator:
  - updates `ai-docs/breaking-changes.md` and `ai-docs/docs-plan.md`
  - assigns page batches
  - merges workstreams in order
  - runs stale-pattern sweeps and final docs verification
- Feature agents:
  - work in separate branches/worktrees based on `react-chat-v14`
  - edit only their assigned docs pages
  - do not update the shared tracker files directly
- Merge order:
  1. establish the canonical v14 customization patterns
  2. run low-overlap feature batches in parallel
  3. do a cross-cutting example/stale-reference sweep
  4. run docs verification

## Workstreams

| Workstream                                       | Scope                                                                                                                               | Primary issues                               | Seed pages                                                                                                                                                                                                                                    | Parallelizable | Blocked by                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------ |
| WS1: Core customization surfaces                 | lock the canonical v14 patterns for `WithComponents`, `Channel`, `ComponentContext`, `MessageActions`, and custom message overrides | 6, 10, 11, 16, 30, 33                        | `02-ui-components/04-channel/01-channel.md`, `02-ui-components/04-channel/05-component_context.md`, `05-experimental-features/01-message-actions.md`, `04-guides/16-ai-integrations/02-chat-sdk-integration.md`                               | no             | none                                 |
| WS2: Message and message-list                    | message UI/context/hooks, reactions, polls, read-state, notifications, date separator                                               | 5, 7, 12, 14, 15, 21, 29, 35                 | `02-ui-components/08-message/*`, `04-guides/05-channel_read_state.md`, `04-guides/13-notifications.md`                                                                                                                                        | yes            | WS1 patterns should be settled first |
| WS3: Composer, attachments, dialogs, media       | message-composer, cooldown, suggestion list, attachments, gallery, modal/dialogs, file/media, bounce/audio permission flows         | 8, 9, 13, 19, 20, 22, 23, 26, 28, 31, 38, 39 | `02-ui-components/09-message-composer/*`, `02-ui-components/16-modal.md`, `04-guides/10-dialog-management.md`, `04-guides/15-audio-playback.md`, attachment/gallery cookbooks                                                                 | yes            | WS1 patterns should be settled first |
| WS4: Layout, headers, lists, threads, indicators | avatar, channel header, chat/sidebar state, channel preview, thread header/list, ChatView, indicators, styling drift                | 17, 18, 24, 25, 27, 34, 36, 37, 40, 41, 42   | `02-ui-components/03-chat/01-chat.md`, `02-ui-components/04-channel/02-channel_header.md`, `02-ui-components/05-channel-list/*`, `02-ui-components/06-thread-list/*`, `02-ui-components/11-chat-view.md`, `02-ui-components/12-indicators.md` | yes            | WS1 patterns should be settled first |
| WS5: Cross-cutting sweep                         | migration/install copy, old selector cleanup, old `Channel X={...}` examples, renamed export cleanup                                | 1, 2, 11, 24, 32, plus residual grep sweeps  | `01-basics/02-installation.md`, `06-release-guides/01-upgrade-to-v14.md`, `02-ui-components/01-getting_started.md`, remaining cookbook/example pages                                                                                          | after WS1-WS4  | outputs of WS1-WS4                   |

## Parallelization Rules

- Safe parallel split after WS1:
  - one agent on WS2
  - one agent on WS3
  - one agent on WS4
- Keep one coordinator outside those branches to:
  - update this tracker
  - review overlap
  - run stale-pattern sweeps such as `MessageOptions`, `ReactionsListModal`, `QuotedPoll`, `ScrollToBottomButton`, `MessageNotification`, `useCooldownTimer`, `EditMessageModal`, `Avatar image=`, and `Channel [A-Z].*=`
- Do not parallelize:
  - tracker-file edits
  - migration-guide ownership
  - the final stale-reference sweep
  - the final docs verification run

## Completed Batch: WS1

Objective: lock the canonical v14 customization patterns before the broader docs sweep starts. This batch should establish the docs language for `WithComponents`, current `ChannelProps`, current `ComponentContext`, stable `MessageActions`, and the rule that custom message overrides must read SDK state from hooks/context instead of assuming prop injection.

Current local status: all four WS1 pages have active working-tree edits. The current pass follows the v14 editorial guardrails above: keep `Best Practices` near the top, preserve the existing docs voice, and avoid adding version-comparison sections inside the reference pages.

### WS1 Page List

| Order | Page                                                                                   | Issues covered | Primary outcome                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md`          | 5, 16          | replace the old `MessageOptions` / `MessageActionsBox` model with the stable `MessageActions` + `messageActionSet` + `ContextMenu` model |
| 2     | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md`     | 10, 11, 16     | fully reconcile override keys with current `ComponentContextValue` and remove dead override paths                                        |
| 3     | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md`               | 6, 11, 33      | rewrite the page around actual `ChannelProps`, `WithComponents`, `EmptyPlaceholder`, and explicit query-limit guidance                   |
| 4     | `data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md` | 30             | stop implying the SDK injects `MessageUIComponentProps` into custom message overrides                                                    |

### WS1 Acceptance Criteria

- `MessageActions` is documented only as the stable v14 surface.
- WS1 pages no longer teach `MessageOptions`, `MessageActionsBox`, `MessageActionsWrapper`, or `CustomMessageActionsList`.
- WS1 pages no longer teach `Channel Message={...}`, `Channel Input={...}`, `Channel Modal={...}`, `Channel ThreadHeader={...}`, or similar dead override props unless the prop still exists in current source.
- `Channel` docs explain `WithComponents` as the primary override path and mention `EmptyPlaceholder={null}` for preserving the old blank-state behavior.
- `Channel` docs no longer imply the SDK provides the old default initial message/query limits.
- custom-message examples in WS1 do not type the override as SDK-injected `MessageUIComponentProps`; they should pull message/grouping state from `useMessageContext()` or other current hooks.

### WS1 Completion Sweep

Run these sweeps before marking WS1 done:

- `rg -n "MessageOptions|MessageActionsBox|MessageActionsWrapper|CustomMessageActionsList" data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md`
- `rg -n "Channel [A-Z][A-Za-z]+=" data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md`
- `rg -n "MessageUIComponentProps|groupedByUser|firstOfGroup|endOfGroup" data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md`

### WS1 Exit Condition

Once the WS1 pages are merged and the sweep is clean:

- mark `WS1` done in the checklist
- update the `partial` entries for `01-channel.md` and `05-component_context.md`
- then fan out WS2, WS3, and WS4 in parallel

Local note: the WS1 rewrites have been completed in the current working tree and the targeted stale-pattern sweeps passed. Until those edits are committed or merged, continue treating WS1 as the baseline pattern source for later batches.

## Completed Batch: WS2

Objective: align the message and read-state docs with the current v14 message surface, including `MessageContext`, message UI composition, reactions, polls, date separators, and the current unread/new-message notification model.

Current local status: WS2 is complete in the working tree. The following pages were rewritten in this batch:

- `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/01-message_list.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/02-virtualized_list.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/03-message_list_context.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/04-virtualized_message_list_context.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/05-thread.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/01-message.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/03-message_bounce_context.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/04-message_hooks.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/05-message_ui.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/09-base-image.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/10-poll.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/12-reactions.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/13-date_separator.md`
- `data/docs/chat-sdk/react/v14/04-guides/05-channel_read_state.md`
- `data/docs/chat-sdk/react/v14/04-guides/13-notifications.md`

WS2 exit note:

- the targeted stale-pattern sweeps are clean for the rewritten message and message-list pages
- the remaining stale hits under `08-message/11-attachment/*` are intentionally deferred to WS3

WS2 guardrails:

- keep `Best Practices` near the top when the page already has that section
- do not add version-comparison sections such as `What is new in v14`
- keep message customization examples aligned with `WithComponents`, `MessageList`, `Thread`, and `VirtualizedMessageList`
- treat `11-attachment/*` as WS3 scope even though it sits inside the `08-message` docs tree

## Completed Batch: WS4

Objective: align the chat layout, headers, channel-list, thread-list, thread-header, and indicator docs with the current v14 UI and behavior.

WS3 exit note:

- the composer, dialog, media, attachment, gallery, link-preview, attachment-preview, and suggestion-list docs are now rewritten to current v14 patterns
- targeted stale-pattern sweeps are clean for the WS3 pages
- the remaining open work is now concentrated in chat layout, headers, channel previews, thread surfaces, avatar docs, and styling examples

Completed WS3 pages:

- `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/01-message_composer.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/02-message_composer_context.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/03-message_composer_hooks.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/04-input_ui.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/05-ui_components.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/07-audio_recorder.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/08-attachment-selector.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/01-input_ui.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/16-modal.md`
- `data/docs/chat-sdk/react/v14/04-guides/10-dialog-management.md`
- `data/docs/chat-sdk/react/v14/04-guides/15-audio-playback.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/02-voice-recording.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/02-link-previews.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/03-attachment_previews.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/06-suggestion_list.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/01-attachment_actions.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/02-image_gallery.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/03-geolocation_attachment.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/05-payment_attachment.md`

WS4 exit note:

- the chat layout, header, channel-list, thread-list, thread-header, and indicator docs are now aligned with the current v14 behavior
- targeted stale-pattern sweeps are clean for the rewritten WS4 pages
- the remaining open work from this area is residual cross-cutting cleanup, mainly older avatar examples outside the WS4 page set

Completed WS4 pages:

- `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/01-chat.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/01-channel_list.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/06-channel-list-infinite-scroll.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/06-thread-list/01-thread-list.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/08-message/08-avatar.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/02-channel-list/01-channel_list_preview.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/07-typing_indicator.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/09-channel_header.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/10-thread_header.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/01-getting_started.md`

## Completed Batch: WS5

Objective: finish the cross-cutting sweep for residual stale examples, installation/typescript copy, and remaining old override patterns that were intentionally deferred while WS1 through WS4 were being rewritten.

WS5 exit note:

- the remaining message cookbooks, installation/typescript guidance, and repo-wide override-example sweep are now aligned with the current v14 docs patterns
- the remaining `Channel X={...}` hits in the v14 docs tree are supported props such as `EmptyPlaceholder`, not stale SDK UI override paths
- the only intentionally retained legacy names are in the theming variables table, where the CSS token groups still follow historical `stream-chat-css` folder names

Completed WS5 pages:

- `data/docs/chat-sdk/react/v14/01-basics/02-installation.md`
- `data/docs/chat-sdk/react/v14/02-ui-components/02-theming/03-component-variables.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/02-reactions.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/05-pin_indicator.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/06-system_message.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/04-giphy_preview.md`
- `data/docs/chat-sdk/react/v14/03-ui-cookbook/07-emoji_picker.md`
- `data/docs/chat-sdk/react/v14/04-guides/04-typescript_and_custom_data_types.md`
- `data/docs/chat-sdk/react/v14/04-guides/11-blocking-users.md`
- `data/docs/chat-sdk/react/v14/04-guides/12-message-reminders.md`
- `data/docs/chat-sdk/react/v14/04-guides/14-location-sharing.md`

## Active Batch: Verification

Objective: run docs verification and fix any markdown/build issues that surface from the updated post-`a41311ed` v14 content set.

Post-snapshot maintenance currently in scope:

- the `78934929..a41311ed` follow-up window is now folded into the public docs
- `BC-017` now captures the built-in `download` action addition inside the current `MessageActions` surface
- the next maintenance pass should start from `a41311ed..HEAD`, then rerun docs verification after any new docs edits

## Confirmed Docs Issues

### 1. v14 sidebar still exposes the old upgrade guide title

- Status: in PR
- Evidence: `data/docs/_sidebars/[chat-sdk][react][v14-rc].json` still labels the page as `Upgrade to v13`
- Expected fix: rename the nav item and ensure the slug/file name match the actual v13 to v14 migration guide; work is currently staged in `docs-content#1080`

### 2. v14 release guide file is still the inherited v13 guide

- Status: in PR
- Evidence: `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v13.md` starts with `Removal of StreamChatGenerics`
- Expected fix: replace with a real v13 to v14 migration guide; work is currently staged in `docs-content#1080`

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

- Status: resolved
- Evidence:
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md` now reflects the current deleted-message, message-status, and message-text surfaces
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/05-message_ui.md` now reflects the current message UI composition
  - `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md` now reflects the stable `MessageActions` surface
- Expected fix: replace or rewrite stale references to match current `MessageActions`, `MessageDeletedBubble`, and `VirtualMessage` guidance

### 6. v14 Channel docs still present component overrides as `Channel` props

- Status: resolved
- Evidence:
  - `v13.14.2:src/components/Channel/Channel.tsx` forwarded many component overrides through `Channel`
  - current `src/components/Channel/Channel.tsx` no longer defines that forwarded override surface in `ChannelProps`
  - current `Channel` also defaults `EmptyPlaceholder` to `EmptyStateIndicator` instead of rendering nothing when no channel is active
  - `src/context/WithComponents.tsx` and `README.md` now point to `WithComponents` for overrides
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` now keeps `Channel` focused on actual behavior/data props and sends SDK UI override guidance to `WithComponents`
- Expected fix: decide whether to rewrite the page around actual `ChannelProps` and move override guidance to `ComponentContext` / `WithComponents`, or clearly split the concepts in docs; also document the new `EmptyPlaceholder={null}` opt-out for the old blank state behavior

### 7. v14 MessageContext docs still document removed edit-state and custom-action fields

- Status: resolved
- Evidence:
  - current `src/context/MessageContext.tsx` removed `clearEditingState`, `editing`, `handleEdit`, `setEditingState`, `additionalMessageInputProps`, and `customMessageActions`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md` now reflects the current context contract
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/05-message_ui.md` now points readers to the current edit flow
- Expected fix: rewrite the MessageContext docs around the current contract and point edit flows to `MessageComposer`

### 8. v14 MessageInputContext docs still document cooldown state in context

- Status: resolved
- Evidence:
  - current `src/context/MessageInputContext.tsx` no longer composes cooldown timer state
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/02-message_composer_context.md` now points readers to dedicated cooldown helpers
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/01-input_ui.md` now reads cooldown through `useCooldownRemaining()`
- Expected fix: update docs to use the dedicated cooldown hooks

### 9. v14 attachment docs still document the old gallery/image override surface

- Status: resolved
- Evidence:
  - current `src/components/Attachment/Attachment.tsx` exposes `ModalGallery` instead of `Gallery`
  - current attachment rendering no longer uses separate `gallery` / `image` grouping in the old way
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md` now documents the current `Attachment` grouping, `Image` / `Media` / `ModalGallery` split, and supported override points
- Expected fix: rewrite the Attachment page to match current `AttachmentProps` and render grouping

### 10. v14 ComponentContext docs are still only partially aligned with the current override keys

- Status: resolved
- Evidence:
  - current `src/context/ComponentContext.tsx` removed or renamed several keys
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` now mirrors the current `ComponentContextValue` key set and directs readers toward `WithComponents`
- Expected fix: fully reconcile the page with the current `ComponentContextValue`

### 11. many v14 docs examples still pass component overrides directly to `Channel`

- Status: resolved
- Evidence:
  - current `ChannelProps` no longer expose the old forwarded override surface
  - the remaining `rg` hits in `data/docs/chat-sdk/react/v14` are supported `Channel` props such as `EmptyPlaceholder`, not stale UI override props
  - WS1 through WS5 moved cookbook and guide examples to `WithComponents` or current local prop surfaces where appropriate
- Expected fix: migrate examples to `WithComponents` / `ComponentContext` where appropriate, and only keep direct `Channel` props where they still exist in current source

### 12. v14 message-list docs still describe `MessageNotification` and `ScrollToBottomButton`

- Status: resolved
- Evidence:
  - current `stream-chat-react` exports `NewMessageNotification` and `ScrollToLatestMessageButton` instead
  - current `UnreadMessagesSeparator` defaults `showCount` to true and adds a mark-read button
  - current `ScrollToLatestMessageButton` uses different markup/classes than the old floating action button, and the old `--str-chat__jump-to-latest-message-*` CSS variables were removed
  - `data/docs/chat-sdk/react/v14/04-guides/05-channel_read_state.md` now documents the current unread and new-message surfaces
  - `data/docs/chat-sdk/react/v14/04-guides/13-notifications.md` now describes the current `MessageListNotifications` contract
  - `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/03-message_list_context.md` and `04-virtualized_message_list_context.md` now reflect the current context values
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` now lists `NewMessageNotification`
- Expected fix: rewrite message-list notification docs around `NewMessageNotification`, `ScrollToLatestMessageButton`, the simplified `MessageListNotifications` contract, and the current unread-separator/scroll-button behavior

### 13. v14 edit-message and cooldown docs still describe removed form/modal and hook APIs

- Status: resolved
- Evidence:
  - current source removed `EditMessageForm`, `EditMessageModal`, `useEditHandler`, `useCooldownTimer`, and prop-driven `CooldownTimer`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` and `05-component_context.md` no longer document the removed edit-form/modal surfaces and instead point readers to the current composer override paths
- Expected fix: rewrite edit-message docs around `MessageComposer` / `EditedMessagePreview`, and cooldown docs around `CooldownTimer`, `useCooldownRemaining`, and `useIsCooldownActive`

### 14. v14 reactions docs still describe `ReactionsListModal` and the old `ReactionSelector` prop surface

- Status: resolved
- Evidence:
  - current source exports `MessageReactionsDetail` instead of `ReactionsListModal`
  - current `ReactionSelectorProps` no longer accepts `reactionOptions` and the older display/data props
  - current `MessageReactionsDetail` is dialog content with renamed classnames, not a modal component with the old `str-chat__message-reactions-details*` structure
  - current `ReactionSelector` markup/classes changed substantially from the old tooltip/avatar/count layout
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/02-reactions.md` now uses `WithComponents`, `MessageReactionsDetail`, and the current shared `reactionOptions` contract
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md` now wires reactions through `WithComponents` and current `ComponentContext` usage
- Expected fix: update reactions docs to the current `MessageReactionsDetail` naming, the narrowed `ReactionSelector` props, the current reaction-options shape, and the new selector/detail markup expectations

### 15. v14 poll docs still describe `QuotedPoll`, `Poll.isQuoted`, and old poll-action component names

- Status: resolved
- Evidence:
  - current source removed `QuotedPoll` and `Poll.isQuoted`
  - current source renamed direct poll-action exports to `AddCommentPrompt`, `EndPollAlert`, and `SuggestPollOptionPrompt`
  - current poll dialog subcomponents no longer receive `close` props directly and now rely on modal context/dialog primitives
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/10-poll.md` now points users to the current quoted-message surfaces instead of a dedicated `QuotedPoll`
- Expected fix: rewrite poll docs around the current `Poll` / `PollActions` surface and remove quoted-poll guidance that no longer maps to exported APIs

### 16. v14 MessageActions docs still describe the removed wrapper/box/custom-actions surface

- Status: resolved
- Evidence:
  - current source removed `MessageActionsBox`, `MessageActionsWrapper`, and `CustomMessageActionsList`
  - current `MessageActions` uses `messageActionSet`, quick actions, and `ContextMenu`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md` now uses `defaultMessageActionSet`, `MessageActions`, and `WithComponents`
- Expected fix: replace the legacy docs model with current `MessageActions`, action-set items, and `ContextMenu`-based customization

### 17. v14 avatar docs and examples still use the v13 avatar prop names and helper assumptions

- Status: resolved
- Evidence:
  - current `AvatarProps` use `imageUrl`, `userName`, `isOnline`, and required `size`
  - current channel/group avatar rendering expects `displayMembers` and computes overflow internally
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/08-avatar.md` now documents the current prop names, `ChannelAvatar`, and the helper-based channel display image/title flow
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/10-thread_header.md` and `03-ui-cookbook/05-message-composer/06-suggestion_list.md` now use the current `Avatar` prop names
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md` and `03-ui-cookbook/04-message/06-system_message.md` now use the current `Avatar` prop names too
- Expected fix: finish the remaining avatar-using cookbook examples outside the WS4 page set

### 18. v14 ChannelHeader docs still document the removed `live` prop

- Status: resolved
- Evidence:
  - current `ChannelHeaderProps` no longer expose `live`
  - current default `ChannelHeader` no longer renders `channel.data.subtitle`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md` now documents the current title, avatar, typing-subtitle, and status behavior and shows a custom-header pattern for subtitle-heavy layouts
- Expected fix: remove `live` guidance, stop implying `channel.data.subtitle` is rendered by default, and document the current header behavior plus the need for a custom header if livestream or subtitle metadata is still required

### 19. v14 modal/dialog docs still mix legacy `Modal` usage with stale component-override patterns

- Status: resolved
- Evidence:
  - current public modal component is `GlobalModal`; the old `Modal` component is no longer exported
  - current `GlobalModal` no longer renders the legacy `.str-chat__modal__inner` wrapper
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md`, `05-component_context.md`, `16-modal.md`, and `04-guides/10-dialog-management.md` now align with the current `WithComponents` and dialog model
- Expected fix: rewrite the modal docs around `GlobalModal` and current dialog primitives, mention the removed inner wrapper, then reconcile any remaining modal override guidance with the actual v14 customization surface

### 20. v14 FileIcon docs still use the old prop API

- Status: resolved
- Evidence:
  - current `FileIconProps` expose `fileName`, `mimeType`, and `className` only
  - `data/docs/chat-sdk/react/v14/04-guides/15-audio-playback.md` now uses the current `FileIcon` prop surface
- Expected fix: update examples to the current `FileIcon` API

### 21. v14 message status docs still mention removed standalone status-icon exports

- Status: resolved
- Evidence:
  - current message status UI renders shared `Icons` components instead of exporting `MessageDeliveredIcon` / `MessageSentIcon`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md` now points users to `MessageStatus` and the current shared icon surface
- Expected fix: rewrite the status-icon guidance around `MessageStatus` and the current shared icon set

### 22. v14 message-input attachment preview docs still describe the old preview-list and voice-recording model

- Status: resolved
- Evidence:
  - current `AttachmentPreviewListProps` no longer include `VoiceRecordingPreview`
  - current `MessageInputFlat` renders `VoiceRecordingPreviewSlot` separately above `AttachmentPreviewList`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/03-attachment_previews.md` now reflects the current preview split between `AttachmentPreviewList`, `VoiceRecordingPreviewSlot`, and `LinkPreviewList`
- Expected fix: rewrite the attachment preview docs around the current audio/video preview prop types and the separate `VoiceRecordingPreviewSlot`

### 23. v14 gallery docs still describe the old `Gallery` and `ModalGallery` APIs

- Status: resolved
- Evidence:
  - current `GalleryProps` use `items`, `GalleryUI`, `initialIndex`, `onIndexChange`, and `onRequestClose`
  - current `ModalGalleryProps` use `items` instead of `images` / `index`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/02-image_gallery.md` now explains the `ModalGallery` override path and the lower-level `Gallery` provider split
- Expected fix: rewrite gallery docs around the provider-style `Gallery` plus the new `ModalGallery` prop contract

### 24. v14 styling docs still target pre-v14 DOM/class structures

- Status: resolved
- Evidence:
  - current `ChannelHeader`, `MessageInputFlat`, and `Avatar` markup/classes changed substantially in v14
  - `data/docs/chat-sdk/react/v14/02-ui-components/01-getting_started.md` now uses the current header toggle selector
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/09-channel_header.md` now renders a custom header against the current `ChannelHeader` patterns instead of stale livestream markup
- Expected fix: rewrite CSS snippets and customization examples against the current header/composer/avatar markup and steer users toward the current styling/token layer

### 25. v14 Chat docs briefly documented an extra responsive sidebar-state prop during the RC cycle

- Status: resolved
- Evidence:
  - during the RC cycle, `ChatProps` briefly exposed a second responsive sidebar-state prop alongside `initialNavOpen`
  - the docs temporarily reflected that RC-only behavior
  - the final docs were later rewritten back to the current single-prop `initialNavOpen` API
- Expected fix: keep the docs aligned with the final released `Chat` API and avoid documenting temporary RC-only sidebar-state props

### 26. v14 attachment docs do not cover the low-level attachment-container/export churn

- Status: resolved
- Evidence:
  - current `AttachmentContainer` exports now include `GiphyContainer`, `OtherFilesContainer`, and `VideoContainer`
  - current `MediaContainer` expects `attachments`, and `GalleryAttachment` now uses `items`
  - `CardAudio` is no longer re-exported from the package root
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md` now points users toward the supported v14 attachment override points
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/02-image_gallery.md` now distinguishes between `ModalGallery` and the lower-level `Gallery` provider
- Expected fix: add migration guidance for low-level custom attachment renderers and keep the attachment docs focused on supported override points in v14

### 27. v14 typing indicator docs still document the old prop contract

- Status: resolved
- Evidence:
  - current `TypingIndicatorProps` use `scrollToBottom`, optional `isMessageListScrolledToBottom`, and `threadList`
  - current `TypingIndicator` no longer exposes an `Avatar` prop and now renders `AvatarStack`
  - `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md` now documents the current `TypingIndicator` and `TypingIndicatorHeader` split plus the current prop shape
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/07-typing_indicator.md` now builds against the current `TypingIndicatorProps` contract
- Expected fix: rewrite typing-indicator docs around the current prop contract and scroll behavior

### 28. v14 message bounce and audio-recorder permission docs still document removed close props

- Status: resolved
- Evidence:
  - current `MessageBouncePromptProps` no longer expose `onClose` and now close via `useModalContext()`
  - current `RecordingPermissionDeniedNotificationProps` no longer expose `onClose`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/03-message_bounce_context.md` now documents the current bounce-prompt flow
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/07-audio_recorder.md` now documents the permission notification as SDK-managed dialog content
- Expected fix: rewrite these docs around modal context or the current parent-managed flow instead of explicit close props

### 29. v14 message status and message text docs still describe removed props and old default behavior

- Status: resolved
- Evidence:
  - current `MessageStatusProps` no longer expose `Avatar`, and the default read/sent/delivered states no longer use the old avatar-plus-standalone-icons model
  - current `MessageTextProps` no longer expose `theme`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md` now documents the current `MessageStatus`, `MessageText`, and `MessageBouncePrompt` contracts
- Expected fix: reconcile the message UI-components page with the current `MessageStatus`, `MessageText`, and `MessageBouncePrompt` contracts

### 30. v14 custom-message docs still imply the SDK injects `MessageUIComponentProps` into overrides

- Status: resolved
- Evidence:
  - current `src/components/Message/Message.tsx` renders `<MessageUIComponent />` and no longer passes `groupedByUser` or other SDK-owned props directly into the override component
  - current `MessageContext` still exposes grouping state via `useMessageContext()`
  - `data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md` now reads message state from `useMessageContext()` and no longer implies direct SDK prop injection
- Expected fix: document that custom message overrides should read SDK state from `useMessageContext()` and simplify examples so they do not imply direct prop injection

### 31. v14 suggestion-list docs still describe a stale `AutocompleteSuggestionItem` customization model

- Status: resolved
- Evidence:
  - current `src/components/TextareaComposer/SuggestionList/SuggestionList.tsx` and `SuggestionListItem.tsx` drive suggestion items through the current button-based `SuggestionListItem` contract
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/06-suggestion_list.md` now uses `SuggestionList`, `defaultComponents`, `SuggestionItemProps`, and `WithComponents`
- Expected fix: rewrite the suggestion-list cookbook around the current `SuggestionListItem` contract, current keyboard-selection flow, and the v14 override path

### 32. v14 installation and migration docs do not call out the newer `stream-chat` minimum

- Status: resolved
- Evidence:
  - current `stream-chat-react/package.json` requires `stream-chat@^9.35.0`
  - v13 baseline required only `stream-chat@^9.27.2`
  - `data/docs/chat-sdk/react/v14/01-basics/02-installation.md` now calls out the current `stream-chat` minimum and tells users to upgrade both packages together
- Expected fix: mention the new `stream-chat` minimum in the migration guide and add a short version-alignment note to installation docs

### 33. v14 Channel and ChannelList docs still imply old SDK-managed initial query defaults

- Status: resolved
- Evidence:
  - current `Channel` no longer injects a default initial `messages.limit` into `channelQueryOptions`
  - current `ChannelList` no longer relies on the old internal max query limit when deciding first-load behavior
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md` now tells users to set `channelQueryOptions` explicitly when they care about initial limits
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/01-channel_list.md` and `05-channel-list/06-channel-list-infinite-scroll.md` now tell users to set `options.limit` explicitly for first-load and infinite-scroll behavior
- Expected fix: document that consumers should set `channelQueryOptions.messages.limit` and `ChannelList` `options.limit` explicitly when they care about first-load size or pagination consistency

### 34. v14 TypeScript custom-data docs still imply default components rely on `subtitle`

- Status: resolved
- Evidence:
  - current `DefaultChannelData` still includes `subtitle`, but the current default `ChannelHeader` no longer renders `channel.data.subtitle`
  - `data/docs/chat-sdk/react/v14/04-guides/04-typescript_and_custom_data_types.md` now narrows the warning to the remaining helpers/defaults that still rely on `image` and `name`
- Expected fix: narrow the warning so it reflects which default components still actually rely on `DefaultChannelData` fields in v14

### 35. v14 DateSeparator docs still describe the old `position` / `unread` rendering model

- Status: resolved
- Evidence:
  - current `DateSeparator` no longer renders separator lines or the old `New - ...` unread prefix
  - current `DateSeparator` adds `className` and `floating`, while `position` / `unread` are effectively legacy placeholders in the default implementation
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/13-date_separator.md` now explains the current default separator behavior and when to supply a custom separator
- Expected fix: rewrite the page around the current default separator behavior, mention `floating`, and tell users to provide a custom `DateSeparator` if they still need unread prefixes or left/center/right line layouts

### 36. v14 thread docs still describe the old `ThreadHeader` behavior and override path

- Status: resolved
- Evidence:
  - current `ThreadHeader` no longer accepts `overrideImage`
  - current default `ThreadHeader` subtitle can show `threadDisplayName · replyCount` or typing state, and the close button is conditional in the newer thread-instance flow
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/10-thread_header.md` now documents the current subtitle and close-button behavior, uses current `Avatar` props, and mounts overrides through `WithComponents`
- Expected fix: update thread docs to the current `ThreadHeader` contract, remove the dead `Channel ThreadHeader={...}` path, and document the current default subtitle/close-button behavior

### 37. v14 channel preview docs still describe stale preview helpers, avatar defaults, removed status-icon exports, and old preview controls

- Status: resolved
- Evidence:
  - current `ChannelPreviewMessenger` defaults its `Avatar` prop to `ChannelAvatar`, not the plain `Avatar`
  - current `useChannelDisplayName()` can synthesize group/direct-message titles, and current `getChannelDisplayImage()` should be preferred over `channel.getDisplayImage()` for the old DM-image fallback behavior
  - current `ChannelPreviewMessenger` uses `aria-pressed`, `SummarizedMessagePreview`, `ChannelPreviewTimestamp`, muted-state modifiers, and the redesigned `str-chat__channel-preview-data*` layout
  - current `ChannelPreviewActionButtons` now use a `ContextMenu` plus DM-specific archive / non-DM mute actions instead of the old dedicated pin/archive buttons
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md` now documents the current preview defaults, helper functions, action-button behavior, and status guidance
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/02-channel-list/01-channel_list_preview.md` now uses the current display-title/image helpers and `aria-pressed` semantics
- Expected fix: rewrite the channel-preview docs around the current `ChannelPreviewMessenger` contract, current avatar/helper recommendations, current preview/action-button behavior, and current status-icon guidance

### 38. v14 AttachmentSelector docs still describe the pre-redesign selector contract

- Status: resolved
- Evidence:
  - current `AttachmentSelectorAction` now supports `id`, `Header`, `Submenu`, and `selectCommand`, and `AttachmentSelectorActionProps` now include submenu helpers
  - current default `AttachmentSelector` can add a commands submenu, filters out file upload actions when uploads are runtime-disabled, and disables the selector button during cooldown
  - current `SimpleAttachmentSelector` no longer uses the old `str-chat__file-input-container` / `str-chat__file-input-label` markup
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/08-attachment-selector.md` now reflects the current action contract, filtering rules, and `WithComponents` override path
- Expected fix: rewrite the attachment-selector docs around `WithComponents`/current overrides, the expanded action contract, command submenu support, runtime upload filtering, and the redesigned selector button DOM

### 39. v14 link-preview docs still describe the old `LinkPreviewList` contract and default behavior

- Status: resolved
- Evidence:
  - current `LinkPreviewListProps` expose `displayLinkCount`, and the default list now renders only one preview unless overridden
  - current `LinkPreviewList` no longer suppresses previews while quoting and now renders inside the shared composer preview stack
  - current `LinkPreviewCard` renders optional thumbnails plus a URL row instead of the old icon-only card UI
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/02-link-previews.md` now documents `displayLinkCount`, the shared preview stack, and the `WithComponents` override path
- Expected fix: update link-preview docs to the current `LinkPreviewList` prop surface and default behavior, remove the stale `Channel` override path, and document how to wrap the default component when consumers want more than one preview or the old quote-mode behavior

### 40. v14 sidebar and thread-list docs still reference pre-redesign selectors and selection semantics

- Status: resolved
- Evidence:
  - current `ChannelListMessenger` removed `str-chat__channel-list-messenger-react` / `str-chat__channel-list-messenger-react__main` and now wraps the loading state inside `str-chat__channel-list-messenger__main`
  - current `ThreadListItemUI` uses `aria-pressed` plus the new summarized-preview layout instead of the old `aria-selected` / channel-parent-latest-reply DOM
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/06-channel-list-infinite-scroll.md` now points users at the current channel-list container selector and explicit `options.limit` guidance
  - `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md` now demonstrates `threadListItemUiProps={{ "aria-pressed": ... }}`
- Expected fix: update sidebar/thread-list docs to current selectors and button-state semantics, and add a brief warning that custom channel/thread list CSS based on the old default DOM must be audited in v14

### 41. v14 ChatView docs still describe `ThreadAdapter` as a pure `ThreadProvider` pass-through

- Status: resolved
- Evidence:
  - current `ChatView.ThreadAdapter` renders `EmptyStateIndicator` with `messageText="Select a thread to continue the conversation"` once thread state is ready and no thread is selected
  - current `ChatView` tests assert that placeholder behavior explicitly
  - `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md` and `02-ui-components/06-thread-list/01-thread-list.md` now explain the placeholder behavior and point users to `EmptyStateIndicator={() => null}` or manual `ThreadProvider` wiring when they want the older blank state
- Expected fix: update `ChatView` and thread-list docs to explain the new placeholder behavior and show how to keep the old blank state when needed by wiring `ThreadProvider` manually or overriding `EmptyStateIndicator`

### 42. v14 ChatView docs do not call out the new icon-only default for `ChatView.Selector`

- Status: resolved
- Evidence:
  - current `ChatView.Selector` now defaults `iconOnly` to `true`
  - current selector items render the visible `Channels` / `Threads` labels only when `iconOnly={false}`, otherwise the text moves into tooltip/`aria-label` behavior
  - `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md` now calls out the icon-only default and uses `iconOnly={false}` in the labeled-selector examples
- Expected fix: update the `ChatView` docs to call out the icon-only default and show `iconOnly={false}` as the migration path for apps that want the old labeled selector layout

### 43. v14 Search docs still describe removed `ChannelSearch` APIs

- Status: resolved
- Evidence:
  - `ChannelSearch` was removed from the public surface and `Search` was promoted to the main package entrypoint
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/01-channel_list.md` still documents `additionalChannelSearchProps` and `ChannelSearch`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/02-channel_list_context.md` still lists `ChannelSearch`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/05-channel_search.md` still documents the removed `ChannelSearch` component
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/02-channel-list/02-channel_search.md` still teaches `additionalChannelSearchProps` and direct `ChannelSearch` usage
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/08-app_menu.md` still teaches the removed `AppMenu` prop path on `ChannelSearch`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/08-advanced-search.md` should carry the restored SearchController/filter-builder guidance under the non-experimental docs tree
- Expected fix: rewrite the search docs around stable `Search`, `WithComponents`, `SearchBar`, `SearchResults`, and `SearchController`, and remove the old `ChannelSearch` / `additionalChannelSearchProps` guidance

### 44. v14 migration guide and sidebar still need the post-snapshot Search cleanup

- Status: resolved
- Evidence:
  - the current migration guide mentions `MessageActions` and `useAudioController`, but it does not yet explain that `Search` moved to the stable entrypoint and `ChannelSearch` was removed
  - the v14 sidebar still labels the search pages as `ChannelSearch`, `Channel Search`, and `Search` under the old pre-stable organization
- Expected fix: add Search migration coverage to `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md` and update `data/docs/_sidebars/[chat-sdk][react][v14-rc].json` titles to reflect the stable Search docs

### 45. v14 `Chat` docs still described a removed responsive-nav prop

- Status: resolved
- Evidence:
  - current `ChatProps` only expose `initialNavOpen`
  - current `useChat()` initializes sidebar state from `initialNavOpen` when provided and otherwise falls back to the SDK default open state
  - `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/01-chat.md` and `06-release-guides/01-upgrade-to-v14.md` still referenced a removed RC-only responsive-nav prop
- Expected fix: rewrite the `Chat` docs and migration guide to document `initialNavOpen` as the explicit initial-state prop and keep the note that channel selection only auto-collapses the sidebar on mobile-width viewports

### 46. v14 message UI docs still reference removed `MessageEditedTimestamp`

- Status: resolved
- Evidence:
  - current `stream-chat-react` exports `MessageEditedIndicator` and no longer exports `MessageEditedTimestamp`
  - current `MessageSimple` renders `MessageEditedIndicator` in message metadata
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md` still linked to the deleted `MessageEditedTimestamp` file
  - the migration guide did not yet call out the `MessageEditedTimestamp` -> `MessageEditedIndicator` replacement
- Expected fix: update the message UI docs and migration guide so edited-message metadata points to `MessageEditedIndicator`, and explain how to rebuild always-visible edited timestamps manually when needed

### 47. v14 notifications docs still treat `MessageListNotifications` as the client-notification surface

- Status: resolved
- Evidence:
  - at the `1227617b` audited snapshot, `NotificationList` was already the exported client-notification surface and was what `MessageList`, `VirtualizedMessageList`, `ChannelList`, and `ThreadList` used by default
  - the relevant docs pages were rewritten around that model before the later removal of `MessageListNotifications`
  - `data/docs/chat-sdk/react/v14/04-guides/13-notifications.md`, `04-guides/05-channel_read_state.md`, and the system-notifications cookbook still described the older `MessageListNotifications`-centric model
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` did not list the newer `NotificationList` override key
- Expected fix: rewrite the notifications/read-state docs around `NotificationList` and add the `NotificationList` override key to `ComponentContext`; the later full removal of `MessageListNotifications` is tracked separately in issue 56

### 48. v14 hook and image-fallback reference pages lag the current public API

- Status: resolved
- Evidence:
  - current message-input hooks export `useMessageContentIsEmpty`, not `useMessageCompositionIsEmpty`
  - current `BaseImage` defaults `showDownloadButtonOnError` to `false`
  - current `ComponentContext` exposes `ImagePlaceholder` as the low-level fallback override
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/03-message_composer_hooks.md` and `02-ui-components/08-message/09-base-image.md` still described the older names/defaults
- Expected fix: update the hook table to `useMessageContentIsEmpty`, update `BaseImage` docs to the current default download-button behavior, and document `ImagePlaceholder` as the preferred fallback override point

### 49. v14 date/time docs still imply the old default `MessageTimestamp` formatting

- Status: resolved
- Evidence:
  - current translation defaults format `MessageTimestamp` as `HH:mm`
  - `data/docs/chat-sdk/react/v14/04-guides/08-date-time-formatting.md` still described `MessageTimestamp` as calendar-formatted by default
  - the migration guide did not yet call out the time-only default
- Expected fix: update the date/time guide and migration guide so they describe the current `MessageTimestamp` default and show how to restore calendar formatting explicitly

### 50. v14 composer docs should reflect the current command-selected layout behavior

- Status: resolved
- Evidence:
  - current `MessageInputFlat` applies `str-chat__message-composer--command-active` when a slash command is selected
  - current `MessageInputFlat` hides the attachment selector slot and collapses `AdditionalMessageComposerActions` while a command is active
  - current `MessageComposerActions` no longer shows the audio-recording button while a command is selected
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/04-input_ui.md`, `05-ui_components.md`, `08-attachment-selector.md`, and `03-ui-cookbook/05-message-composer/01-input_ui.md` did not call out that default behavior
- Expected fix: update the message-input reference and cookbook pages so custom composer implementations know how the default command-selected layout behaves and which class hooks/components are involved

### 51. v14 preview docs should reflect the current native Giphy summary behavior

- Status: resolved
- Evidence:
  - current `useLatestMessagePreview()` returns `type: "giphy"` for native `giphy` attachments instead of folding them into `image`
  - current `QuotedMessagePreviewUI` renders a dedicated `Giphy` preview label and thumbnail handling for native `giphy` attachments
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md` and `03-ui-cookbook/02-channel-list/01-channel_list_preview.md` did not mention the `giphy` preview case
- Expected fix: update the channel-preview docs so custom summary implementations know to treat native `giphy` messages separately from ordinary images

### 52. v14 attachment docs should reflect the current Giphy rendering path

- Status: resolved
- Evidence:
  - current `Giphy` renders inline through `BaseImage`
  - current `ModalGallery` is used for image and mixed image/video galleries, not inline native `giphy` attachments
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md` and `03-ui-cookbook/06-attachment/04-giphy_preview.md` did not make that distinction explicit
  - `data/docs/chat-sdk/react/v14/07-troubleshooting/01-troubleshooting.md` still described the old Giphy image-default story imprecisely
- Expected fix: update the attachment, Giphy preview, and troubleshooting docs so they distinguish inline `Giphy` rendering from `ModalGallery` and describe the current `giphyVersion` behavior accurately

### 53. v14 `BaseImage` docs should reflect the current module split and broader usage

- Status: resolved
- Evidence:
  - current source moved `BaseImage` / `ImagePlaceholder` out of `Gallery` into their own `BaseImage` module
  - current source uses `BaseImage` across giphy attachments, link previews, video thumbnails, quoted previews, galleries, and attachment previews
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/09-base-image.md` still described a narrower set of internal consumers
- Expected fix: update the `BaseImage` page so it reflects the current module split and the wider set of SDK surfaces that reuse `BaseImage`

### 54. v14 composer docs still use removed `MessageInput*` entrypoint names

- Status: resolved
- Evidence:
  - current package exports `MessageComposer`, `MessageComposerUI`, `MessageComposerContext`, and `useMessageComposerContext`, not the old `MessageInput*` names
  - current shared message/thread props use `additionalMessageComposerProps`, not `additionalMessageInputProps`
  - multiple v14 docs pages still teach `MessageInput`, `MessageInputContext`, `useMessageInputContext`, or `additionalMessageInputProps`
- Expected fix: completed; the composer, thread, message-list, channel, AI integration, and migration-guide docs now use the `MessageComposer*` naming set and current links/imports

### 55. v14 channel-list docs still use removed `ChannelPreview*` names

- Status: resolved
- Evidence:
  - current package exports `ChannelListItem`, `ChannelListItemUI`, and `ChannelListItemActionButtons`, not `ChannelPreview*`
  - current `ChannelList.Preview` expects `ChannelListItemUIProps`
  - multiple v14 channel-list, theming, and state-management docs pages still mention `ChannelPreview`, `ChannelPreviewMessenger`, or `ChannelPreviewActionButtons`
- Expected fix: completed; the channel-list, theming, state-management, cookbook, and migration-guide docs now use the `ChannelListItem*` naming set and current hook/helper paths

### 56. v14 notifications docs still treat `MessageListNotifications` as a public component

- Status: resolved
- Evidence:
  - current package no longer exports `MessageListNotifications`
  - current `MessageList` and `VirtualizedMessageList` render the notification stack directly and use `NotificationList` for emitted client notifications
  - v14 read-state, notifications, message-list, and `ComponentContext` docs still describe `MessageListNotifications` as a public override surface in places
- Expected fix: completed; the notifications, read-state, message-list, component-context, connection-status, and migration-guide docs now treat `NotificationList` and `MessageListMainPanel` as the public customization surfaces

### 57. v14 reactions docs still use removed `ReactionsList` / `SimpleReactionsList` names

- Status: resolved
- Evidence:
  - current package exports `MessageReactions` and `MessageReactionsDetail`, not `ReactionsList` or `SimpleReactionsList`
  - current `ComponentContext` exposes `MessageReactions`, not `ReactionsList`
  - v14 reactions/message UI docs still mention `ReactionsList` or `SimpleReactionsList` in text, examples, or source links
- Expected fix: completed; the reactions, message UI, cookbook, component-context, and migration-guide docs now point at `MessageReactions`, `MessageReactionsDetail`, and the current reaction selector contract

### 58. v14 channel-list docs still teach removed `ChannelListMessenger` and direct `ChannelList` UI override props

- Status: resolved
- Evidence:
  - current package exports `ChannelListUI`, not `ChannelListMessenger`
  - current `ChannelList` no longer accepts `Avatar`, `List`, `LoadingErrorIndicator`, `LoadingIndicator`, or `Preview`; those overrides now flow through `WithComponents` / `ComponentContext`
  - current `ChannelListItem` no longer accepts `Avatar`
  - current default classes are `str-chat__channel-list-inner` and `str-chat__channel-list-inner__main`, and the root no longer includes `str-chat__channel-list-react`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/01-channel_list.md` still says the UI is controlled by `List` and `Preview`, links to `ChannelListMessenger`, and documents removed props in the prop table
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/02-channel_list_context.md` still imports `ChannelListMessenger`, types custom list UI with `ChannelListMessengerProps`, and describes `List` / `Preview` as `ChannelListProps`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md` and `03-ui-cookbook/02-channel-list/01-channel_list_preview.md` still teach `ChannelList Preview={...}`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/06-channel-list-infinite-scroll.md` still points users at `.str-chat__channel-list-messenger__main`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` still omits the `ChannelListUI` override key
- Expected fix: completed; the channel-list reference, cookbook, `ComponentContext`, and migration-guide pages now use `ChannelListUI` / `ChannelListItemUI` with `WithComponents`, and the styling examples point at `str-chat__channel-list-inner*`

### 59. v14 message-actions docs still assume dropdown toggles are injected automatically

- Status: resolved
- Evidence:
  - current `MessageActions` and `ChannelListItemActionButtons` now require an explicit `quick-dropdown-toggle` action-set item when dropdown actions should still be reachable
  - `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md` still documents action-set placements as only `quick` or `dropdown`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md` still shows full action-set examples without warning that the dropdown toggle is now part of the action set
  - `data/docs/chat-sdk/react/v14/04-guides/11-blocking-users.md` still extends `defaultMessageActionSet` without explaining why preserving the default toggle item matters
  - the migration guide does not yet call out the new `quick-dropdown-toggle` item or the loss of the auto-injected toggle button
- Expected fix: completed; the message-actions reference, cookbook, blocking-users guide, and migration guide now document `quick-dropdown-toggle` and preserve it in filtered action-set examples

### 60. v14 failed-message docs still lag the current error badge and delete behavior

- Status: resolved
- Evidence:
  - current source removed `MessageErrorText` and `MessageErrorIcon`, switched the default failed-send UI to `str-chat__message-error-indicator`, and changed `handleDelete()` to rethrow delete failures after notifying
  - current `handleDelete()` also removes unsent and network-failed messages locally instead of routing them through the server delete path
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md` still lists `handleDelete` without the new failure semantics
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/03-message_bounce_context.md` still types `handleDelete` as a generic event handler
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/04-message_hooks.md` and `03-ui-cookbook/04-message/01-message_ui.md` still wire `handleDelete` directly as a click handler without noting the new async/error behavior
  - `data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md` still imports and renders the removed `MessageErrorIcon`
  - the migration guide does not yet cover `MessageErrorText` removal, `MessageErrorIcon` removal, or the new failed-message delete behavior
- Expected fix: completed; the message context/hooks/cookbook/AI integration docs and migration guide now remove `MessageErrorIcon`, point to the current error-indicator path, and document the current `handleDelete()` behavior

### 61. v14 unread-action docs still imply `markUnread` is available on your own messages

- Status: resolved
- Evidence:
  - current source no longer allows `markUnread` on your own messages even when the channel has the required `read-events` capability
  - `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md` still presents `markUnread` as an ordinary built-in action without the own-message restriction
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md` still lists `markUnread` among the built-in action types without the new guardrail
  - `data/docs/chat-sdk/react/v14/04-guides/05-channel_read_state.md` still describes the default `Mark as unread` action generically
- the migration guide does not yet call out that the default base filter removes `markUnread` for your own messages
- Expected fix: completed; the message-actions docs, read-state guide, message hooks docs, and migration guide now describe `markUnread` as a foreign-message-only action and keep examples aligned with the current SDK base filter

### 62. v14 migration docs still need the `useChannelListContext()` signature cleanup

- Status: resolved
- Evidence:
  - current `useChannelListContext()` no longer accepts the old optional `componentName` argument
  - current source also removed the outside-provider warning side effect from the hook
  - `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md` does not yet call out that `useChannelListContext('MyComponent')` should be rewritten to `useChannelListContext()`
- Expected fix: completed; the migration guide now calls out the parameterless `useChannelListContext()` signature and the removal of the old diagnostic warning side effect

### 63. v14 dialog and component-context docs still lag the new context-menu customization surface

- Status: resolved
- Evidence:
  - current `ComponentContext` exposes `ContextMenu` and `ContextMenuContent`
  - current `DialogManagerProvider` exposes `closeOnClickOutside`
  - current `ContextMenu` / `DialogAnchor` also support per-menu `closeOnClickOutside`, `closeTransitionMs`, `submenuTransitionDurationMs`, and animation-related data attributes
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` does not yet list the new `ContextMenu` / `ContextMenuContent` override keys
  - `data/docs/chat-sdk/react/v14/04-guides/10-dialog-management.md` still treats dialog management as if the current outside-click and transition configuration surface did not exist
- Expected fix: completed; the component-context and dialog-management docs now cover `ContextMenu`, `ContextMenuContent`, and the current `DialogManagerProvider` / `DialogAnchor` outside-click-transition controls

### 64. v14 reactions docs still lag the current `MessageReactionsDetail` behavior

- Status: resolved
- Evidence:
  - current source exports `MessageReactionsDetailLoadingIndicator`
  - current `MessageReactionsDetail` lets users click the active reaction type again to reset the filter to `null` and show all reactions
  - current unfiltered detail rows can render a per-user reaction emoji, and the clustered reactions trigger now reflects dialog state with `aria-expanded` / `aria-pressed`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/12-reactions.md` and `03-ui-cookbook/04-message/02-reactions.md` do not yet mention these current behaviors or the new loading-indicator export
- Expected fix: completed; the reactions reference and cookbook pages now cover the current detail-loading override, toggleable filter behavior, and the unfiltered all-reactions view

### 65. v14 install and theming docs still use removed `dist/css/v2/*` stylesheet paths

- Status: resolved
- Evidence:
  - current package exports styles from `stream-chat-react/dist/css/*`, with no `v2` subpath exports
  - commit `f06846da` explicitly marks `stream-chat-react/dist/css/v2/*` imports as a breaking change
  - `data/docs/chat-sdk/react/v14/01-basics/02-installation.md`, `02-ui-components/01-getting_started.md`, and `02-ui-components/02-theming/01-themingv2.md` still imported styles from `dist/css/v2/*`
  - the migration guide did not yet call out the stylesheet import-path cleanup
- Expected fix: completed; installation, getting-started, theming, and migration-guide docs now use the root `dist/css/*` paths and call out the removal of legacy `v2` style import paths

### 66. v14 reactions and message-list docs still describe removed reaction-detail comparator props

- Status: resolved
- Evidence:
  - current source removed `sortReactionDetails` from `Message`, `MessageContext`, `MessageList`, `VirtualizedMessageList`, `MessageReactions`, and `MessageReactionsDetail`
  - current source removed the `ReactionDetailsComparator` export
  - current `MessageReactions` no longer accepts direct `reaction_counts` or `reactionOptions` props
  - `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/01-message_list.md` and `02-virtualized_list.md` still list `sortReactionDetails`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/01-message.md` and `02-message_context.md` still describe `sortReactionDetails` as part of the current surface
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/12-reactions.md` still lists `sortReactionDetails`, `ReactionDetailsComparator`, and legacy `reaction_counts`
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/02-reactions.md` still says `MessageReactions` accepts `reactionOptions`
  - the migration guide did not yet call out the final reaction-detail prop cleanup from `a82bdcb20`
- Expected fix: completed; the message, message-context, message-list, virtualized-list, reactions, cookbook, and migration-guide docs now use `reactionDetailsSort`, drop `ReactionDetailsComparator`, and keep `reactionOptions` customization in `WithComponents`

### 67. v14 icon and header docs still reference pre-Phosphor icon names and older icon assumptions

- Status: resolved
- Evidence:
  - names like `IconLayoutAlignLeft` and `IconCrossMedium` did not exist in `v13.14.2`, so they should not appear in v13-to-v14 migration guidance
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md` still documented `MenuIcon` as defaulting to `IconLayoutAlignLeft`
  - `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md` still used removed icon names like `IconCrossMedium` in the low-level icon migration example
- Expected fix: completed; the header docs and icon examples now use current icon names, and the migration guide no longer treats the later icon-catalog rename sweep as v13-to-v14 migration content

### 68. v14 avatar docs still imply caller-controlled overflow on `ChannelAvatar` and `GroupAvatar`

- Status: resolved
- Evidence:
  - `overflowCount` was not part of the `v13.14.2` public avatar surface, so it should not be presented as a v13-to-v14 migration target
  - current `GroupAvatar`, `ChannelAvatar`, and `AvatarStack` no longer expose caller-controlled `overflowCount`; overflow is calculated internally from `displayMembers` or `displayInfo`
  - current `getGroupChannelDisplayInfo(channel)` now returns `{ members }` with no computed `overflowCount`
  - before this follow-up pass, `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md` still said `groupChannelDisplayInfo -> displayMembers, overflowCount, required size`
  - before this follow-up pass, `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md` still showed `<ChannelAvatar displayMembers={members} overflowCount={rest} size={40} />`
  - before this follow-up pass, `data/docs/chat-sdk/react/v14/03-ui-cookbook/09-channel_header.md` still passed `overflowCount={groupChannelDisplayInfo?.overflowCount}`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/08-avatar.md` still explains `ChannelAvatar` in terms of a one-avatar vs group-avatar split, but does not yet call out the current automatic overflow behavior
- Expected fix: completed; the migration guide, avatar reference page, and channel-header cookbook now describe the current `displayMembers` plus automatic-overflow model and no longer present `overflowCount` as a v13-to-v14 migration concern

### 69. v14 `Chat` and `ChatContext` docs still describe SDK-owned sidebar state

- Status: resolved
- Evidence:
  - current `ChatProps` no longer expose `initialNavOpen`
  - current `ChatContextValue` no longer exposes `navOpen`, `openMobileNav`, or `closeMobileNav`
  - `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/01-chat.md` still recommends `initialNavOpen`, shows `useChatContext()` returning `navOpen`, and still lists `initialNavOpen` in the props table
  - `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/02-chat_context.md` still documents `closeMobileNav`, `navOpen`, and `openMobileNav`
- Expected fix: completed; the `Chat` and `ChatContext` pages now describe app-owned sidebar state and no longer document the removed SDK nav-state contract

### 70. v14 `ChannelHeader` docs still describe the removed built-in sidebar toggle path

- Status: resolved
- Evidence:
  - current `ChannelHeaderProps` no longer expose `MenuIcon`
  - current `ChannelHeader` renders `HeaderStartContent` from `ComponentContext` instead of a built-in toggle button
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md` still shows `MenuIcon` examples and still lists `MenuIcon` in the props table
- Expected fix: completed; the `ChannelHeader` docs now use the current `HeaderStartContent` / app-owned sidebar-toggle pattern instead of `MenuIcon`

### 71. v14 message, message-list, and indicator docs still describe removed deprecated pin/load-more aliases

- Status: resolved
- Evidence:
  - current `MessageContext`, `MessageProps`, and `MessageListProps` no longer expose `pinPermissions`
  - current `InfiniteScroll` no longer exposes the deprecated alias props `hasMore`, `hasMoreNewer`, `loadMore`, or `loadMoreNewer`
  - current `LoadMoreButton`, `LoadMorePaginator`, and `PaginatorProps` no longer expose `refreshing`
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md` still documents `pinPermissions`
  - `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/01-message_list.md` and `02-virtualized_list.md` still list `pinPermissions`
  - `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md` still documents `refreshing`
- Expected fix: completed; the docs no longer expose `pinPermissions` or `refreshing`, while keeping the current `MessageList` / `VirtualizedMessageList` `hasMoreNewer` and `loadMoreNewer` guidance intact

### 72. v14 channel-list hook docs still document removed standalone listener hooks and `useMobileNavigation`

- Status: resolved
- Evidence:
  - current source no longer exports the old standalone listener hooks such as `useChannelDeletedListener` and `useNotificationMessageNewListener`
  - current source no longer exports `useMobileNavigation`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/03-channel_list_hooks.md` still documents the removed hook list
- Expected fix: completed; the channel-list hooks page now reflects the current hook surface and removes the deleted listener/nav hooks

### 73. v14 emoji-picker, channel-preview, and load-more docs still document removed deprecated props

- Status: resolved
- Evidence:
  - current `EmojiPicker` no longer exposes `popperOptions`
  - current `ChannelListItemUI` no longer exposes the deprecated `latestMessage` alias
  - current load-more surfaces no longer expose `refreshing`
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/06-emoji-picker.md` still documents `popperOptions`
  - `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md` still documents `latestMessage` as a deprecated alias
  - `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md` still documents `refreshing`
- Expected fix: completed; the emoji-picker, channel-preview, and load-more docs now use `placement`, `latestMessagePreview`, and `isLoading`

### 74. v14 migration guide still needs coverage for the latest deprecated API purge and sidebar-state externalization

- Status: resolved
- Evidence:
  - `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md` still tells readers to use `initialNavOpen`
  - the guide does not yet cover the removal of `navOpen` / `openMobileNav` / `closeMobileNav`, the `MenuIcon` / `HeaderStartContent` replacement path, or the latest deprecated-API removals such as `UploadButton`, `pinPermissions`, `popperOptions`, and `latestMessage`
- Expected fix: completed; the migration guide now covers sidebar-state externalization and the final deprecated-API cleanup from the stable-prep window

### 75. v14 message and message-list docs still document removed `onlySenderCanEdit`

- Status: resolved
- Evidence:
  - current `MessageProps` no longer expose `onlySenderCanEdit`
  - current `MessageList` and `VirtualizedMessageList` no longer drill `onlySenderCanEdit` into message rendering
  - re-audit confirmed the live v14 reference pages were already clean in the current docs tree
  - the remaining gap was the migration guide note about capability-based editability and custom action filtering
- Expected fix: completed; the migration guide now calls out the removal and the sender-only-edit replacement path

### 76. v14 notifications docs still rely on removed message-notification callback props and `ConnectionStatus`

- Status: resolved
- Evidence:
  - current `MessageProps` no longer expose the legacy `get*Notification` callback props
  - current package no longer exports `ConnectionStatus`
  - current source exposes `useNotificationApi()` and `useReportLostConnectionSystemNotification()` instead
  - re-audit confirmed the live v14 message and message-list pages were already clean
  - the remaining gaps were the migration-guide note and explicit notification-guide guidance for the app-owned system-banner path
- Expected fix: completed; the notifications guide and migration guide now cover `useNotificationApi()`, `useReportLostConnectionSystemNotification()`, and the replacement for the removed `ConnectionStatus` component

### 77. v14 reactions docs do not cover `ReactionSelectorExtendedList` or the current detail-view flow

- Status: resolved
- Evidence:
  - current `ComponentContext` exposes `ReactionSelectorExtendedList`
  - current `MessageReactionsDetail` has an add-reaction step that renders the extended list inside the detail dialog
  - current `reactionDetailsSort` is now actually forwarded through `MessageReactions` into `MessageReactionsDetail`
  - there are no `ReactionSelectorExtendedList` hits in `data/docs/chat-sdk/react/v14`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` still omits the new override key
  - `data/docs/chat-sdk/react/v14/02-ui-components/08-message/12-reactions.md` and `03-ui-cookbook/04-message/02-reactions.md` do not yet explain the extended-list override or the current add-reaction/detail behavior
- Expected fix: completed; `ComponentContext`, the reactions reference page, and the reactions cookbook now cover `ReactionSelectorExtendedList`, the add-reaction step, and the current detail-view flow

### 78. v14 composer docs do not cover upload-progress indicators in attachment previews

- Status: resolved
- Evidence:
  - current source adds `UploadProgressIndicator`, `UploadedSizeIndicator`, `AttachmentUploadedSizeIndicator`, and new `ComponentContext` slots for `FileSizeIndicator`, `ProgressIndicator`, and `UploadedSizeIndicator`
  - there are no `UploadProgressIndicator`, `UploadedSizeIndicator`, or `AttachmentUploadedSizeIndicator` hits in `data/docs/chat-sdk/react/v14`
  - `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md` still omits those new override keys
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/05-ui_components.md` and `03-ui-cookbook/05-message-composer/03-attachment_previews.md` do not yet explain the upload-progress and uploaded-size UI used by file, media, and audio previews
- Expected fix: completed; `ComponentContext`, the composer UI reference, and the attachment-preview cookbook now document the upload progress and uploaded-size surfaces

### 79. v14 emoji-picker docs do not mention the standalone plugin stylesheet

- Status: resolved
- Evidence:
  - current package now builds `stream-chat-react/dist/css/emoji-picker.css`
  - there are no `emoji-picker.css` hits in `data/docs/chat-sdk/react/v14`
  - `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/06-emoji-picker.md` and `03-ui-cookbook/07-emoji_picker.md` still explain setup without the dedicated stylesheet import
- Expected fix: completed; the emoji-picker reference and cookbook pages now include the standalone stylesheet setup

### 80. v14 message-actions docs do not mention the built-in download action or the current small-screen quick-action behavior

- Status: resolved
- Evidence:
  - current `src/components/Message/utils.tsx` adds `download` to `MESSAGE_ACTIONS` and includes it in `getMessageActions(true)`
  - current `src/components/MessageActions/MessageActions.defaults.tsx` adds a built-in dropdown `Download` action to `defaultMessageActionSet`
  - current `src/components/MessageActions/styling/MessageActions.scss` hides inline reaction and thread-reply quick actions on screens up to `767px` and exposes the dropdown react item instead
  - `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md` and `03-ui-cookbook/04-message/04-message_actions.md` do not yet mention the built-in `download` action or the mobile quick-action collapse
- Expected fix: completed; the message-actions reference and cookbook now document the built-in `download` action, the new `download` action type in filtered sets, and the current small-screen behavior where inline quick actions collapse into the dropdown

### 81. v14 custom message UI cookbook still checks only `message.deleted_at`

- Status: resolved
- Evidence:
  - current `src/components/Message/utils.tsx` exports `isMessageDeleted(message)` and treats `deleted_at`, `type === 'deleted'`, and `deleted_for_me` as deleted-message states
  - current `src/components/Message/MessageUI.tsx` now uses `isMessageDeleted(message)` consistently for `MessageDeleted`, `MessageDeletedBubble`, and attachment/reaction visibility
  - `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md` still tells readers to check `message.deleted_at` and still branches on `message.deleted_at` in the sample code
- Expected fix: completed; the custom message UI cookbook now uses broader deleted-message checks instead of `message.deleted_at` only

### 82. v14 message-list and date-separator docs still lag the current sticky floating-date behavior

- Status: resolved
- Evidence:
  - current `src/components/MessageList/hooks/MessageList/useFloatingDateSeparatorMessageList.ts` now keeps the floating date synced with the separator pinned at the top boundary instead of hiding it whenever an in-flow separator is visible
  - current `src/components/MessageList/hooks/VirtualizedMessageList/useFloatingDateSeparator.ts` now follows the first visible item/date section instead of hiding the floating label whenever a visible separator exists
  - `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/01-message_list.md`, `02-virtualized_list.md`, and `08-message/13-date_separator.md` do not yet explain the current sticky floating-date behavior
- Expected fix: completed; the message-list, virtualized-list, and date-separator pages now describe the floating date as the current-section label that follows the first visible date group

## Docs Update Checklist

- [x] Freeze the initial breaking-change inventory against audited snapshot `6ea7a78e4184fce6066f7318f9ebd57a5ff1474a`
- [x] Fold the post-snapshot Search and audio-hook changes from `6ea7a78e4184fce6066f7318f9ebd57a5ff1474a..35f8a5d4bc220d3d50462883cf84e37eb507ea51` back into the trackers
- [x] Fold the post-snapshot sidebar, edited-message, notifications, and timestamp changes from `35f8a5d4bc220d3d50462883cf84e37eb507ea51..1227617b0576c4d1f29e1dd00116ba43981c8139` back into the trackers
- [x] Fold the post-snapshot Giphy, BaseImage, and command-selected composer changes from `1227617b0576c4d1f29e1dd00116ba43981c8139..aa36a4dd65c74481fac6c8b0dd058be3ca6a45ba` back into the trackers and v14 docs
- [x] Fold the post-snapshot component-rename and notification-removal changes from `aa36a4dd65c74481fac6c8b0dd058be3ca6a45ba..7c978a9e559f2cb8581d65365a4eb5e932db573d` back into the trackers
- [x] Fold the post-snapshot `ChannelListUI` rename and channel-list override removals from `7c978a9e559f2cb8581d65365a4eb5e932db573d..d251338327cdfe72042894c62c523bd9164c104f` back into the trackers and v14 docs
- [x] Fold the post-snapshot action-set, failed-message, and unread-action changes from `d251338327cdfe72042894c62c523bd9164c104f..9877da511183c5149959583bc4f11d7aa616f87f` back into the trackers and v14 docs
- [x] Fold the post-snapshot dialog/context-menu, `useChannelListContext()`, and reactions-detail changes from `9877da511183c5149959583bc4f11d7aa616f87f..55b1dd6c43f006ac8e7e2ceba1a58d8838bef149` back into the public v14 docs
- [x] Fold the post-snapshot stylesheet import-path cleanup from `55b1dd6c43f006ac8e7e2ceba1a58d8838bef149..f06846da4d492c0fb9ca375ee049682e6f9e48ba` back into the trackers and public v14 docs
- [x] Fold the post-snapshot reactions and icon-catalog changes from `f06846da4d492c0fb9ca375ee049682e6f9e48ba..241209e8059ce767fe5bc3500466aa73f53618e3` back into the public v14 docs
- [x] Fold the post-snapshot avatar overflow/internalization follow-up from `241209e8059ce767fe5bc3500466aa73f53618e3..6c7cd42afffb6d341b7a3b4bf5cc5a9bcd3f98ee` back into the public v14 docs
- [x] Fold the post-snapshot deprecated-API purge and sidebar-state externalization from `6c7cd42afffb6d341b7a3b4bf5cc5a9bcd3f98ee..dc16bb584675f48d5f67cf5d5d355ba012cf81d2` back into the public v14 docs
- [x] Fold the post-snapshot notifications/actions cleanup, sender-only-edit removal, reactions-detail additions, upload-progress indicators, and emoji-picker stylesheet changes from `dc16bb584675f48d5f67cf5d5d355ba012cf81d2..78934929a2b1b6d82f09736aada08c57c194d45e` back into the public v14 docs
- [x] Fold the post-snapshot message-actions, deleted-message, floating-date, and tooltip/current-behavior follow-up window from `78934929a2b1b6d82f09736aada08c57c194d45e..a41311edd9caf6f828bdaf1d8fb071c44d0ca0f1` back into the trackers and public v14 docs
- [x] Convert `ai-docs/docs-plan.md` from inventory mode into execution workstreams
- [x] Draft the v13 to v14 migration guide content
- [x] Prepare the v14 release-guide rename and sidebar update in `docs-content#1080`
- [ ] Merge `docs-content#1080` into `react-chat-v14`
- [x] Finish WS1: core customization surfaces
- [x] Finish WS2: message and message-list
- [x] Finish WS3: composer, attachments, dialogs, media
- [x] Finish WS4: layout, headers, lists, threads, indicators
- [x] Update Channel docs for current `MessageActions`
- [x] Update ComponentContext docs for `MessageAlsoSentInChannelIndicator`
- [x] Sweep v14 docs for stale `MessageOptions`, `experimental/MessageActions`, renamed exports, and `Channel X={...}` examples
- [ ] Run docs verification commands for the current post-`a41311ed` doc set

## Page Tracker

| Status   | Page                                                                                               | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| in PR    | `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md`                              | v13 to v14 migration guide drafted in `docs-content#1080`; keep aligned with post-snapshot changes such as Search, MessageEditedIndicator, current Giphy/composer behavior, the `ChannelListUI` migration, the latest action-set/error/unread changes, the latest channel-list hook cleanup, the stylesheet import-path cleanup, the latest reactions/icon follow-up work, the avatar-overflow follow-up from `49d576e4`, the latest deprecated-API purge plus sidebar-state externalization, and the current notification/editability/reactions/composer follow-up window until merged |
| in PR    | `data/docs/_sidebars/[chat-sdk][react][v14-rc].json`                                               | Nav label and migration guide metadata are updated in `docs-content#1080`; merge pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md`                      | Now documents the built-in `download` action and the current small-screen behavior where inline quick actions collapse into the dropdown                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md`                     | Cookbook examples now mention the built-in `download` action and the current small-screen quick-action behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md`                          | Deleted-message examples now use broader deleted-message checks instead of `message.deleted_at` only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/01-message_list.md`                 | Now describes the current sticky floating-date behavior as a current-section label                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/02-virtualized_list.md`             | Now describes the current sticky floating-date behavior as a current-section label                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/13-date_separator.md`                    | Now explains the floating separator as the current-section label that follows the first visible date group                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/06-release-guides/01-upgrade-to-v14.md`                              | Now covers `onlySenderCanEdit` removal, the legacy notification-callback / `ConnectionStatus` removal, and the current emoji-picker stylesheet setup for this post-`dc16bb584` window                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/01-chat.md`                                 | Now treats sidebar state as app-owned and no longer documents removed `initialNavOpen` or `navOpen`-based SDK state                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/02-chat_context.md`                         | Now reflects the current `ChatContext` shape without removed nav-state fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md`                    | Now uses `HeaderStartContent` for app-owned sidebar controls instead of the removed `MenuIcon` prop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/03-channel_list_hooks.md`           | Now documents only the current channel-list hook surface                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md`           | Now documents `latestMessagePreview` only and no longer exposes the removed alias                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/01-message_list.md`                 | Re-audited during the post-`dc16bb584` pass; the live page was already clean and required no additional editability or notification-prop cleanup                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/02-virtualized_list.md`             | Re-audited during the post-`dc16bb584` pass; the live page was already clean and required no additional editability or notification-prop cleanup                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md`                   | Removed `pinPermissions` and now treats pinning as capability-driven                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/06-emoji-picker.md`             | Setup now includes the dedicated `stream-chat-react/dist/css/emoji-picker.css` import and the current `WithComponents` registration path                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md`                                   | Replaced the removed `refreshing` props with the current `isLoading` contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| resolved | `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md`                      | Now documents `quick-dropdown-toggle`, preserves it in filtered action-set examples, and explains that `markUnread` is only available for foreign messages                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md`                     | Now preserves the default dropdown toggle, documents the own-message `markUnread` restriction, and keeps action-set examples aligned with the current base filter                                                                                                                                                                                                                                                                                                                                                                                                                       |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/11-blocking-users.md`                                      | Now explains why starting from `defaultMessageActionSet` preserves the current dropdown trigger and default filtering                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md`                   | Now documents the current `handleDelete()` failure semantics and local removal for unsent or network-failed messages                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/03-message_bounce_context.md`            | Bounce prompt example now treats delete as async and documents the current failed-message delete behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/04-message_hooks.md`                     | `useDeleteHandler()` and `useMarkUnreadHandler()` examples now match the current async delete flow and foreign-message-only unread behavior                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md`                          | Custom message action examples now wrap `handleDelete()` in async handlers that match the current SDK behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md`             | Removed the dead `MessageErrorIcon` import and replaced it with an app-owned failed-message indicator example                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/05-channel_read_state.md`                                  | Now calls out that the default `Mark as unread` action is limited to foreign messages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/*`                              | Swept to the `MessageComposer*` naming set, current hooks, and scoped `WithComponents` guidance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/*`                                  | Message-list docs now use `reactionDetailsSort`, remove the deprecated reaction-detail comparator props, and stay aligned with the current notification/composer surfaces                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/*`                                  | Channel-list docs now align with `ChannelListUI`, `ChannelListItemUI`, `WithComponents`, and the current `str-chat__channel-list-inner*` selectors                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/01-channel_list.md`                 | Search guidance remains current, and the page now documents channel-list customization through `ChannelListUI` / `ChannelListItemUI` with `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/02-channel_list_context.md`         | Search guidance remains current, and the examples now use `ChannelListUI` plus `WithComponents` instead of `ChannelListMessenger` / `List`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/05-channel_search.md`               | Rewritten around stable `Search`, its current prop surface, and `WithComponents` customization                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/02-channel-list/02-channel_search.md`                 | Rewritten to stable Search customization patterns and current `SearchController` guidance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/08-app_menu.md`                                       | Rewritten to a custom `SearchBar` composition example instead of the removed `ChannelSearch AppMenu` prop                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/08-advanced-search.md`              | Rewritten as a stable advanced Search guide using `SearchController`, restored filter-builder guidance, and stable `stream-chat-react` imports                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/01-channel.md`                           | Now keeps `Channel` focused on current behavior/data props and points SDK UI overrides to `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/05-component_context.md`                 | Now includes `ReactionSelectorExtendedList`, `FileSizeIndicator`, `ProgressIndicator`, and `UploadedSizeIndicator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| resolved | `data/docs/chat-sdk/react/v14/01-basics/02-installation.md`                                        | Now calls out the current `stream-chat` minimum, version-alignment guidance, and the root `dist/css/index.css` import path                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/07-ui-components.md`                     | Rewritten to the current deleted-message, message-status, edited-indicator, message-text, and bounce-prompt surfaces                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/05-message_ui.md`                        | Rewritten around the current message UI composition without `FixedHeightMessage` or `MessageOptions`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/05-experimental-features/01-message-actions.md`                      | Rewritten to the stable `MessageActions` model with `messageActionSet`, quick actions, and `ContextMenu`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/02-message_context.md`                   | Now reflects the current `reactionDetailsSort`-only reaction-detail customization surface in addition to the current delete behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/01-message.md`                           | Re-audited during the post-`dc16bb584` pass; the live page was already clean and required no additional editability or notification-prop cleanup                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/02-message_composer_context.md` | Rewritten to the current `MessageComposerContext` surface and dedicated cooldown helpers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/03-message_composer_hooks.md`   | Rewritten to the currently exported composer hooks, including `useMessageContentIsEmpty`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/01-input_ui.md`                   | Rewritten to current composer building blocks, `useCooldownRemaining()`, and the default command-selected layout behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/04-message_hooks.md`                     | Rewritten without `useEditHandler` and aligned to the current edit flow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/01-attachment.md`          | Rewritten to the current `Attachment` grouping, supported override points, the `Image` / `Media` / `ModalGallery` split, and the inline `Giphy` path                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/10-poll.md`                              | Rewritten to the current poll override surface and quoted-message guidance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/12-reactions.md`                         | Now documents `ReactionSelectorExtendedList`, the add-reaction detail step, the large-reaction-count guard, and the current `reactionDetailsSort` flow                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/02-reactions.md`                           | Cookbook now covers `ReactionSelectorExtendedList`, the add-reaction detail step, and the current large-reaction-count behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/05-channel_read_state.md`                                  | Rewritten to the current unread, new-message, `NotificationList`, and scroll-to-latest model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/13-notifications.md`                                       | Now explicitly points readers to `useNotificationApi()`, `useReportLostConnectionSystemNotification()`, and the app-owned replacement path for the removed `ConnectionStatus` component                                                                                                                                                                                                                                                                                                                                                                                                 |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/08-avatar.md`                            | Now explains the current `displayMembers` plus automatic-overflow model and no longer implies caller-controlled overflow handling                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/07-sdk-state-management.md`                                | Channel-list state example now registers custom row UI through `WithComponents` / `ChannelListItemUI` instead of the removed `ChannelList Preview={...}` path                                                                                                                                                                                                                                                                                                                                                                                                                           |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/04-channel_preview_ui.md`           | Preview-content guidance remains current, and the page now registers custom rows through `WithComponents` / `ChannelListItemUI`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/05-channel-list/06-channel-list-infinite-scroll.md` | `options.limit` guidance remains current, and the styling example now points at `.str-chat__channel-list-inner__main`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/02-channel-list/01-channel_list_preview.md`           | Display helpers remain current, and the cookbook now starts from a `ChannelListItemUI` override registered through `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/10-thread_header.md`                                  | Rewritten to current `ThreadHeader` behavior, current `Avatar` props, and the `WithComponents` override path                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/06-suggestion_list.md`            | Rewritten to `SuggestionList`, current suggestion item contracts, current `Avatar` props, and the `WithComponents` override path                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/01-message_ui.md`                          | Rewritten to current `WithComponents` registration, `Avatar` props, and reaction wiring                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/06-system_message.md`                      | Rewritten to current `WithComponents` registration and `Avatar` props                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/04-message_actions.md`                     | Rewritten to current `MessageActions`, `defaultMessageActionSet`, and `WithComponents` customization                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/04-message/05-pin_indicator.md`                       | Updated to current `WithComponents` registration for `PinIndicator`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/04-giphy_preview.md`                    | Updated to register `GiphyPreviewMessage` through `WithComponents` and to distinguish ephemeral `/giphy` previews from sent inline giphy attachments                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/07-emoji_picker.md`                                   | Cookbook setup now includes the dedicated `stream-chat-react/dist/css/emoji-picker.css` import                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/11-blocking-users.md`                                      | Updated custom blocking action guidance to the current `MessageActions` model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/12-message-reminders.md`                                   | Updated reminder override example to use `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/14-location-sharing.md`                                    | Updated location-sharing override examples to use `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/02-theming/03-component-variables.md`               | Added a note clarifying that a few CSS token groups intentionally retain historical `stream-chat-css` names                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/11-chat-view.md`                                    | Rewritten to current `ChatView.Selector` and `ThreadAdapter` behavior, including `iconOnly={false}`, `aria-pressed`, and placeholder/blank-state guidance                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/06-thread-list/01-thread-list.md`                   | Updated to current `ChatView.ThreadAdapter` placeholder behavior and the current labeled-selector example                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/07-message-list/05-thread.md`                       | Rewritten to current `Thread` props and `WithComponents`-based thread-surface overrides                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/04-channel/02-channel_header.md`                    | Now points `MenuIcon` at the current `IconSidebar` default and matches the post-Phosphor icon catalog                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/16-modal.md`                                        | Rewritten to the `GlobalModal` public surface and `WithComponents` modal override pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/10-dialog-management.md`                                   | Rewritten around current dialog primitives, `GlobalModal`, `DialogManagerProvider closeOnClickOutside`, and the current `ContextMenu`/transition configuration surface                                                                                                                                                                                                                                                                                                                                                                                                                  |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/15-audio-playback.md`                                      | Updated to the current `FileIcon` prop surface                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/01-message_composer.md`         | Rewritten around the current `MessageComposer` props, scoped `MessageComposerUI` overrides, and v14 composer behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/04-input_ui.md`                 | Rewritten to current `MessageComposerUI` composition, scoped `WithComponents` usage, and the default command-selected layout behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/08-attachment-selector.md`      | Rewritten to the current selector action contract, `WithComponents` override path, and the default command-selected composer behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/05-ui_components.md`            | Now documents `UploadProgressIndicator`, `UploadedSizeIndicator`, `FileSizeIndicator`, and the current preview progress/size behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/02-link-previews.md`              | Rewritten to the current `LinkPreviewList` contract, `displayLinkCount`, and `WithComponents` override path                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/03-attachment_previews.md`        | Cookbook now explains the current upload-progress and uploaded-size indicator behavior for file, audio, and media previews                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/02-image_gallery.md`                    | Rewritten around the `ModalGallery` override path and the lower-level `Gallery` provider split                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/11-attachment/02-voice-recording.md`     | Voice-recording customization example now mounts the custom attachment renderer through `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/01-attachment_actions.md`               | Attachment-actions cookbook now uses `WithComponents` for attachment overrides and refreshed imports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/03-geolocation_attachment.md`           | Geolocation attachment cookbook now registers the custom attachment renderer through `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/06-attachment/05-payment_attachment.md`               | Payment attachment cookbook now registers the custom attachment renderer through `WithComponents`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/01-getting_started.md`                              | Updated styling examples to current header selectors and the root `dist/css/index.css` import path                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/02-theming/01-themingv2.md`                         | Updated the page to CSS-only import snippets under the root `dist/css/*` entrypoints, including the layout-only examples                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/13-date_separator.md`                    | Rewritten to the current default separator behavior and custom-separator guidance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/09-channel_header.md`                                 | The custom header example now relies on `displayMembers` only and lets `ChannelAvatar` compute overflow automatically                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/03-chat/01-chat.md`                                 | Rewritten to the current sidebar-state behavior after the temporary RC-only responsive-nav prop was removed, and now reflects the current `str-chat__channel-list` root class                                                                                                                                                                                                                                                                                                                                                                                                           |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/09-base-image.md`                        | Updated to the current `BaseImage` fallback behavior, broader internal usage, `showDownloadButtonOnError` default, and `ImagePlaceholder` override path                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/08-date-time-formatting.md`                                | Updated to the current time-only `MessageTimestamp` default and the `MessageEditedIndicator`-based edited-time customization path                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/07-notifications/01-system-notifications.md`          | System-notification cookbook is the current app-owned replacement path for the removed `ConnectionStatus` component                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/12-indicators.md`                                   | Rewritten to the current `TypingIndicator` / `TypingIndicatorHeader` split and current prop contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/03-ui-cookbook/05-message-composer/07-typing_indicator.md`           | Rewritten to the current custom typing-indicator contract and header typing guidance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/08-message/03-message_bounce_context.md`            | Rewritten to the current bounce-prompt contract without removed close props                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| resolved | `data/docs/chat-sdk/react/v14/02-ui-components/09-message-composer/07-audio_recorder.md`           | Rewritten to current recorder overrides, permission flow, and voice-recording send behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/04-typescript_and_custom_data_types.md`                    | Warning now reflects the remaining default helpers/components that still rely on `DefaultChannelData` fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| resolved | `data/docs/chat-sdk/react/v14/04-guides/16-ai-integrations/02-chat-sdk-integration.md`             | Custom message examples now read SDK state from `useMessageContext()` instead of assuming injected `MessageUIComponentProps`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| resolved | `data/docs/chat-sdk/react/v14/07-troubleshooting/01-troubleshooting.md`                            | Updated Giphy guidance to the current `giphyVersion` default and clarified that the same setting affects preview thumbnails as well                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| resolved | `data/docs/chat-sdk/react/v14` (multiple pages)                                                    | Repo-wide sweep is complete; remaining `Channel X={...}` examples are current supported props such as `EmptyPlaceholder`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Breaking Change Workflow

1. Diff `v13.14.2..master` in `stream-chat-react`.
2. Confirm whether the change affects imports, props, hooks, context values, override keys, CSS selectors, or behavior relied on by integrators.
3. Record the item in `breaking-changes.md` with evidence.
4. Record the affected v14 docs pages in `docs-plan.md`.
5. Once the inventory is complete enough, update the specific docs pages and fold the item into the migration guide with a before/after example if needed.

## Verification

- Docs shell: `npm run check` in `/docs`
- Docs shell: `npm run build` in `/docs`
- React SDK spot-checks as needed while verifying API claims

## Open Questions

- How many CSS/class name changes need explicit migration guidance versus a short warning for custom theming users?
- Which redesign items changed public override points versus only internal markup?
