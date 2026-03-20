# MessageList Jump-To-Latest Smooth Scroll

## Goal

Make `ScrollToLatestMessageButton` in the non-virtualized `MessageList` produce a smooth top-to-bottom animation on the newly loaded latest page when jumping from a disjunct older page.

Extend the same render-driven scrolling behavior to quoted-message and other `jumpToMessage(...)` jumps so the animation starts only after the target message set is rendered and respects jump direction.

Add a follow-up fix for older-page pagination so repeatedly prepending older message pages preserves the user-visible viewport without jump-backs, even when message rows contain media attachments.

## Success Criteria

- Clicking the button from an older disjunct page does not scroll the old page.
- The latest page swap happens first.
- After the latest page is rendered, the list starts from top and smoothly scrolls to the real bottom of that new page.
- The final scroll lands at exact bottom, including late layout changes like typing indicator or rendered message content.
- Quoted-message jumps do not scroll the old page before the target page renders.
- Quoted-message jumps scroll directly toward the target message, using the appropriate entry edge for older-vs-newer page jumps.
- Repeated older-page pagination keeps the same visible content anchored after each prepend.
- Older-page pagination remains stable when prepended messages include image/video/map attachments.

## Constraints

- Keep public `MessageList` and `ChannelActionContext` APIs backward compatible.
- Do not solve this by incrementally paginating through all newer pages.
- Keep changes additive and local to the existing channel/message list architecture.
- Preserve disjunct message-set semantics when switching between message pages.

## Non-goals

- Continuous animation through unloaded messages.
- Introducing a new public `MessageList` prop or `ChannelActionContext` API for jump animation state.

## Follow-up Analysis

- Browser verification on `http://localhost:5175/?mock_notifications=1&view=chat&channel=little-italy&thread=b472ce2e-ff3e-4fc0-8cef-8e75fe5002a4&theme=light` showed that repeated older-page prepends still drift after several successful pages.
- Early prepends preserved position, but later prepends added large amounts of height while `scrollTop` changed by only a few pixels, which means prepend compensation was skipped or computed against the wrong reference point.
- The current prepend controller relies on container-level `scrollHeight` deltas, which is too weak for real chat content once the user continues scrolling during fetches or rows reflow after render.
- Media attachments are a secondary risk factor. The inspected thread contains many image/video/map thumbnails with varied rendered heights. Most were already complete and sized, so attachments are not the primary root cause, but they can amplify drift when total-height-based compensation is used.
- The likely long-term fix is anchor-based prepend restoration: capture the first visible message id and offset before/during `loadingMore`, then restore that same message’s offset after prepend instead of preserving by aggregate list-height delta.
- Subsequent implementations of anchor-based restoration, center-anchor selection, and a bounded post-render settle window improved early and mid prepend behavior in the browser, but did not eliminate the later-page collapse.
- Latest built-browser verification still shows a severe failure on a later prepend:
  - before `175 -> 200` messages: `scrollTop 5256.5`, `scrollHeight 29876`
  - after prepend: `scrollTop 1131.5`, `scrollHeight 31028`
- That suggests the remaining issue is not only anchor choice. It likely involves later DOM settling or a competing scroll update after prepend restoration starts.
