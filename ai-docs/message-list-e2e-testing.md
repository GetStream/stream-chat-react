# End-to-end testing of the message list scroll behaviour

How to verify scroll behaviour of `MessageList` in real browsers, what we learned doing it for the iOS
anchor-restore fix (v14 [#3312](https://github.com/GetStream/stream-chat-react/pull/3312), master
[#3316](https://github.com/GetStream/stream-chat-react/pull/3316), issue
[#3311](https://github.com/GetStream/stream-chat-react/issues/3311)), and the traps that cost the most time.

Audience: maintainers and coding agents changing `useScrollLocationLogic`, `useMessageListScrollManager`,
`InfiniteScrollPaginator` or anything else that moves the list's scroll position.

## Why unit tests are not enough

jsdom has no layout, no scrolling engine and no momentum scrolling. It can prove the _logic_ (which branch
runs, which value is assigned) but not the _behaviour_ (where the list ends up on a real screen). The bug
that motivated this document only existed on iOS WebKit, only with a touch fling, and was invisible in
desktop Chrome, Firefox, desktop Safari and every unit test. Two of our first three "fixes" passed all unit
tests and a standalone browser harness and still did not work in the real app.

Use unit tests for the logic, and an end-to-end run on the real example app for the behaviour. Both are
needed; neither replaces the other.

## What to measure

For every older-page load, track the topmost visible message ("the anchor") frame by frame for ~1.5 s after
the page is prepended. The numbers that matter:

| Metric                                 | Meaning                                             | Healthy value                                                 |
| -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `bigFrameJumps`                        | frames where the anchor moved more than 100 px      | 0                                                             |
| `maxFrameJumpPx`                       | largest single-frame move                           | a few px (finger movement)                                    |
| `netMovePx`                            | where the anchor ended relative to where it started | ~0 in `preserve-anchor` mode                                  |
| `scrollTopBefore` / `scrollTopAfter`   | position when the page arrived / after settling     | after ≫ before, because the new page sits above               |
| `mode`                                 | which path the scroll manager took (see below)      | `preserve-anchor` for loads started near, but not at, the top |
| `scrollByCalls`                        | calls to `scrollBy` on the list                     | 0 on the anchor path                                          |
| `iosDetected`, `overflowHiddenSeen`    | whether the iOS momentum lock engaged               | true on iOS only                                              |
| `finalOverflowYInline` / `...Computed` | whether the list was handed back                    | `''` / `auto`                                                 |

Read the numbers together. A large `netMovePx` with `scrollTopAfter` of 0 is the signature of the iOS bug (the
list is back at the top, a page away from where the user was reading). A large jump in `stick-to-top` mode is
by design.

### The two scroll modes

`useMessageListScrollManager` decides once, when loading starts, from the live `scrollTop`:

- `stick-to-top` (`scrollTop <= 1`): the user hit the very top, so the new page is shown from its top. The
  anchor "moves" by a whole page height. This is intended, not a failure.
- `preserve-anchor` (`1 < scrollTop < loadMoreScrollThreshold`): the message being read must stay where it
  is. This is the path the iOS fix is about.

A fling on iOS frequently reaches exactly 0 before the page arrives, so many iOS loads are `stick-to-top`.
To get `preserve-anchor` samples you need loads that start a little below the top; expect to discard some runs.

## Setup

1. **A worktree per task**, named after the issue, branched from the right base (`master` for v15,
   `release-v14` for v14). Run `yarn install --immutable` in it. If `yarn types` reports missing exports from
   `stream-chat`, the installed copy is older than `package.json` asks for.
2. **A real channel with a long history.** Pagination needs more than one page; the iOS bug needed content
   with images and polls (tall, late-sizing messages). A channel with 250+ messages is ideal. Synthetic
   text-only pages did not reproduce the real failure.
3. **Credentials.** `examples/vite/.env` (gitignored) must contain a test app's `VITE_STREAM_API_KEY`,
   `VITE_USER_ID`, `VITE_USER_TOKEN`. Copy it from another worktree you own. Never print values, never commit
   it. Comment out `STREAM_CHAT_JS_PATH` if the path it points to does not exist in the new worktree.
4. **Build the library, then run the example.** The example consumes `dist/`, not `src/`:
   `yarn build` in the repo root, then `npx vite --port <port> --strictPort --host 127.0.0.1` in `examples/vite`.
   After every source change rebuild. Check what the dev server really serves before trusting a run:
   `curl http://127.0.0.1:<port>/@fs<abs path to dist/es/.../useScrollLocationLogic.mjs> | grep <marker>`.
5. **Use `127.0.0.1`, not `localhost`.** Another dev server may be bound to `localhost`'s IPv6 address on the
   same port and answer instead, serving different code.
6. **A results collector.** A ten-line HTTP server that appends each POST body to a JSONL file. The probe
   below posts results to it, so desktop browsers and the simulator can report without any inspector access.

## The probe

Add a temporary module to the example app (and an import in `main.tsx`; remove both before committing). It must
not be part of any PR. It does three things:

1. Finds the real scroll container. On master that is the inner `.str-chat__message-list-scroll`, not
   `.str-chat__message-list`, which does not overflow. On v14 it is `.str-chat__message-list`. Wrap
   `scrollBy` on that element to count calls.
2. Every animation frame, records the topmost visible `[data-message-id]` and its offset from the list's top.
   When a `MutationObserver` sees a prepend (the first message id changed and the count grew), freeze that
   record, then sample the same message's offset for ~1.6 s and compute the metrics above.
3. Posts the result to the collector and shows it in a fixed banner (useful in the simulator).

Core of the measurement:

```ts
const topAnchor = () => {
  const listTop = list.getBoundingClientRect().top;
  for (const el of list.querySelectorAll<HTMLElement>('[data-message-id]')) {
    const r = el.getBoundingClientRect();
    if (r.bottom > listTop) return { id: el.dataset.messageId!, off: r.top - listTop };
  }
};
// after a prepend: each frame, offset = anchorEl.getBoundingClientRect().top - listTop
// delta = offset - previousOffset;  big jump = |delta| > 100;  net = lastOffset - anchor.off
```

The probe can also drive the page: `?drive=near` sets `scrollTop = 120` repeatedly to trigger loads
(desktop browsers, where you cannot swipe), and a `regress` script runs the scenarios in
[Regression scenarios](#regression-scenarios). Gate everything behind an explicit `&go=1` parameter so stale
tabs reloaded by hot reload stay silent.

When the logic itself is in doubt, add **temporary** logging inside the hook and scroll manager (push
`{ev, mode, liveTop, branch, target, cur, afterSet}` objects to `window.__sm` and post them with the result).
This is what showed that the restore _was_ running and its `scrollTop` assignment _was_ succeeding, but iOS
pulled the position back on the next frame. Remove all of it before committing.

## Driving the browsers

### iOS Simulator (the only place the iOS bug appears)

- Real touch swipes, not scripted scrolls. A swipe from `(200, 200)` to `(200, 600)` over 0.5 s produces a
  fling with momentum. About 10 to 25 swipes are needed per older-page load, because after each load the list
  is thousands of pixels taller.
- Navigate with the control tool's `open_url`. If Safari is in address-bar edit mode that call does nothing;
  tap the address bar, confirm with a screenshot that the edit field is active, then type the URL.
- **Never type into the simulator while a page with a message composer may have focus.** An Enter then sends
  the text as a real message. This happened once; the stray message had to be deleted.
- Screenshots lag the screen by a few seconds. Wait, then screenshot again before concluding anything.
- If WebSockets suddenly fail only in the simulator (`initial WS connection could not be established` while
  HTTPS works), `xcrun simctl shutdown` / `boot` the device and reopen the Simulator app.
- The page is not mobile-responsive in `examples/vite`'s sidebar on v14; open a channel from the sidebar or
  deep-link it. On master use the `select=<channel name>` approach below.

### Desktop Safari, Firefox, Chrome

- `open -a "<Browser>" "<url>"` works for Safari and Firefox. Run browsers one at a time; parallel runs
  interfere.
- Scripted scrolling (`scrollTop = 120`) triggers the same loads. This is enough to prove "no regression, no
  jump" on desktop, but it cannot reproduce the iOS bug (there is no momentum).
- Real Chrome via `open -a` opened no visible window on some runs, and screenshots taken with `screencapture`
  showed only the wallpaper (no screen-recording permission), so you cannot see the page. The Chrome
  extension tools work, but a tab in a background window is throttled: `requestAnimationFrame` stops and long
  waits time out. Keep scripts for that tab short, timer-only and under ~40 s per call.
- The built-in preview browser pane does no layout while it is hidden (`scrollHeight` is 0), so it cannot
  measure scrolling.
- Firefox and Safari restore the last workspace from storage. A thread left open by a previous run can hide
  the channel list; pass a fresh `workspace=channels` parameter.

### Master (v15) app specifics

- `?channel=<id>` does not open a channel. Either click the channel preview by name (`select=Little-Italy` in
  the probe: click until messages are rendered, not until "a scroller exists", because an empty scroller
  exists in Firefox before any channel is open), or deep-link with a `workspace` parameter; the app writes
  one into the URL after you select a channel.
- The scroll container is `.str-chat__message-list-scroll`; the app re-mounts it after the channel loads. Look
  the element up fresh at every step; a reference taken early points at a detached node and every later
  measurement is meaningless. Likewise tolerate a moment where it does not exist.
- On narrow windows opening a thread replaces the channel view. Run the thread scenario last.

## Method: baseline, fix, compare

1. **Baseline first.** Build the original code and run the exact same flow. If you cannot reproduce the bug
   on the unmodified code in the real app, you have not understood it yet. We lost a lot of time because the
   standalone harness reproduced a bug (oscillating `scrollBy`) that the real app did not have as its main
   failure.
2. **Apply the change, rebuild, rerun the same flow.** Confirm with the `curl ... | grep marker` check that
   the server serves the new code.
3. **Compare numbers, not impressions.** Same channel, same swipes, same probe. Collect several loads. Note
   the `mode` of each; compare like with like.
4. **Mutation-check the new unit tests.** Temporarily put the original code (or remove the new line) back and
   confirm the new tests fail. A test that passes both ways guards nothing, though it can still be a useful
   regression guard for an unchanged path; label it as such.
5. **Regression pass** on the fixed build (next section), also compared against the original build. A number
   that looks odd (for example jump-to-latest ending ~450 px from the bottom on v14) is only a regression if
   the original build gives a different number. It was identical, so it was pre-existing.

## Regression scenarios

Run on the original and on the fixed build, in Safari, Firefox, Chrome and the iOS simulator, and compare:

1. **Initial position:** the list opens at the bottom (distance from bottom ~0).
2. **Send a message while at the bottom:** the list stays at the bottom (then delete the test message).
3. **Scroll up, jump to latest:** the jump button appears and brings the list to the bottom.
4. **Paginate two or more older pages, then jump to latest:** reaches the bottom. This catches a restore flag
   that never clears and silently blocks `scrollToBottom`.
5. **Switch channel in the middle of an older-page load, then come back:** the list is intact, no page errors,
   and the list's inline `overflow-y` is `''`. This catches a leaked iOS overflow lock on unmount.
6. **Open a thread:** the thread's own list opens at its bottom. (Threads share the same hooks.)
7. **Pagination from the absolute top (`stick-to-top`):** `scrollTop` stays 0 and the new page shows from its
   top; unchanged by design.
8. **Content growing above the anchor after the restore started** (an image loading late): no drift.

Scenarios not yet automated: jumping to a message or search result and reaching the live head, loading newer
pages while scrolled up, a new message from another user arriving while scrolled up, `VirtualizedMessageList`,
thread pagination.

## What we learned

**The root cause on iOS was momentum scrolling, not the algorithm.** After the finger lifts, iOS keeps a fling
animating and that animation overrides programmatic scroll positions on every frame. The restore ran, its
`scrollTop` assignment succeeded (the value read back immediately was correct), and the next frame the
position was pulled back toward the top, repeatedly, until the settle timeout. Hiding the list's `overflow-y`
ends the fling; handing it back once the position settles restores scrolling. It is applied only where
`CSS.supports('-webkit-touch-callout', 'none')` is true (iOS WebKit, where the scrollbar is an overlay so
nothing shifts), never on desktop.

**A relative correction is fragile; an absolute one is idempotent.** `scrollBy(deltaMeasuredFromGetBoundingClientRect)`
can flip between two positions when the geometry read after a scroll is stale. Computing the target from the
anchor's layout offset (`offsetTop`, which ignores scroll) and assigning `scrollTop` is safe to repeat. This
alone was not enough on iOS (the real failure was momentum), but it is still the right shape.

**The standalone harness proved the wrong thing.** It validated the algorithm and missed the physical cause.
The real example app with real touch on the real data was the only setup that failed the way users saw.
Always finish with the real app.

**Master was not a copy of v14.** Master's anchor capture/restore was stubbed out and `MessageList` never
passed `loadingMore` to the scroll manager, so older pages went through the manager's fallback: a one-shot
relative `scrollBy(heightDelta)`. The master fix reconciles that (anchor logic back, paginator `isLoading`
passed as `loadingMore`) before the iOS-specific part can matter. Wiring `loadingMore` is the riskiest part
because every load, not just older pages, now flows through it.

**Small things that look like bugs and are not:**

- A constant ~20 px between where the anchor was and where it ended is the loading indicator appearing before
  the anchor is captured. Compare against the position at the moment loading started.
- A multi-thousand-pixel "jump" in `stick-to-top` mode is the new page's height, by design.
- Chrome and Firefox often need no correction at all (native scroll anchoring); the fix is a no-op there,
  which is the correct outcome.

**Automation traps (each cost at least one wasted run):**

- Stale element references after the app re-mounts the scroller.
- A parallel/old tab still running because the page hot-reloaded; give each run a unique label and filter by
  it, and keep stale tabs silent with an opt-in parameter.
- A probe that races the app's own initial autoscroll: wait for layout to settle, then park the list.
- A probe that corrupts its own measurement (making the geometry "unstable" before the anchor is captured).
- The probe resetting a flag inside a callback that fires after the code it is meant to observe.
- Reading a result before the 1.5 s measurement window ended; screenshots and results lag.
- Concluding from a missing result that the browser is "fine". No result means no result.
- Credentials: reading variable _names_ is enough to know which `.env` to use; never echo values.

## Data hygiene

The test channel is a real app. Sending a message to test "stays at the bottom" is fine when you own the
channel, but delete it afterwards through the app's own menu (it becomes "Message deleted"), and verify it is
gone. Prefer a write guard in the probe that blocks non-GET requests to the API during runs that are not meant
to send.

## Checklist

- [ ] Reproduced on the unmodified code in the real app, with real touch on iOS.
- [ ] Built and verified the served bundle contains the change.
- [ ] Several loads on the fixed build, `mode` recorded, compared with the baseline.
- [ ] New unit tests fail on the old code and pass on the new.
- [ ] Regression scenarios identical between old and new builds in Safari, Firefox, Chrome and iOS.
- [ ] Full suite, `yarn types`, `yarn types:scripts` (master), lint and prettier pass.
- [ ] Probe, `main.tsx` import, harness files and servers removed; test messages deleted; `.env` not committed.
- [ ] Gaps listed honestly in the PR (iOS 26, a physical device, anything not automated).
