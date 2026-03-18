# Decisions

## 2026-03-18 - Root cause

- The jump bug was caused by `jumpToLatestMessage()` reusing the debounced `loadMoreFinished()` path.
- That allowed `hasMoreNewer` and other “latest page” flags to flip before the latest `messages` array was committed to state.

## 2026-03-18 - Atomic jump state update

- Added a dedicated `jumpToLatestMessageFinished` reducer action in `channelState.ts`.
- `Channel.tsx` now dispatches latest messages, `hasMore`, and `hasMoreNewer` together immediately after `loadMessageIntoState('latest')` resolves.
- Public `ChannelActionContext.jumpToLatestMessage` remains unchanged.

## 2026-03-18 - MessageList animation strategy

- `MessageList` now tracks a local jump phase: `idle`, `waiting-for-render`, and `animating`.
- The jump button does nothing to the old page while the latest page is loading.
- The smooth scroll starts only after the rendered message-set signature changes, which guarantees that the latest page is mounted first.

## 2026-03-18 - Scroll management during jump

- Automatic scroll management remains disabled while the jump is waiting or animating.
- Typing-indicator-driven bottom scrolling is also gated during that window to prevent competing scroll calls.

## 2026-03-18 - Quoted-message jump handling

- Applied the same stale-dispatch cancellation to `jumpToMessage()` that was added for `jumpToLatestMessage()`.
- `jumpToMessageFinished` now restores message-list state directly from the target message set instead of waiting for a debounced `loadMoreFinished` callback.
- Highlighted-message scrolling now waits for the rendered target page before animating.

## 2026-03-18 - Direction-aware highlighted jumps

- Highlighted jumps no longer force a reset to the absolute top before animating.
- When switching to an older message page, the list starts from the bottom of that page and scrolls upward to the target.
- When switching to a newer page, the list starts from the top and scrolls downward to the target.
- When the target is already in the current or overlapping set, the list scrolls directly to the target without an edge reset.

## 2026-03-18 - Test coverage approach

- Added a `MessageList` regression focused on “no old-page scroll before latest page renders”.
- Added a `Channel` regression focused on “latest messages and latest-page flags update together”.
- Added focused regressions for `jumpToMessage()` and highlighted-message rendering order.
- Mocked `ChatView` hooks in the affected test suites because those suites currently do not mount `ChatView` providers by default.

## 2026-03-18 - Browser finding on older-page pagination

- Browser verification on the provided local thread reproduced repeated older-page prepends.
- Early prepends preserved position correctly, but later prepends did not: one reproduced case grew from `125` to `150` messages and from `scrollHeight 19299` to `24599` while `scrollTop` moved only from `6111` to `6114`.
- That confirms the remaining prepend bug is real in the browser and is not fully explained by the jump-to-latest work.

## 2026-03-18 - Scroll controller conclusion

- The current prepend preservation strategy in `useMessageListScrollManager.ts` is structurally too weak because it relies on total `scrollHeight` deltas.
- Preserving aggregate list height is not equivalent to preserving the visible user anchor once requests are asynchronous and row heights can reflow.
- A deeper scroll-controller change is needed: preserve prepend position by anchoring to a visible message id and its offset, not by `newScrollHeight - oldScrollHeight`.

## 2026-03-18 - Attachment/media impact assessment

- Media attachments are a secondary contributor, not the primary root cause.
- Browser inspection of the affected thread showed many image/video/map thumbnails with varied rendered heights.
- Most inspected images were already fully loaded and had concrete rendered dimensions, which suggests attachment sizing already reduces the worst layout-shift risk.
- Even so, mixed media layouts can still amplify drift, which is another reason total-height-based prepend restoration should be replaced with anchor-based restoration.

## 2026-03-18 - Anchor-based prepend iterations improved but did not finish the bug

- Implemented anchor-based prepend restoration, viewport-center-biased anchor selection, and a bounded post-render settle window.
- Removed debounced completion from the older-page `loadMore()` path and reverified with targeted tests plus rebuilt browser runs.
- Browser verification improved on early and mid prepends, but a later prepend still fails badly on the provided thread.
- Example latest built-browser failure:
  - before `175 -> 200` messages: `scrollTop 5256.5`, `scrollHeight 29876`
  - after prepend: `scrollTop 1131.5`, `scrollHeight 31028`

## 2026-03-18 - Updated conclusion for remaining prepend bug

- The remaining prepend failure is no longer just a “choose a better anchor” problem.
- The likely remaining causes are:
  - post-restore layout settling that continues after the current bounded window
  - a competing scroll-management or list-effect path that runs after explicit restoration
  - insufficiently strong DOM identity for the preserved anchor row on later prepends
- The most defensible next step is targeted runtime instrumentation of the prepend restore path before further algorithm changes.

## 2026-03-18 - Instrumented prepend result and policy change

- Runtime instrumentation showed the later prepend failure was not caused by lost anchors or competing scroll writes after restoration.
- On the failing `175 -> 200` transition, the chosen anchor still existed, the restore loop completed, and the anchor returned to its expected offset.
- The remaining “jump down” was therefore a consequence of the active preservation policy: when the user paginated from absolute top, the controller still tried to preserve the old viewport instead of keeping the user pinned to the top of the newly loaded page.
- Updated the older-page pagination behavior to use two explicit modes:
  - preserve the visible anchor when pagination starts near the top but not at the absolute top
  - stick to the top of the newly loaded page when pagination is triggered from absolute top
- Rebuilt browser verification confirmed the new behavior on the provided thread: repeated older-page prepends remained at `scrollTop 0` across the full `25 -> 225` pagination sequence.

## 2026-03-18 - Quoted jumps should not reuse older-page pagination state

- `jumpToMessage()` previously set `loadingMore`, which made the scroll controller treat a quoted-message jump as older-page pagination.
- Split that flow into a dedicated `loadingMoreForJumpToMessage` state and temporarily disabled previous-page loading while the highlighted jump is waiting/animating in `MessageList`.
- Focused `Channel` and `MessageList` regressions pass with that split in place.
- Rebuilt browser verification on the provided `benchat` repro still does not land on the expected target message, so the remaining bug is not explained solely by the shared loading flag.

## 2026-03-18 - Profiling result for prefix/suffix classification

- Added temporary browser-gated performance instrumentation for:
  - `message-list-scroll:classify-prepend`
  - `message-list-scroll:classify-append`
  - `message-list-scroll:capture-anchor`
  - `message-list-scroll:apply-anchor`
- Profiling procedure:
  - load the rebuilt app on the provided `little-italy` thread repro
  - set `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__ = { enabled: true, entries: [] }` in the browser
  - repeatedly scroll `.str-chat__message-list` to top to trigger older-page pagination
  - aggregate `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__.entries` by measurement name
- Measured live result from the rebuilt browser run:
  - `classify-prepend` ~`0.30ms`
  - `capture-anchor` ~`0.20ms`
  - `classify-append` ~`0ms`
- Current conclusion: the `messageIdsMatchAsPrefix` / `messageIdsMatchAsSuffix` scans are not a meaningful bottleneck in the measured real interaction. If performance work is needed later, DOM/layout work is still the stronger suspect.

## 2026-03-18 - Full-channel profiling points to anchor capture, not prefix scans

- A broader profiling run on `benchat` while paginating the full channel history produced many more measurements.
- Results stayed consistent for the classification helpers:
  - `classify-prepend` was generally `0ms` to `0.1ms`, with occasional `0.2ms`
  - `classify-append` was effectively `0ms`
- `apply-anchor` also remained small, mostly `0ms` to `0.3ms`.
- The cost that scaled with larger rendered lists was `capture-anchor`:
  - early measurements were often `0ms` to `0.5ms`
  - later measurements were commonly `0.7ms` to `1.5ms`
  - worst spikes reached roughly `2ms`, `3.5ms`, `5.7ms`, and `7.4ms`
- Updated conclusion:
  - keep prefix/suffix id scans as-is for correctness
  - if we optimize this path, focus on reducing `captureAnchor()` frequency and DOM reads rather than rewriting `messageIdsMatchAsPrefix`

## 2026-03-18 - Cached-rect anchor capture materially reduced the hotspot

- Implemented two targeted `captureAnchor()` optimizations:
  - stop calling it eagerly on every scroll event and only invoke it lazily while prepend anchor preservation is active
  - cache each candidate row's `getBoundingClientRect()` result once per capture and reuse it for visibility filtering, top-edge selection, center selection, and final offset calculation
- Rebuilt-browser profiling after the rect-caching change showed a clear improvement:
  - small/early captures were mostly `0ms` to `0.3ms`
  - common mid-range captures were roughly `0.4ms` to `0.9ms`
  - larger captures were typically `1.0ms` to `1.3ms`
  - the visible worst spike in the shared sample was about `2.6ms`
- This is materially better than the earlier full-channel profile where `capture-anchor` commonly reached `0.7ms` to `1.5ms` and spiked as high as `7.4ms`.
- Updated conclusion:
  - the `captureAnchor()` hotspot has been reduced substantially
  - `captureAnchor()` remains the dominant measured cost, but it is no longer an obvious first-priority problem unless the browser still shows user-visible jank
  - any further optimization should be more structural, such as reducing how many DOM candidates are scanned per capture

## 2026-03-18 - Instrumentation cleanup policy

- Removed the temporary `measureScrollWork(...)` call sites from the production scroll hooks after the profiling pass completed.
- Kept [`scrollInstrumentation.ts`](/Users/martincupela/Projects/stream/chat/stream-chat-react/src/components/MessageList/hooks/MessageList/scrollInstrumentation.ts) as a reusable manual-profiling helper with an inline note explaining that it is intentionally detached by default.
- Future profiling can reattach the helper temporarily around the exact code path under investigation without rebuilding the instrumentation utility from scratch.
- Re-enable procedure:
  - import `measureScrollWork` into the target scroll hook/helper
  - wrap the expression being profiled, such as `captureAnchor()`, prepend/append classification, or anchor restoration
  - in the browser console, set `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__ = { enabled: true, entries: [] }`
  - reproduce the interaction and inspect `window.__STREAM_MESSAGE_LIST_SCROLL_PERF__.entries`
  - remove the temporary call sites again once the profiling pass is finished
