# Worktree

- **Path:** `/Users/martincupela/Projects/stream/chat/stream-chat-react`
- **Branch:** `codex/message-list-jump-scroll`
- **Base branch:** `master`

# Task Overview

Tasks are mostly sequential because `Channel.tsx`, `channelState.ts`, and `MessageList.tsx` are behaviorally coupled and the regression tests depend on the final state flow.

## Task 1: Ralph spec setup

**File(s) to create/modify:** `specs/message-list-jump-scroll/goal.md`, `specs/message-list-jump-scroll/plan.md`, `specs/message-list-jump-scroll/state.json`, `specs/message-list-jump-scroll/decisions.md`

**Dependencies:** None

**Status:** done

**Owner:** codex

**Scope:**

- Create the Ralph folder and seed the goal, plan, state, and decision log.
- Record the initial diagnosis that the bug comes from a race between jump state flags and rendered messages.

**Acceptance Criteria:**

- [x] All four Ralph files exist under `specs/message-list-jump-scroll/`
- [x] `goal.md` contains success criteria and non-goals
- [x] `state.json` is valid JSON and matches the task list

## Task 2: Make jump-to-latest atomic in channel state

**File(s) to create/modify:** `src/components/Channel/Channel.tsx`, `src/components/Channel/channelState.ts`

**Dependencies:** Task 1

**Status:** done

**Owner:** codex

**Scope:**

- Replace the split `loadMoreFinished` + `jumpToLatestMessage` reducer flow with a dedicated `jumpToLatestMessageFinished` action.
- Dispatch latest messages and pagination flags together after `loadMessageIntoState('latest')` resolves.
- Cancel any pending debounced `loadMoreFinished` callbacks before jump-based state switches so stale message pages cannot replay after a jump.
- Keep the public `jumpToLatestMessage(): Promise<void>` API unchanged.

**Acceptance Criteria:**

- [x] `jumpToLatestMessage()` no longer depends on debounced `loadMoreFinished()`
- [x] Reducer applies latest messages and `hasMoreNewer` together
- [x] There is no reducer transition that marks “latest page” without also replacing the message page

## Task 3: Rebuild MessageList jump animation around rendered latest-page state

**File(s) to create/modify:** `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/hooks/MessageList/useScrollLocationLogic.tsx`, `src/components/MessageList/hooks/MessageList/useMessageListScrollManager.ts`

**Dependencies:** Task 2

**Status:** done

**Owner:** codex

**Scope:**

- Remove the prior timeout/`scrollend` workaround.
- Track a local jump phase in `MessageList`: idle, waiting for latest render, animating.
- Start the animation only after the rendered message-set signature changes to the latest page.
- Suppress automatic scroll management during the jump and gate typing-indicator “scroll to bottom” behavior while animating.
- Extend the same render-driven behavior to `highlightedMessageId` jumps driven by `jumpToMessage(...)`.
- Make highlighted jumps choose their starting edge from jump direction: bottom for older-page jumps, top for newer-page jumps, no forced edge reset for same-set jumps.

**Acceptance Criteria:**

- [x] Old page never scrolls during fetch
- [x] Smooth scroll starts only after latest page is mounted
- [x] Final position is corrected to the latest page bottom
- [x] Regular non-jump bottom scrolling behavior remains unchanged
- [x] Quoted-message jumps animate only after the target page renders
- [x] Quoted-message jumps respect older-vs-newer direction when choosing the initial scroll edge

## Task 4: Add regression tests for the jump race and final landing

**File(s) to create/modify:** `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/Channel/__tests__/Channel.test.js`

**Dependencies:** Task 2, Task 3

**Status:** done

**Owner:** codex

**Scope:**

- Add a `MessageList` regression test that asserts no old-page scroll occurs before the latest page renders.
- Add a `Channel` regression test that asserts the latest-page reducer update applies messages and flags together.
- Add regressions for `jumpToMessage(...)` so stale debounced load-more state cannot overwrite the target page and highlighted jumps animate only after the target page renders.
- Mock `ChatView` hooks in these suites so the targeted regressions can run without unrelated provider setup.

**Acceptance Criteria:**

- [x] Race condition is covered by targeted regression tests
- [x] Tests prove old-page no-scroll and latest-page post-render scroll order
- [x] Tests prove quoted-message jumps wait for the target page and keep the target message set active
- [x] Types and targeted tests remain clean

## Task 5: Validate and finalize Ralph files

**File(s) to create/modify:** `specs/message-list-jump-scroll/state.json`, `specs/message-list-jump-scroll/decisions.md`, `specs/message-list-jump-scroll/plan.md`

**Dependencies:** Task 4

**Status:** done

**Owner:** codex

**Scope:**

- Run type checking and targeted Jest coverage for the new jump behavior.
- Record validation commands and final decisions.
- Note the targeted `ChatView` test mocking required by current suite setup.
- Note the follow-up behavior change that highlighted jumps now respect jump direction.

**Acceptance Criteria:**

- [x] Validation commands are recorded in `state.json`
- [x] `decisions.md` logs the final atomic-jump approach
- [x] `plan.md` reflects final task statuses

## Follow-up Analysis: Older-page prepend stability

**Status:** discovered after Task 5 validation

**Browser verification context:**

- Verified against `http://localhost:5175/?mock_notifications=1&view=chat&channel=little-italy&thread=b472ce2e-ff3e-4fc0-8cef-8e75fe5002a4&theme=light`
- Fresh browser sessions reproduced multiple older-page prepends on `.str-chat__message-list`

**Observed behavior:**

- Several early prepends preserved the viewport correctly.
- Later prepends did not. Example trace:
  - before one broken prepend: `scrollTop 6111`, `scrollHeight 19299`, `items 125`
  - after prepend: `scrollTop 6114`, `scrollHeight 24599`, `items 150`
- That page added roughly `5300px` of height while the viewport moved by only `3px`, so the intended prepend compensation clearly did not preserve the visible anchor.

**Analysis:**

- The current scroll controller in `useMessageListScrollManager.ts` preserves older-page prepends by applying `scrollBy(newScrollHeight - oldScrollHeight)`.
- That approach is structurally fragile because it preserves aggregate container height, not the actual visible message anchor.
- It fails when:
  - the user keeps scrolling while `loadingMore` is in flight
  - row heights settle after render
  - mixed media/separators/grouping change total list height independently of the user-visible anchor
- Attachment/media inspection in the same browser session showed many image/video/map thumbnails with varied heights. Most were already fully loaded and sized, so they are likely a secondary amplifier rather than the root cause.

**Recommended next task:**

- Replace prepend preservation with anchor-based restoration:
  - capture the first visible message id and its offset from the list top before or during `loadingMore`
  - after prepend, locate that same message and restore its offset
  - update the anchor while `loadingMore` is true so late user movement is respected
- Keep the existing latest-jump and quoted-message jump logic unchanged while refactoring prepend preservation separately.

## Follow-up Analysis: Current state after anchor-based iterations

**Status:** implemented and browser-reverified

**Implemented follow-ups:**

- Replaced prepend preservation based purely on `scrollHeight` deltas with anchor-based restoration in the scroll hooks.
- Updated the anchor during `loadingMore` so late user movement can be respected.
- Switched anchor selection from first-visible to viewport-center-biased selection.
- Added a bounded post-render correction window using `requestAnimationFrame` and `ResizeObserver`.
- Suppressed competing auto-scroll behavior during explicit older-page anchor restoration.
- Removed debounced completion from the older-page `loadMore()` path in `Channel.tsx`.

**Observed result after rebuild and browser verification:**

- Early and mid prepends improved and no longer show the original “no preservation at all” failure pattern.
- A later prepend still collapses badly on the provided thread:
  - before `175 -> 200` messages: `scrollTop 5256.5`, `scrollHeight 29876`
  - after prepend: `scrollTop 1131.5`, `scrollHeight 31028`
- The latest built-browser trace therefore shows partial improvement but not a full fix.

**Updated analysis:**

- The remaining issue is no longer adequately explained by total-height preservation alone.
- The remaining failure likely comes from one of:
  - the chosen anchor row still not being stable enough on later prepends
  - the anchor row being present but shifted again after restoration starts
  - a competing scroll update or layout effect running after the explicit restoration
  - message-row layout settling beyond the current bounded restore window

**Proposed next steps:**

- Option 1: Add temporary runtime instrumentation in the app code path for older-page prepends.
  - Log chosen anchor id, anchor rect before/after prepend, restore attempts, and any later scroll writes.
  - Use this to identify whether the failure is anchor instability or post-restore interference.
- Option 2: Promote older-page restoration to an explicit reducer/UI state machine.
  - Mark `loadingMore` completion as “prepend restoring”.
  - Gate all other scroll-management branches until restoration reports stable completion.
- Option 3: Anchor to a more stable semantic target.
  - Instead of a viewport-relative row anchor, preserve a specific rendered message block plus an intra-block offset or preserve the message nearest the viewport center together with stronger DOM identity checks.
- Option 4: Add a dedicated browser-only repro harness or debug flag.
  - Emit structured scroll diagnostics during prepend so failures can be observed without guessing from aggregate `scrollTop` snapshots.

## Follow-up Analysis: Quoted-message jump still regresses in browser

**Status:** attempted fix implemented, browser repro still failing

**Browser verification context:**

- Verified against `http://localhost:5175/?mock_notifications=1&view=chat&channel=benchat&theme=light`
- Repro click path:
  - source row: `li[data-message-id="160b5a2c-7a27-4ac6-9fc7-cd6b3adc0114"]`
  - click target: `[data-testid="quoted-message-preview"]`
  - expected destination id: `bc5efd05-eda7-4956-bc39-c3e6b4515fb0`

**Implemented attempt:**

- Split `jumpToMessage()` away from the older-page pagination flag by introducing a dedicated `loadingMoreForJumpToMessage` state.
- Temporarily disabled previous-page loading in `MessageList` while the highlighted jump is waiting for render or animating.
- Added a focused `Channel` regression asserting that highlighted jumps no longer reuse `loadingMore`.

**Observed result after rebuild and browser verification:**

- The exact browser repro still does not land on the expected target.
- Trace after click:
  - initial page: `25` messages, target not in DOM
  - settled page: `50` messages, `scrollTop ~264`
  - target `bc5efd05-eda7-4956-bc39-c3e6b4515fb0` still absent from the DOM trace
- That means the remaining failure is not explained solely by the shared loading flag or the immediate previous-page paginator.

**Updated analysis:**

- The remaining bug is likely in the data-loading / message-set selection path of `jumpToMessage()` rather than only in the scroll controller.
- The next debugging pass should instrument:
  - which message ids `loadMessageIntoState(messageId)` actually injects into `channel.state.messages`
  - whether the expected target id is present briefly and then replaced
  - whether another post-jump state copy overwrites the target page after the highlighted jump starts

## Follow-up Analysis: Scroll classification profiling

**Status:** instrumented and measured in the rebuilt browser

**Profiling procedure:**

- Added temporary browser-gated instrumentation for:
  - `message-list-scroll:classify-prepend`
  - `message-list-scroll:classify-append`
  - `message-list-scroll:capture-anchor`
  - `message-list-scroll:apply-anchor`
- Verified against `http://localhost:5175/?mock_notifications=1&view=chat&channel=little-italy&thread=b472ce2e-ff3e-4fc0-8cef-8e75fe5002a4&theme=light`
- In the browser, enable:
  - `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__ = { enabled: true, entries: [] }`
- Reproduce older-page pagination by repeatedly scrolling `.str-chat__message-list` to the top
- Aggregate `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__.entries` by measurement name

**Measured result:**

- `message-list-scroll:classify-prepend`
  - count: `1`
  - avg/max: about `0.30ms`
- `message-list-scroll:capture-anchor`
  - count: `1`
  - avg/max: about `0.20ms`
- `message-list-scroll:classify-append`
  - count: `1`
  - avg/max: about `0ms`

**Conclusion:**

- In the measured real browser interaction, prefix/suffix classification is negligible.
- Based on this run, `messageIdsMatchAsPrefix` is not a compelling optimization target.
- Caveat: this was a narrow real-path measurement with only one instrumented pagination classification cycle, not a synthetic worst-case benchmark over very large rendered arrays.

## Follow-up Analysis: Whole-channel profiling on benchat

**Status:** measured from a much larger pagination run

**Profiling context:**

- Performed on `benchat` after paginating through the whole available channel history while collecting the browser-gated entries.
- This produced many more samples than the earlier `little-italy` spot-check and therefore gives a better picture of how cost changes as the rendered list grows.

**Observed timings:**

- `message-list-scroll:classify-prepend`
  - usually `0ms` to `0.1ms`
  - occasional `0.2ms`
- `message-list-scroll:classify-append`
  - effectively `0ms`
- `message-list-scroll:apply-anchor`
  - mostly `0ms` to `0.3ms`
- `message-list-scroll:capture-anchor`
  - early samples around `0ms` to `0.5ms`
  - later samples commonly around `0.7ms` to `1.5ms`
  - outlier spikes around `2ms`, `3.5ms`, `5.7ms`, and `7.4ms`

**Updated conclusion:**

- The concern about cost increasing with `N` is valid, but the scaling hotspot is not `messageIdsMatchAsPrefix`.
- The real scaling cost is `captureAnchor()`, which scans rendered DOM nodes and repeatedly calls `getBoundingClientRect()`.
- The most promising optimization directions are:
  - stop calling `captureAnchor()` on every scroll event when older-page restoration is inactive
  - refresh the anchor only while `loadingMore` and `OlderPaginationState.mode === 'preserve-anchor'`
  - reduce repeated DOM rect reads inside `captureAnchor()`
  - avoid scanning every rendered message node if a narrower viewport-based search can be used

# Execution Order

- **Phase 1:** Task 1
- **Phase 2:** Task 2
- **Phase 3:** Task 3
- **Phase 4:** Task 4
- **Phase 5:** Task 5

# File Ownership Summary

| Task   | Creates/Modifies                                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Task 1 | Ralph spec files in `specs/message-list-jump-scroll/`                                                                                                                                                  |
| Task 2 | `src/components/Channel/Channel.tsx`, `src/components/Channel/channelState.ts`                                                                                                                         |
| Task 3 | `src/components/MessageList/MessageList.tsx`, `src/components/MessageList/hooks/MessageList/useScrollLocationLogic.tsx`, `src/components/MessageList/hooks/MessageList/useMessageListScrollManager.ts` |
| Task 4 | `src/components/MessageList/__tests__/MessageList.test.js`, `src/components/Channel/__tests__/Channel.test.js`                                                                                         |
| Task 5 | Ralph finalization files in `specs/message-list-jump-scroll/`                                                                                                                                          |
