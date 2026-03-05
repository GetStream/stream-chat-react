# Message Pagination Independence Plan

## Worktree

**Worktree path:** `/Users/martincupela/Projects/stream/chat/stream-chat-react`  
**Branch:** `feat/message-paginator`  
**Base branch:** `master`

## Task overview

Tasks are self-contained where possible; same-file tasks are chained explicitly.

## Task 1: Audit Current Migration State Across Both Repos

**File(s) to create/modify:** `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`, `specs/message-pagination/state.json`

**Dependencies:** None

**Status:** done

**Owner:** codex

**Scope:**

- Verify current `stream-chat-react` and `stream-chat-js` pagination/thread coupling points.
- Record done vs missing milestones.
- Capture legacy-to-new API mapping contract.

**Acceptance Criteria:**

- [x] Done/missing summary is documented.
- [x] Replacement mapping table exists.

## Task 2: Make `Thread.messagePaginator` Thread-Replies Aware (JS SDK)

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/thread.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/pagination/paginators/MessagePaginator.ts` (or companion adapters)

**Dependencies:** Task 1

**Status:** done

**Owner:** codex

**Scope:**

- Ensure thread paginator query path uses thread replies semantics rather than channel messages query.
- Keep `jumpTo*`, `toHead`, `toTail`, and state semantics coherent for thread datasets.

**Acceptance Criteria:**

- [x] Thread pagination never queries channel main-message dataset by mistake.
- [x] Thread paginator state (`items`, `hasMore*`, cursor) reflects replies.

## Task 3: Remove `setActiveChannel` Routing from Chat Context/Chat Wrapper

**File(s) to create/modify:** `src/context/ChatContext.tsx`, `src/components/Chat/Chat.tsx`, `src/components/Chat/hooks/useCreateChatContext.ts`, `src/components/Chat/hooks/useChat.ts`, `src/components/Channel/ChannelSlot.tsx`, `src/components/Channel/index.ts`, `src/components/ChannelList/ChannelList.tsx`, `src/components/ChannelPreview/ChannelPreview.tsx`, `src/components/ChannelPreview/ChannelPreviewMessenger.tsx`, `src/components/ChannelSearch/hooks/useChannelSearch.ts`, `src/experimental/Search/SearchResults/SearchResultItem.tsx`, `examples/vite/src/App.tsx`, `src/components/Chat/__tests__/Chat.test.js`, `src/components/ChatView/__tests__/ChatView.test.tsx`, `src/components/ChatView/__tests__/ChatViewNavigation.test.tsx`, `src/components/ChannelPreview/__tests__/ChannelPreviewMessenger.test.js`, `src/experimental/Search/__tests__/SearchResultItem.test.js`, `src/components/ChatView/ChatView.tsx` (integration checks)

**Dependencies:** Task 1

**Status:** done

**Owner:** codex

**Scope:**

- Remove active-display channel ownership from `ChatContext` (`setActiveChannel`, display `channel` routing path).
- Remove corresponding wiring from `Chat.tsx`.
- Wire channel selection in `ChannelList`/`ChannelPreview` to layout navigation (`openChannel`) instead of `setActiveChannel`.
- Wire channel selection in `ChannelSearch` and experimental Search result items to layout navigation (`openChannel`).
- Ensure active channel/thread display is driven by ChatView layout entities (`LayoutController` / `ChatViewNavigation`).
- Add `ChannelSlot` and migrate example app channel rendering to slot-based channel instance resolution.
- Update directly affected tests/mocks to the no-`setActiveChannel` contract.

**Acceptance Criteria:**

- [x] `ChatContextValue` no longer exposes `setActiveChannel`.
- [x] `ChatContextValue` no longer exposes `channel` as active-display state.
- [x] `Chat.tsx` no longer passes `setActiveChannel` into chat context creation.
- [x] Channel preview click/select in `ChannelList` opens via layout navigation API.
- [x] Channel display flow works from slot-bound entities rather than chat-context active channel state.
- [x] ChannelSearch and SearchResultItem channel selection use layout navigation API.
- [x] `ChannelSlot` exists and resolves channel instance from layout slot bindings.
- [x] Vite example app uses `ChannelSlot` instead of direct `Channel` component wiring.
- [x] TypeScript compiles after removing `setActiveChannel` from `ChatContextValue`.

## Task 4: Remove Hardcoded `channel.messagePaginator` Usage from React Lists

**File(s) to create/modify:** `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`

**Dependencies:** Task 2, Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Route list pagination controls through `useMessagePaginator()`.
- Ensure thread lists and channel lists use the correct paginator instance in both list variants.

**Acceptance Criteria:**

- [x] No direct paginator direction calls (`toHead`/`toTail`) use `channel.messagePaginator` inside shared list components.
- [x] Thread list pagination behavior matches thread dataset.

## Task 5: Remove Remaining Thread-Flow Dependence on Channel Context Actions/State

**File(s) to create/modify:** `src/components/Message/Message.tsx`, `src/components/Message/hooks/*.ts`, `src/components/MessageActions/defaults.tsx`, `src/components/MessageInput/hooks/useSendMessageFn.ts`, `src/components/MessageInput/hooks/useUpdateMessageFn.ts`, `src/components/MessageList/hooks/useMarkRead.ts`, `src/components/MessageList/UnreadMessagesNotification.tsx`, `src/components/MessageList/UnreadMessagesSeparator.tsx`, `src/components/Attachment/hooks/useAudioController.ts`, `src/context/MessageBounceContext.tsx`

**Dependencies:** Task 4

**Status:** done

**Owner:** codex

**Scope:**

- Remove `ChannelActionContext` from message interaction runtime paths (thread and channel where migrated).
- Route notification writes through `client.notifications` APIs (`addSuccess`/`addError`) instead of context notification wrappers.
- Route optimistic message state updates through `messagePaginator` APIs (`ingestItem`, `removeItem`) instead of context `updateMessage`/`removeMessage`.
- Close parity gaps for legacy commented `Channel.tsx` action blocks (`jumpTo*`, unread UI snapshot handling, send/retry/edit optimistic reconciliation).
- Keep behavior parity for mark-read flow and message mutation pathways.
- Align React-layer send/retry/update pathways with `MessageOperations` ownership in `stream-chat-js` (`src/messageOperations/MessageOperations.ts`).
- Remove `thread.upsertReplyLocally` / `thread.deleteReplyLocally` calls from React runtime paths; keep those methods only as JS SDK compatibility surface.

**Acceptance Criteria:**

- [x] Thread subtree interactions work without requiring `ChannelActionProvider` or `ChannelStateProvider` in migrated flows.
- [x] Message interaction notifications use `client.notifications` in migrated flows.
- [x] Optimistic message update/remove paths use `messagePaginator` reconciliation APIs.
- [x] React runtime does not call `thread.upsertReplyLocally` / `thread.deleteReplyLocally`.
- [x] Coverage matrix items derived from commented legacy `Channel.tsx` actions are fully addressed or explicitly deprecated.
- [x] No runtime warnings from context hooks in sibling-render thread flow.

## Task 6: Update and Rebase Tests to Instance-Driven Contract

**File(s) to create/modify:** `src/components/Thread/__tests__/Thread.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `src/components/MessageList/__tests__/MessageList.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/threads.test.ts` (as needed)

**Dependencies:** Task 5

**Status:** done

**Owner:** codex

**Scope:**

- Remove legacy assertions for context thread pagination controls.
- Add assertions for paginator-driven channel/thread list behavior.
- Add regression coverage for sibling `Channel` + `Thread` composition and no-`setActiveChannel` routing.
- Keep React tests at integration boundary; avoid emulating paginator internals already tested in `stream-chat-js`.

**Acceptance Criteria:**

- [x] Tests assert instance-driven pagination contract.
- [x] Legacy context-thread assumptions are removed or explicitly deprecated.
- [x] Tests no longer assume `ChatContext.setActiveChannel` for active display routing.

## Task 7: Final Cleanup and Deprecation Notes

**File(s) to create/modify:** `src/context/ChannelActionContext.tsx`, `src/context/ChannelStateContext.tsx`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 6

**Status:** done

**Owner:** codex

**Scope:**

- Remove dead/commented legacy pagination API remnants.
- Document final migration/deprecation state.

**Acceptance Criteria:**

- [x] Channel context files no longer carry stale commented pagination/thread contracts.
- [x] Spec and decisions reflect final shipped behavior.

## Task 8: Introduce Shared Slot-Entity Resolution Hook(s)

**File(s) to create/modify:** `src/components/ChatView/hooks/useSlotEntity.ts`, `src/components/Channel/ChannelSlot.tsx`, `src/components/Thread/ThreadSlot.tsx`, `src/experimental/Search/SearchResults/SearchResultItem.tsx`, `src/components/ChatView/index.ts` (exports), `src/components/ChatView/ChatView.tsx` (if hook wiring requires)

**Dependencies:** Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Add `useSlotEntity({ kind, slot? })` in ChatView scope to centralize slot binding resolution.
- Add typed wrappers (`useSlotChannel`, `useSlotThread`) if this improves call-site safety.
- Migrate `ChannelSlot`/`ThreadSlot` and at least one current call site with duplicated narrowing (`SearchResultItem`) to the shared hook.
- Document single-entity-per-kind behavior and expectations for multiple rendered slots.

**Acceptance Criteria:**

- [x] Slot entity resolution is implemented once and reused by slot consumers.
- [x] `SearchResultItem` (and similar navigation consumers) no longer implement ad-hoc slot/channel narrowing inline.
- [x] Hook contract documents how first-match resolution works when multiple slots are visible.
- [x] TypeScript compiles with the shared hook API.

## Task 9: Move ChannelList Hide Flow to Layout-Capacity Navigation

**File(s) to create/modify:** `src/components/ChannelList/ChannelList.tsx`, `src/context/ChatContext.tsx`, `src/components/Chat/hooks/useCreateChatContext.ts`, `src/components/Chat/hooks/useChat.ts`, `src/components/Chat/Chat.tsx`, `src/components/ChannelList/__tests__/ChannelList.test.js`, `src/components/Chat/__tests__/Chat.test.js`

**Dependencies:** Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Remove `closeMobileNav` from `ChatContext` contract and context creation wiring.
- On channel selection in `ChannelList`, call `hideChannelList` from `ChatViewNavigation` instead of context mobile-nav APIs.
- Gate channel-list auto-hide by layout capacity (hide only when opening channel replaces `channelList` slot binding).
- Update affected tests.

**Acceptance Criteria:**

- [x] `ChatContextValue` no longer exposes `closeMobileNav`.
- [x] ChannelList auto-hide is driven by layout-capacity signal (replacement of `channelList` slot binding), not user-agent checks.
- [x] ChannelList remains visible when channel opens without consuming the `channelList` slot.
- [x] TypeScript compiles after context and ChannelList changes.

## Task 10: Move Mention Handlers from Channel-Level API to Message Props

**File(s) to create/modify:** `src/components/Channel/Channel.tsx`, `src/context/ChannelActionContext.tsx`, `src/components/Message/types.ts`, `src/components/Message/hooks/useMentionsHandler.ts`, `src/components/Message/__tests__/Message.test.js`, `src/components/Message/hooks/__tests__/useMentionsHandler.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 5

**Status:** done

**Owner:** codex

**Scope:**

- Stop accepting `onMentionsClick` / `onMentionsHover` on `Channel` API surface.
- Remove mention handler fields from `ChannelActionContext` runtime contract.
- Treat mention handlers as `Message`-level behavior configured via `MessageProps`.
- Update mention handler hook/tests to avoid Channel action-context fallback.

**Acceptance Criteria:**

- [x] `ChannelProps` no longer define mention handler props.
- [x] `ChannelActionContextValue` no longer carries mention handlers.
- [x] `MessageProps` mention handlers are typed independently of `ChannelActionContext`.
- [x] Mention handling works from `Message` props only.
- [x] Tests covering mention behavior are migrated to Message-level contract.

## Task 11: Add JS Instance-Level Delete Wrappers and Migrate React Delete Flow

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/messageOperations/types.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/messageOperations/MessageOperations.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/thread.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/pagination/paginators/MessagePaginator.test.ts` (or dedicated messageOperations tests), `src/components/Message/hooks/useDeleteHandler.ts`, `src/components/Channel/Channel.tsx`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 5

**Status:** done

**Owner:** codex

**Scope:**

- Extend JS instance operation contract with delete local-update wrapper on `Channel` and `Thread` (`deleteMessageWithLocalUpdate`).
- Add optional custom request handler support (`deleteMessageRequest`) in `ChannelInstanceConfig.requestHandlers` and per-call overrides.
- Define delete optimistic policy semantics (default behavior: execute request, then reconcile via paginator ingest/remove path based on response shape).
- Migrate React delete flow (`useDeleteHandler`) to instance wrappers instead of direct `client.deleteMessage(...)`.
- Remove `Channel` prop/context-era delete wrapper reliance once instance wrappers are used (`doDeleteMessageRequest` migration/deprecation path).

**Acceptance Criteria:**

- [x] `Channel` and `Thread` expose `deleteMessageWithLocalUpdate`.
- [x] Integrators can inject custom delete logic through channel config handler (`deleteMessageRequest`) and per-call override.
- [x] React message delete flow uses `(thread ?? channel).deleteMessageWithLocalUpdate(...)`.
- [x] Delete reconciliation is paginator-based and consistent with existing send/retry/update ownership model.
- [x] JS + React tests cover default delete path and custom request handler path.

## Task 12: Port `markRead` out of `ChannelActionContext` (Channel + Thread Lists)

**File(s) to create/modify:** `src/context/ChannelActionContext.tsx`, `src/components/Channel/Channel.tsx`, `src/components/MessageList/hooks/useMarkRead.ts`, `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageList/hooks/__tests__/useMarkRead.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 5

**Status:** done

**Owner:** codex

**Scope:**

- Remove `markRead` as a required runtime function exposed via `ChannelActionContext`.
- Standardize Channel list mark-read calls on `channel.markRead(...)` (delegating to `client.messageDeliveryReporter.markRead(channel, ...)`).
- Standardize Thread list mark-read calls on `thread.markAsRead(...)` (delegating to `client.messageDeliveryReporter.markRead(thread, ...)`).
- Preserve unread snapshot reconciliation semantics in React where required (for example `markReadOnMount` and UI unread indicators), but without Channel-action context coupling.
- Ensure parity for thread unread indicator actions and auto-mark-read hooks where thread list semantics apply.
- Define migration/deprecation path for `Channel` prop override `doMarkReadRequest` so customization aligns with instance-driven ownership.
- Add thread-level custom mark-read prop (`ThreadProps.doMarkReadRequest`) with thread-first arguments and wire it to instance request handlers.
- Keep customization parity between `Channel` and `Thread` for `doDeleteMessageRequest`, `doSendMessageRequest`, `doUpdateMessageRequest`, and `doMarkReadRequest`.

**Acceptance Criteria:**

- [x] Runtime Channel list mark-read flow no longer relies on `useChannelActionContext().markRead`.
- [x] Runtime Thread list mark-read flow no longer relies on `useChannelActionContext().markRead`.
- [x] `ChannelActionContextValue` does not require `markRead` for core message-list/read behavior.
- [x] Read reporting in migrated paths goes through `channel.markRead` / `thread.markRead` via `client.messageDeliveryReporter`.
- [x] Existing mark-read behavior parity is preserved (`markReadOnMount`, visibility/bottom-scroll conditions, unread count/UI updates).
- [x] Specs document channel/thread mark-read contract and thread request shape (`thread_id`) through reporter.
- [x] Custom mark-read overrides (`ChannelProps` + `ThreadProps`) are routed through instance `requestHandlers.markReadRequest`, not client-global reporter mutation.
- [x] `ThreadProps` offers custom request overrides matching Channel parity (`doDeleteMessageRequest`, `doSendMessageRequest`, `doUpdateMessageRequest`, `doMarkReadRequest`) and they are instance-scoped.

## Task 13: Migrate `suppressAutoscroll` off Legacy Channel Reducer Semantics

**File(s) to create/modify:** `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/MessageList/hooks/MessageList/useScrollLocationLogic.tsx`, `src/components/MessageList/hooks/MessageList/useMessageListScrollManager.ts`, `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageList/__tests__/VirtualizedMessageListComponents.test.js`, `src/components/Channel/channelState.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 4, Task 7

**Status:** done

**Owner:** codex

**Scope:**

- Preserve current UX parity for pagination/autoscroll while removing reliance on `channelState.ts` `suppressAutoscroll` reducer behavior.
- Define list-local suppression signal tied to paginator lifecycle (`toTail`/loading older messages) and apply consistently to MessageList + VirtualizedMessageList.
- Remove stale references/comments that imply reducer/context ownership of suppression.
- Add regression tests that cover:
- loading older messages while scrolled up does not force scroll-to-bottom;
- normal auto-follow still happens for own/newest messages when suppression is inactive.

**Acceptance Criteria:**

- [x] `suppressAutoscroll` behavior is implemented from list/paginator lifecycle, not Channel reducer state.
- [x] MessageList and VirtualizedMessageList have parity for suppression behavior.
- [x] No runtime behavior depends on `channelState.ts` for autoscroll suppression.
- [x] Tests verify suppression and normal follow behavior in both list variants.

## Task 14: Replace `useChannel()` Dependency on `ChannelStateContext`

**File(s) to create/modify:** `src/context/useChannel.ts`, `src/context/ChannelStateContext.tsx` (transitional), `src/components/Channel/Channel.tsx`, `src/components/Channel/ChannelSlot.tsx`, `src/context/index.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 7

**Status:** done

**Owner:** codex

**Scope:**

- Introduce/standardize a dedicated channel-instance provider path for runtime channel resolution.
- Update `useChannel()` to resolve from thread first, then new channel-instance provider (not `ChannelStateContext`).
- Keep migration additive and backward compatible while downstream consumers are moved.

**Acceptance Criteria:**

- [x] `useChannel()` no longer reads from `ChannelStateContext`.
- [x] Channel runtime still resolves channel instance correctly in Channel and Thread compositions.
- [x] Transitional compatibility is documented.

## Task 15: Migrate Message Lists Off `ChannelStateContext`

**File(s) to create/modify:** `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/MessageList/UnreadMessagesNotification.tsx`, `src/components/MessageList/MessageListNotifications.tsx`, `src/components/Channel/Channel.tsx`, `specs/message-pagination/spec.md`

**Dependencies:** Task 14

**Status:** done

**Owner:** codex

**Scope:**

- Remove `useChannelStateContext(...)` consumption from list runtime components.
- Source channel instance through `useChannel()` and source list notification data via explicit props or client notification store.
- Keep MessageList and VirtualizedMessageList behavior parity.

**Acceptance Criteria:**

- [x] No runtime list component imports/uses `useChannelStateContext`.
- [x] Channel/unread actions still work in channel and thread list contexts.
- [x] MessageList notifications rendering has a non-ChannelStateContext source.

## Task 16: Remove `ChannelStateProvider` Wiring From Channel Runtime

**File(s) to create/modify:** `src/components/Channel/Channel.tsx`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/context/ChannelStateContext.tsx`, `src/context/index.ts`

**Dependencies:** Task 15

**Status:** done

**Owner:** codex

**Scope:**

- Remove `ChannelStateProvider` wrapper from `Channel.tsx`.
- Remove obsolete context creation helper (`useCreateChannelStateContext`).
- Remove runtime exports of `ChannelStateContext` once no runtime consumers remain.

**Acceptance Criteria:**

- [x] `Channel.tsx` no longer renders `ChannelStateProvider`.
- [x] `useCreateChannelStateContext` is removed.
- [x] Runtime build/typecheck pass without `ChannelStateContext` in normal render path.

## Task 17: Migrate Stories and Tests Off `ChannelStateProvider`

**File(s) to create/modify:** `src/stories/*.stories.tsx` (affected), `src/components/**/__tests__/*` (affected wrappers), `specs/message-pagination/plan.md`, `specs/message-pagination/state.json`

**Dependencies:** Task 16

**Status:** done

**Owner:** codex

**Scope:**

- Replace `ChannelStateProvider` wrappers in stories/tests with current runtime provider composition.
- Update assertions/mocks to instance-driven channel sourcing.

**Acceptance Criteria:**

- [x] No active story/test scaffolding depends on `ChannelStateProvider`.
- [x] Updated tests verify instance-driven behavior.

## Task 18: Delete `ChannelStateContext` and Legacy Channel Reducer

**File(s) to create/modify:** `src/context/ChannelStateContext.tsx`, `src/components/Channel/channelState.ts`, `src/context/index.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 13, Task 17

**Status:** done

**Owner:** codex

**Scope:**

- Remove `ChannelStateContext.tsx` and final references.
- Remove `channelState.ts` once `suppressAutoscroll`/legacy reducer semantics are fully migrated.
- Finalize deprecation notes.

**Acceptance Criteria:**

- [x] `ChannelStateContext.tsx` is deleted.
- [x] `channelState.ts` is deleted.
- [x] Specs reflect final ChannelStateContext-free architecture.

## Task 19: Port Remaining Commented `Channel.tsx` Legacy Semantics to JS SDK

**File(s) to create/modify:** `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/pagination/paginators/MessagePaginator.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/pagination/paginators/MessagePaginator.test.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`, `specs/message-pagination/state.json`

**Dependencies:** Task 11, Task 12

**Status:** done

**Owner:** codex

**Scope:**

- Add legacy-equivalent fallback logic to `MessagePaginator.jumpToTheFirstUnreadMessage(...)` when unread ids are unavailable:
  - query around `lastReadAt`/read-state timestamp (`created_at_around` descriptor);
  - derive first unread candidate from returned page boundaries;
  - persist inferred ids back into `unreadStateSnapshot`.
- Keep current unresolved-target contract (`boolean` return) and avoid introducing new notification side effects in paginator APIs.
- Explicitly do **not** port legacy `filterErrorMessages()` behavior; `beforeSend` was removed and no replacement hook is required for this migration.
- Add tests that pin unread-fallback parity outcomes.

**Acceptance Criteria:**

- [x] `jumpToTheFirstUnreadMessage` works even when both unread ids are missing but `last_read` timestamp exists.
- [x] Successful fallback jump hydrates `unreadStateSnapshot` inferred ids when previously unknown.
- [x] Specs/decisions explicitly document that pre-send failed-message cleanup is not ported as parity requirement.
- [x] JS SDK unit tests cover new unread-fallback semantics.

## Task 20: Restore Instance-Scoped Initial Channel Bootstrap Loading/Error UI

**File(s) to create/modify:** `src/components/Channel/Channel.tsx`, `src/components/Channel/__tests__/Channel.test.js`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`, `specs/message-pagination/state.json`

**Dependencies:** Task 3, Task 18

**Status:** done

**Owner:** codex

**Scope:**

- Add explicit bootstrap request state in `Channel.tsx` for `initializeOnMount` flow of a provided channel instance.
- Render `LoadingIndicator` only during initial bootstrap load when `channel.initialized === false`.
- Render `LoadingErrorIndicator` only when the initial bootstrap request fails.
- Keep pagination/loading errors for subsequent pages out of `Channel.tsx`; those remain message-list responsibilities.
- Add tests that verify bootstrap loading/error rendering and no takeover of paginator/page loading failures.

**Acceptance Criteria:**

- [x] Uninitialized channel instance (`initializeOnMount=true`) shows `LoadingIndicator` until initial load resolves.
- [x] Initial load failure shows `LoadingErrorIndicator`.
- [x] After successful bootstrap, `Channel.tsx` renders children and no longer owns page-level loading/error states.
- [x] Message-list pagination failures are not surfaced through `Channel.tsx` bootstrap indicators.

## Execution Order

1. Phase 1 (completed): Task 1
2. Phase 2 (parallel): Task 2 and Task 3
3. Phase 3 (sequential): Task 4 -> Task 5
4. Phase 4: Task 6
5. Phase 5: Task 7
6. Phase 6: Task 8
7. Phase 7: Task 9
8. Phase 8: Task 10
9. Phase 9: Task 11
10. Phase 10: Task 12
11. Phase 11: Task 13
12. Phase 12: Task 14
13. Phase 13: Task 15
14. Phase 14: Task 16
15. Phase 15: Task 17
16. Phase 16: Task 18
17. Phase 17: Task 19
18. Phase 18: Task 20

## File ownership summary

| Task    | Creates/Modifies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1  | `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`, `specs/message-pagination/state.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Task 2  | `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/thread.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/pagination/paginators/MessagePaginator.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Task 3  | `src/context/ChatContext.tsx`, `src/components/Chat/Chat.tsx`, `src/components/Chat/hooks/useCreateChatContext.ts`, `src/components/Chat/hooks/useChat.ts`, `src/components/Channel/ChannelSlot.tsx`, `src/components/Channel/index.ts`, `src/components/ChannelList/ChannelList.tsx`, `src/components/ChannelPreview/ChannelPreview.tsx`, `src/components/ChannelPreview/ChannelPreviewMessenger.tsx`, `src/components/ChannelSearch/hooks/useChannelSearch.ts`, `src/experimental/Search/SearchResults/SearchResultItem.tsx`, `examples/vite/src/App.tsx`, `src/components/Chat/__tests__/Chat.test.js`, `src/components/ChatView/__tests__/ChatView.test.tsx`, `src/components/ChatView/__tests__/ChatViewNavigation.test.tsx`, `src/components/ChannelPreview/__tests__/ChannelPreviewMessenger.test.js`, `src/experimental/Search/__tests__/SearchResultItem.test.js`, `src/components/ChatView/ChatView.tsx` (integration checks) |
| Task 4  | `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Task 5  | `src/components/Message/Message.tsx`, `src/components/Message/hooks/*.ts`, `src/components/MessageInput/hooks/useSendMessageFn.ts`, `src/components/MessageInput/hooks/useUpdateMessageFn.ts`, `src/components/MessageList/hooks/useMarkRead.ts`, `src/context/MessageBounceContext.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Task 6  | `src/components/Thread/__tests__/Thread.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `src/components/MessageList/__tests__/MessageList.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/threads.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Task 7  | `src/context/ChannelActionContext.tsx`, `src/context/ChannelStateContext.tsx`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Task 8  | `src/components/ChatView/hooks/useSlotEntity.ts`, `src/components/Channel/ChannelSlot.tsx`, `src/components/Thread/ThreadSlot.tsx`, `src/experimental/Search/SearchResults/SearchResultItem.tsx`, `src/components/ChatView/index.ts`, `src/components/ChatView/ChatView.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Task 9  | `src/components/ChannelList/ChannelList.tsx`, `src/context/ChatContext.tsx`, `src/components/Chat/hooks/useCreateChatContext.ts`, `src/components/Chat/hooks/useChat.ts`, `src/components/Chat/Chat.tsx`, `src/components/ChannelList/__tests__/ChannelList.test.js`, `src/components/Chat/__tests__/Chat.test.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Task 10 | `src/components/Channel/Channel.tsx`, `src/context/ChannelActionContext.tsx`, `src/components/Message/types.ts`, `src/components/Message/hooks/useMentionsHandler.ts`, `src/components/Message/__tests__/Message.test.js`, `src/components/Message/hooks/__tests__/useMentionsHandler.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Task 11 | `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/messageOperations/types.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/messageOperations/MessageOperations.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/channel.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/thread.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/*`, `src/components/Message/hooks/useDeleteHandler.ts`, `src/components/Channel/Channel.tsx`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                                                                                                                                         |
| Task 12 | `src/context/ChannelActionContext.tsx`, `src/components/Channel/Channel.tsx`, `src/components/Channel/hooks/useChannelRequestHandlers.ts`, `src/components/Channel/hooks/__tests__/useChannelRequestHandlers.test.ts`, `src/components/Thread/Thread.tsx`, `src/components/Thread/hooks/useThreadRequestHandlers.ts`, `src/components/Thread/hooks/__tests__/useThreadRequestHandlers.test.ts`, `src/components/MessageList/hooks/useMarkRead.ts`, `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageList/hooks/__tests__/useMarkRead.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                        |
| Task 13 | `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/MessageList/hooks/MessageList/useScrollLocationLogic.tsx`, `src/components/MessageList/hooks/MessageList/useMessageListScrollManager.ts`, `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/MessageList/__tests__/VirtualizedMessageListComponents.test.js`, `src/components/Channel/channelState.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                                                                                                                                                                                                     |
| Task 14 | `src/context/useChannel.ts`, `src/context/ChannelStateContext.tsx` (transitional), `src/components/Channel/Channel.tsx`, `src/components/Channel/ChannelSlot.tsx`, `src/context/index.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Task 15 | `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`, `src/components/MessageList/UnreadMessagesNotification.tsx`, `src/components/MessageList/MessageListNotifications.tsx`, `src/components/Channel/Channel.tsx`, `specs/message-pagination/spec.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Task 16 | `src/components/Channel/Channel.tsx`, `src/components/Channel/hooks/useCreateChannelStateContext.ts`, `src/context/ChannelStateContext.tsx`, `src/context/index.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Task 17 | `src/stories/*.stories.tsx` (affected), `src/components/**/__tests__/*` (affected wrappers), `specs/message-pagination/plan.md`, `specs/message-pagination/state.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Task 18 | `src/context/ChannelStateContext.tsx`, `src/components/Channel/channelState.ts`, `src/context/index.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Task 19 | `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/pagination/paginators/MessagePaginator.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/pagination/paginators/MessagePaginator.test.ts`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`, `specs/message-pagination/state.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Task 20 | `src/components/Channel/Channel.tsx`, `src/components/Channel/__tests__/Channel.test.js`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`, `specs/message-pagination/state.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
