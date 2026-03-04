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

**File(s) to create/modify:** `src/components/Message/Message.tsx`, `src/components/Message/hooks/*.ts`, `src/components/MessageInput/hooks/useSendMessageFn.ts`, `src/components/MessageInput/hooks/useUpdateMessageFn.ts`, `src/components/MessageList/hooks/useMarkRead.ts`, `src/context/MessageBounceContext.tsx`

**Dependencies:** Task 4

**Status:** pending

**Owner:** unassigned

**Scope:**

- Replace thread-subtree usage of `useChannelActionContext` / `useChannelStateContext` with thread/channel instance adapters where required.
- Keep behavior parity for notifications, mark-read flow, and message mutation pathways.

**Acceptance Criteria:**

- [ ] Thread subtree interactions work without requiring `ChannelActionProvider` or `ChannelStateProvider`.
- [ ] No runtime warnings from context hooks in sibling-render thread flow.

## Task 6: Update and Rebase Tests to Instance-Driven Contract

**File(s) to create/modify:** `src/components/Thread/__tests__/Thread.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `src/components/MessageList/__tests__/MessageList.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/threads.test.ts` (as needed)

**Dependencies:** Task 5

**Status:** pending

**Owner:** unassigned

**Scope:**

- Remove legacy assertions for context thread pagination controls.
- Add assertions for paginator-driven channel/thread list behavior.
- Add regression coverage for sibling `Channel` + `Thread` composition and no-`setActiveChannel` routing.

**Acceptance Criteria:**

- [ ] Tests assert instance-driven pagination contract.
- [ ] Legacy context-thread assumptions are removed or explicitly deprecated.
- [ ] Tests no longer assume `ChatContext.setActiveChannel` for active display routing.

## Task 7: Final Cleanup and Deprecation Notes

**File(s) to create/modify:** `src/context/ChannelActionContext.tsx`, `src/context/ChannelStateContext.tsx`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`

**Dependencies:** Task 6

**Status:** pending

**Owner:** unassigned

**Scope:**

- Remove dead/commented legacy pagination API remnants.
- Document final migration/deprecation state.

**Acceptance Criteria:**

- [ ] Channel context files no longer carry stale commented pagination/thread contracts.
- [ ] Spec and decisions reflect final shipped behavior.

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

## Execution Order

1. Phase 1 (completed): Task 1
2. Phase 2 (parallel): Task 2 and Task 3
3. Phase 3 (sequential): Task 4 -> Task 5
4. Phase 4: Task 6
5. Phase 5: Task 7
6. Phase 6: Task 8
7. Phase 7: Task 9

## File ownership summary

| Task   | Creates/Modifies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1 | `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`, `specs/message-pagination/state.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Task 2 | `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/thread.ts`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/src/pagination/paginators/MessagePaginator.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Task 3 | `src/context/ChatContext.tsx`, `src/components/Chat/Chat.tsx`, `src/components/Chat/hooks/useCreateChatContext.ts`, `src/components/Chat/hooks/useChat.ts`, `src/components/Channel/ChannelSlot.tsx`, `src/components/Channel/index.ts`, `src/components/ChannelList/ChannelList.tsx`, `src/components/ChannelPreview/ChannelPreview.tsx`, `src/components/ChannelPreview/ChannelPreviewMessenger.tsx`, `src/components/ChannelSearch/hooks/useChannelSearch.ts`, `src/experimental/Search/SearchResults/SearchResultItem.tsx`, `examples/vite/src/App.tsx`, `src/components/Chat/__tests__/Chat.test.js`, `src/components/ChatView/__tests__/ChatView.test.tsx`, `src/components/ChatView/__tests__/ChatViewNavigation.test.tsx`, `src/components/ChannelPreview/__tests__/ChannelPreviewMessenger.test.js`, `src/experimental/Search/__tests__/SearchResultItem.test.js`, `src/components/ChatView/ChatView.tsx` (integration checks) |
| Task 4 | `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/VirtualizedMessageList.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Task 5 | `src/components/Message/Message.tsx`, `src/components/Message/hooks/*.ts`, `src/components/MessageInput/hooks/useSendMessageFn.ts`, `src/components/MessageInput/hooks/useUpdateMessageFn.ts`, `src/components/MessageList/hooks/useMarkRead.ts`, `src/context/MessageBounceContext.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Task 6 | `src/components/Thread/__tests__/Thread.test.js`, `src/components/Channel/__tests__/Channel.test.js`, `src/components/MessageList/__tests__/MessageList.test.js`, `/Users/martincupela/Projects/stream/chat/stream-chat-js/test/unit/threads.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Task 7 | `src/context/ChannelActionContext.tsx`, `src/context/ChannelStateContext.tsx`, `specs/message-pagination/spec.md`, `specs/message-pagination/decisions.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Task 8 | `src/components/ChatView/hooks/useSlotEntity.ts`, `src/components/Channel/ChannelSlot.tsx`, `src/components/Thread/ThreadSlot.tsx`, `src/experimental/Search/SearchResults/SearchResultItem.tsx`, `src/components/ChatView/index.ts`, `src/components/ChatView/ChatView.tsx`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Task 9 | `src/components/ChannelList/ChannelList.tsx`, `src/context/ChatContext.tsx`, `src/components/Chat/hooks/useCreateChatContext.ts`, `src/components/Chat/hooks/useChat.ts`, `src/components/Chat/Chat.tsx`, `src/components/ChannelList/__tests__/ChannelList.test.js`, `src/components/Chat/__tests__/Chat.test.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
