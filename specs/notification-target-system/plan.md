# Worktree

- **Path:** `/Users/martincupela/Projects/stream/chat/stream-chat-react`
- **Branch:** `feat/toast-notification-ui`
- **Base branch:** `master`

# Task Overview

Tasks are self-contained and non-overlapping where possible; tasks touching shared notification modules are chained by dependencies.

## Task 1: Define Notification Targeting Primitives

**File(s) to create/modify:** `src/components/Notifications/notificationOrigin.ts`, `src/components/Notifications/hooks/useNotificationTarget.ts`, `src/components/Notifications/hooks/index.ts`, `src/components/Notifications/index.ts`

**Dependencies:** None

**Status:** done

**Owner:** codex

**Scope:**

- Expand panel target typing beyond channel/thread.
- Add `useNotificationTarget` hook to centralize target panel selection.
- Add reusable helpers for panel-based notification filtering.
- Export new APIs through Notifications barrels.

**Acceptance Criteria:**

- [x] Panel target type includes `channel`, `thread`, `channel-list`, `thread-list`.
- [x] `useNotificationTarget` resolves target consistently for channel/thread contexts.
- [x] Consumers can build panel filters without duplicating shape checks.
- [x] New hook/types are exported from Notifications public module.

## Task 2: Add Queue-Aware Panel Consumption in NotificationList

**File(s) to create/modify:** `src/components/Notifications/hooks/useNotifications.ts`, `src/components/Notifications/hooks/useQueuedNotifications.ts`, `src/components/Notifications/NotificationList.tsx`, `src/components/Notifications/hooks/index.ts`

**Dependencies:** Task 1

**Status:** done

**Owner:** codex

**Scope:**

- Introduce queue-focused notifications hook for list consumption.
- Keep visible window bounded by `maxVisibleCount`, expose queued count.
- Support panel-based filtering in a typed and reusable way.

**Acceptance Criteria:**

- [x] Notification list behavior is deterministic when notifications exceed visible cap.
- [x] Queueing behavior is implemented through reusable hook(s), not ad hoc slicing in component code.
- [x] Existing NotificationList API remains backward compatible.

## Task 3: Wire Panel-Level NotificationList Mount Points

**File(s) to create/modify:** `src/components/Channel/Channel.tsx`, `src/components/Thread/Thread.tsx`, `src/components/ChannelList/ChannelList.tsx`, `src/components/Threads/ThreadList/ThreadList.tsx`, `src/components/MessageList/MessageListNotifications.tsx`

**Dependencies:** Task 2

**Status:** done

**Owner:** codex

**Scope:**

- Mount panel-targeted `NotificationList` in each panel root.
- Remove conflicting duplicate unfiltered client notification list usage in message list notifications.
- Keep existing per-channel legacy notifications + connection status behavior intact.

**Acceptance Criteria:**

- [x] Panel roots render NotificationList with panel-target filters.
- [x] No duplicate rendering of same client notification across multiple mounted lists.
- [x] Existing message list legacy notifications continue to render.

## Task 4: Migrate Core Emitters to useNotificationTarget

**File(s) to create/modify:** `src/components/Message/Message.tsx`, `src/components/MessageInput/hooks/useSubmitHandler.ts`, `src/components/Attachment/hooks/useAudioController.ts`, `src/components/Location/ShareLocationDialog.tsx`, `src/components/Channel/Channel.tsx`

**Dependencies:** Task 1

**Status:** done

**Owner:** codex

**Scope:**

- Replace repeated thread/channel target detection with `useNotificationTarget`.
- Keep emitter IDs/options intact while unifying origin context shape.

**Acceptance Criteria:**

- [x] Repeated panel derivation logic is removed from listed files.
- [x] Emitted notifications from these files include `origin.context.panel` from shared hook.
- [x] TypeScript remains clean for changed files.

## Task 5: Add/Adjust Tests for Targeting + Queueing

**File(s) to create/modify:** `src/components/Notifications/__tests__/...` (new/updated), `src/components/Channel/__tests__/Channel.test.js` and/or `src/components/Message/__tests__/Message.test.js` (as needed)

**Dependencies:** Task 2, Task 3, Task 4

**Status:** done

**Owner:** codex

**Scope:**

- Add focused tests for target filtering and queue behavior.
- Update impacted tests for new hook-driven origin context.

**Acceptance Criteria:**

- [x] Queue behavior is test-covered (overflow stays queued).
- [x] Panel filtering behavior is test-covered.
- [x] Existing adapted tests pass with new origin behavior.

## Task 6: Validate and Finalize

**File(s) to create/modify:** `specs/notification-target-system/state.json`, `specs/notification-target-system/decisions.md`, `specs/notification-target-system/plan.md`

**Dependencies:** Task 5

**Status:** done

**Owner:** codex

**Scope:**

- Run targeted test/typecheck command(s).
- Record final decisions and state updates.

**Acceptance Criteria:**

- [x] Relevant tests/types executed or documented if blocked.
- [x] Ralph files updated with final statuses and decisions.

# Execution Order

- **Phase 1 (sequential):** Task 1
- **Phase 2 (sequential):** Task 2
- **Phase 3 (parallel possible):** Task 3 and Task 4
- **Phase 4 (sequential):** Task 5
- **Phase 5 (sequential):** Task 6

# File Ownership Summary

| Task   | Creates/Modifies                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 1 | `src/components/Notifications/notificationOrigin.ts`, `src/components/Notifications/hooks/useNotificationTarget.ts`, notifications barrels                                                                                            |
| Task 2 | `src/components/Notifications/hooks/useNotifications.ts`, `src/components/Notifications/hooks/useQueuedNotifications.ts`, `src/components/Notifications/NotificationList.tsx`                                                         |
| Task 3 | `src/components/Channel/Channel.tsx`, `src/components/Thread/Thread.tsx`, `src/components/ChannelList/ChannelList.tsx`, `src/components/Threads/ThreadList/ThreadList.tsx`, `src/components/MessageList/MessageListNotifications.tsx` |
| Task 4 | Notification emitters in Message/MessageInput/Attachment/Location/Channel                                                                                                                                                             |
| Task 5 | Notifications tests + impacted existing tests                                                                                                                                                                                         |
| Task 6 | Ralph protocol files in `specs/notification-target-system`                                                                                                                                                                            |
