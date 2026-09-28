# `Channel`: scope to the instance, not the cid

Status: **proposed.** Target: `release-v15`.

## The finding

`cid` names a _conversation_. It does not identify the object representing it. Two different
`Channel` instances can carry the same `cid`: the client's cache is dropped on `disconnectUser`, an
app can hold channels from more than one client, and a re-created channel comes back as a new
object.

Anything scoped to "the channel" therefore has to follow the **instance**. Two of `ChannelInner`'s
three effects already did — `[channel]` for `activate`/`deactivate`, and
`[channel.messagePaginator, …]` for the search jump. The bootstrap effect did not: it depended on
`[channel.cid, channelQueryOptions, readEventsEnabled, initializeOnMount]`, with
`react-hooks/exhaustive-deps` disabled on the line above — the rule that would have flagged
`channel` was switched off by hand. `Channel` then keyed its subtree on the same axis
(`key={channel.cid}`), so nothing caught the gap.

Probed on the unfixed code, swapping in a new instance for the same cid:

```
sameCid: true, sameInstance: false, secondWatched: 0, secondSubscribed: 2
```

The replacement instance is **never watched**, and the event handler stays registered on the old
one, while children — which read the instance from context and subscribe to _its_ stores — have
already rebound to it. Data follows the instance; setup does not.

## Why it was on the wrong axis

`CLAUDE.md` said, under DO NOT:

> **Include `channel` in dependency arrays** — Use `channel.cid` only (stable), not `channel.state`
> (changes constantly)

That conflates the instance with its mutable state. The instance reference _is_ stable for a given
channel; `channel.state` is what churns. The rule forbade the stable thing and justified it with the
unstable one, and the suppressed lint rule is where it was enforced.

## Change

1. The bootstrap effect depends on `channel`, not `channel.cid`. The `exhaustive-deps` suppression
   stays — `handleEvent` is re-created every render and the effect must not re-run for it — but its
   comment now says what is excluded and why.
2. `Channel` keys its subtree on instance identity (`getChannelInstanceKey`, a `WeakMap` + counter,
   prefixed with the cid so it stays readable in DevTools) rather than on `cid`. A replacement
   instance now resets the subtree that belongs to it; the same instance re-rendered does not.
3. `ChannelManagementView` drops out of edit mode on instance change rather than cid change — a
   re-created channel is as good a reason to leave a half-finished form as a different one.
4. The `CLAUDE.md` rule is rewritten to say which axis is which, and its example now shows
   `channel` as the dependency with `channel.cid` called out as the wrong one.

Behavior only changes where it was previously broken: same cid, new instance. Same-instance
re-renders and ordinary channel switches are untouched.

## Removing the key

Done, in the same change. `Channel` no longer keys `ChannelInner`, so a channel switch re-renders
the subtree instead of rebuilding it. What the rebuild was providing moved to where the state
actually lives:

- **The message lists key themselves.** `MessageList` and `VirtualizedMessageList` are thin
  wrappers around a `…WithContext` inner component; each now gives that inner component
  `key={getChannelInstanceKey(channel)}`. Scroll position, Virtuoso's bookkeeping and the rest of
  the list's local state are scoped to the channel instance being shown, and nothing else is torn
  down with them. `Thread` keys its own list on the thread plus the same instance key.
- **The bootstrap flags needed nothing.** This is worth recording because it is the opposite of
  what it looks like. `isBootstrapping` and `bootstrapError` are set from the current channel
  _synchronously_ inside the bootstrap effect: an async function body runs to its first `await`, and
  neither the `if` branch's `setIsBootstrapping(true)` nor the `else` branch's pair of resets has
  one before it. I first added explicit resets for them, could not write a test that failed without
  those resets, and on reading the effect properly found they were redundant. They were removed
  again.
- **The channel context value is memoized on the instance** rather than being an inline object.
  Harmless while every channel change rebuilt the subtree; now that it does not, the value should
  change when the instance does and not on every render.
- **`ChannelInner`'s props no longer declare `key: string`.** `key` is not a prop — React consumes
  it — so the declaration only ever described the call site. Worth noting how this surfaced: `yarn
types` passed while `yarn build` failed on it (`TS2741`), so the declaration build is the
  stricter gate of the two.

Nothing else under `Channel` turned out to hold channel-scoped local state: the composer's UI is
derived from the LLC composer instance, which is itself resolved per channel, and the message
list's dialog manager sits inside the part that is keyed.

### Tests

`src/components/Channel/__tests__/channelSwitchReset.test.tsx` pins both halves: the channel
container element survives a switch (the subtree is not rebuilt) while the message list's main panel
does not (the list is), a replacement instance for the same cid rebuilds the list, a re-render with
the same instance rebuilds nothing, and neither a spinner nor a failure from the previous channel
survives into the next one. Restoring the key makes the first of these fail.

## Collapsing `Channel` and `ChannelInner`

With the key gone, the split had one job left: return early for a missing channel, before any hook
ran. That is a real React constraint — `ChannelInner` calls 13 hooks that dereference `channel`
(`useStateStore(channel.configState, …)`, `useState(!channel.initialized && …)`, every effect) — so
the wrapper could not simply be deleted while `channel` stayed optional.

The question is whether the optional channel earns its keep, and it does not. A `Channel` with no
channel has nothing to provide: every context it supplies, every hook it runs and every child it
enables needs one. What to show while nothing is selected is the application's layout concern, and
the vite example already treats it that way (`{mainChannel && <Channel channel={mainChannel}>…}`).
The source said as much already, above the prop:
`// todo: Channel should not be showing "no channel" content if the channel does not exist`.
Nothing in `src` or `examples` passed `EmptyPlaceholder`.

So:

- `ChannelProps.channel` is **required** and `EmptyPlaceholder` is **removed** (breaking, documented
  in `ai-docs/ai-migration-v14-v15.md`).
- The internal `ChannelContainer` is exported as **`ChannelPlaceholder`** — the same
  `.str-chat__channel` column with no channel bound, so an application that wants the layout slot
  filled while nothing is selected has it in one import instead of reproducing the SDK's CSS.
- `Channel` and `ChannelInner` are **one component**. No early return, so no reason for the hooks to
  live a level down.

The tutorial example needed the corresponding guard (`if (!client || !channel) return …`), which is
the whole migration for a caller: one conditional, or `ChannelPlaceholder`. `yarn examples:build`
catches this class of break and is worth running on any `Channel` API change — the unit suite does
not.

## Moved out: the unread count in `document.title`

`Channel` wrote `document.title` from its `message.new` handler. That is not a channel's job, and
scoping it to a channel produced five defects at once, all verified in the source before the move:

1. it counted only the open channel (`channel.countUnread()`), so messages elsewhere never showed;
2. it did nothing in a threads view, where v15 mounts no ambient `Channel` -- leaving a number that
   belonged to a channel the user had left;
3. it skipped thread replies (`!parent_id || show_in_channel`);
4. it never restored the title -- `(3) Your app` outlived reading the messages;
5. it compounded, because bootstrap re-read the already-prefixed title as the new "original".

**Removed with no SDK replacement.** The intermediate design here was an SDK component, and the
reason it was rejected is the useful part of the record: a component that knows the unread counts
still does not know whether the user is _looking at_ the channel those unreads are in, so it cannot
decide what the title should say. Everything it could offer was either a guess (reading
`document.title` at mount as a "base title" to build on -- an accident of timing, not the
application's title) or a pass-through of counts the application can read itself.

What is left in the SDK is the removal: no `document.title` write, no `activeUnreadHandler`, and no
`originalTitle` or `readEventsEnabled` subscription that existed only to feed them.

`examples/vite/src/DocumentTitleManager` carries the working implementation as application code --
a component rendered inside `Chat` that reads `total_unread_count` off the events that carry it,
reads `unreadThreadCount` off `client.threads`, builds the title through a required `formatTitle`,
and restores the page's previous title on unmount. Both counts are user-scoped rather than
view-scoped, so neither needs an active channel or thread, and they are deliberately named for
their units (`totalUnreadChannelMessageCount`, `totalUnreadThreadCount`) because one counts messages
and the other counts threads; adding them is meaningless.

Coverage note: the SDK component had 13 tests, which went with it. The example workspace has no test
runner (`dev`, `build`, `preview` only), so the moved code is checked by `tsc` and the example build
alone.

## Removed: the `!channel.watch` branch

`Channel` rendered a "Channel Missing" placeholder when `channel.watch` was falsy. `watch` is a
method on the `Channel` prototype, so this was a duck-type check for "is this really a `Channel`" —
it traces to `1e02fd56d` (2020-04-10) and was carried through every refactor since. With `channel`
required and typed it is unreachable, it is shadowed for the only realistic path (the bootstrap
calls `channel.watch()` and throws into the error branch first), no test covered it, and its copy
claimed the channel was missing when one had been provided.

Removing it took the `channel.channelMissing.text` key with it. Two things that surfaced there and
are worth keeping in mind for any key removal:

- **`validate-translations` is `build-translations && git diff --exit-code`** — a drift gate against
  the committed tree, so it reports the intended removal until the regenerated `src/i18n/keys.ts` is
  committed. It is not part of `yarn lint`, despite what `AGENTS.md` says.
- **Removing a key is a compile break for strict dictionaries.** `TranslationDictionary` is exact,
  so any locale file still declaring the key fails with `TS2353`. Both of the vite example's
  dictionaries did, and `yarn examples:build` is what caught it.

## Superseded: what removing the key was thought to require

The obvious next question is whether the key is needed at all, given children subscribe to reactive
stores. For **data**, it is not: `useStateStore` keys its subscription on the store, the store comes
off the instance, and a new instance means a resubscribe with no `cid` in the path.

What the key still does is reset state that is _not_ reactive — Virtuoso's scroll offset,
`suppressAutoscrollWhileLoadingOlder`, `floatingDateItemsRenderedRef`, `MessageList`'s
`listElement`. A subscription never resets a scroll position, and neither message list references
the channel at all for this purpose.

Removing it therefore means:

- resetting `isBootstrapping` and `bootstrapError` on instance change, which the remount does today;
- giving the message lists their own instance-scoped reset (a key of their own, or reset effects);
- adding the tests that would have caught the absence of both. Removing the key today leaves the
  suite green, which says the reset is **untested**, not unnecessary.

That is a separate change. This one puts everything on the right axis first, which is what makes it
safe to attempt.

## Tests

`src/components/Channel/__tests__/channelInstanceAxis.test.tsx`. Two of them fail on the previous
axis: the replacement instance is bootstrapped, and it receives the channel event subscription. The
`activate`/`deactivate` test passes either way, which is the point — that effect was already on the
instance.
