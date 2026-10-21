# Debug tooling

Independent aids for working on the SDK from the example app. None of them is part of the SDK.

## `window.streamDebug`

Published by `<StreamDebugHandles />`, mounted once under `<Chat>` in `App.tsx`. Saves walking
the React fiber tree from the console to find the client.

```js
streamDebug.client; // StreamChat
streamDebug.channel; // active Channel
streamDebug.composer; // the active channel's MessageComposer
streamDebug.composers; // [{ tag, label, composer }] incl. thread/edit composers
streamDebug.uploads; // client.uploadManager.uploads, keyed by localMetadata.id
streamDebug.attachments; // the active composer's attachments
streamDebug.messages; // channel.state.messages
```

Every entry is a **getter**, so the console always reads current values rather than a snapshot
from the last render.

## Composer state inspector

Actions menu (⚡) → **Composer State**. A draggable, non-modal panel that live-subscribes to
every composer store via `useStateStore`.

**It only closes via its ✕ button** — not on outside click, not on Escape. A panel you have to
reopen every time you click into the composer cannot be used for watching state change. Two
things make that work:

- `closeOnClickOutside: false`, a per-dialog override the SDK already supports. It has to be
  passed by **every** call site that touches the dialog id, because `DialogManager.getOrCreate`
  applies it only when it _creates_ the dialog — and the Actions menu resolves it first to get
  an `open()`. Hence the shared `useComposerStateDialog()` hook; `useDialogOnNearestManager`
  cannot be used, as it accepts only `id`.
- `closeOnEscape: false` on `DialogAnchor`. That flag did not exist — `DialogAnchor` closed on
  Escape unconditionally — so it was added to the SDK as an additive, default-`true` prop,
  symmetric with `closeOnClickOutside`.

### …and the app underneath stays clickable

Two separate things blocked interaction, neither of them the dialog overlay (which is already
`pointer-events: none`):

1. **The focus trap.** `DraggableDialog` hardcoded `trapFocus`, which also made `DialogAnchor`
   render `role="dialog"` + `aria-modal="true"` — telling assistive tech the rest of the app is
   inert. `trapFocus` and `focus` are now props; the inspector passes `false` for both, so
   opening it does not steal focus from the composer either.

2. **A stale anchor box.** `DraggableDialog` applies the drag offset as a `transform` on its
   inner shell, so the `DialogAnchor` element keeps the layout box it was first positioned into
   — anchored to the Actions button, i.e. over the channel list — while the panel is painted
   somewhere else entirely. With the SDK's `.str-chat__dialog-contents { pointer-events: auto }`
   that invisible box swallowed every click in the sidebar.

   Fixed in `ComposerInspector.scss`: `pointer-events: none` on the anchor, `auto` on the
   visible shell. Verified — a point inside the stale anchor box but outside the painted panel
   now resolves to the app element underneath, and switching channels with the panel open works
   (the inspector follows the new channel).

   Worth knowing: this affects **any** draggable dialog built this way, so the other prompt
   dialogs in `ActionsMenu/` have the same latent issue once dragged. Left alone here because
   they are modal prompts where it does not bite.

It resolves composers from `useChatContext()` plus the client's composer cache rather than
`useMessageComposerController()`. That means it can show the channel composer **and** any
thread/edit composers at the same time (a picker appears when there is more than one), and it
does not have to be rendered inside `<Channel>` to do it.

Shows:

- **Flags** — `hasSendableData`, `allowsPendingUploads`, `compositionIsEmpty`, `contentIsEmpty`,
  `isCommandSendable`, colour-coded rather than printed as words. `allowsPendingUploads` reports
  whether a composition middleware declaring it is installed, which is how you confirm the
  Composer tab's "Allow sending while attachments are still uploading" switch reached this
  composer.
- **Identity** — `tag`, `contextType`, `threadId`, `editedMessageId`, so it is unambiguous
  which instance you are looking at.
- **Attachments** — a table of id / type / `uploadState` / live progress / preview. Progress is
  read from `client.uploadManager`, not from the attachment, because the value stored on an
  attachment carried by a message is frozen at compose time.
- **uploadManager records**, and every sub-composer store (text, link previews, poll, location,
  custom data), plus editing audit and config.
- **Middleware chains** — the ids for the composition, draft, text and pre/post-upload
  executors. The fastest way to check whether a `replace()` kept its slot or an `insert()` ran
  twice.
- **Copy snapshot JSON**.

### Two deliberate reaches past the public API

Both are isolated in `composerRegistry.ts` so they are easy to find if the SDK changes:

- `FixedSizeQueueCache` declares `keys`/`map` private, so enumerating cached thread/edit
  composers reaches into `cache.map`.
- `MiddlewareExecutor` keeps its middleware array private, so the chain ids are recovered by
  scanning the executor's own properties for the array of `{ id, handlers }`.

`serialize.ts` handles what `JSON.stringify` cannot: `File`/`Blob` handles on `localMetadata`,
functions in the config (`doUploadRequest`, `fileUploadFilter`), and self-referencing graphs.
Note its `seen` set is shared across the whole document, so a value referenced twice in
different branches prints as `[circular]` even when it is merely repeated — a deliberate
simplification that guarantees termination.

## Pagination scenarios

Actions menu (⚡) → **Pagination Scenarios**. Makes the message-pagination behaviour of
`stream-chat` (`MessagePaginator`, `channel.watch()` / `reload()`, `client.hydrateChannels`)
visible in the running app: gaps after a reconnect, hard deletes, failed sends, racing jumps. A
draggable, non-modal panel, like the composer inspector.

The message list keeps loaded messages in **windows** (the SDK's intervals): stretches of loaded
messages with nothing missing in between. Several can be loaded at once — say the newest messages
plus an older stretch you jumped to — and one is shown.

**Everything runs on a test channel that exists only in this tab**,
`messaging:pagination-scenarios-local` ("Pagination scenarios (local)" in the channel list,
`scenarioChannel.ts`). The dialog creates it once the user is connected, with you as its member,
and creates a new one if it is ever disposed. **Only the server is faked**: on that channel
instance `getOrCreate` — the request behind `watch()`, `reload()` and the paginator's own queries —
is answered from an in-memory timeline (`fakeChannelBackend.ts`, paging rules in
`fakeTimeline.ts`). Everything above it is the real SDK code. `markRead` is silenced and the
channel is left out of delivery reports, so no request carries a `sim-*` id. The workspace URL
never restores the test channel: watching it for real would create it on the server.
**Open in app** shows it; **Clear** empties its timeline and message list and resets the cards.

How to use it:

1. Open a group (Basics, Reconnect & gaps, Offline deletes, Jumps & stale head, Own messages &
   empty channel), then a scenario card. Cards are numbered once across all groups, so a number
   names the same scenario wherever it is shown. A card says, in four lines, the **Situation**, the
   **Rule** the SDK must keep, what to **Look for** on screen and the **Bug it prevents**. A
   scenario opens or closes the test channel in the app as it needs (the badge says which).
2. **Step** runs the next step (outlined) and **Run all** runs them all, stopping at a step that
   needs you: release a held answer, scroll, open the channel. The card says what to do and moves
   on by itself once you have; Step does it for you where it can. **Start over** resets the card
   and empties the test channel, like Clear.
3. After a step, and after the last one, the card shows ✓/✗ checks of the rule, read from the
   paginator's real state ("You're reading the head window (sim-111–sim-210)", "No window skips
   messages it never loaded"). While a card is open it also shows the channel's windows live
   (**Windows now**), so each step's effect shows next to it. The **Log** records each step, the
   windows after it, and every change of the windows with the SDK calls that made it.

**Scenarios from the React Native team** (numbered from 13, titles ending in their id: RN S1,
RN D2, …) come from that team's test page for the paginator work. They run at React Native's page
size, 25, so their ids read as on that page: a 60-message channel opens at sim-036–sim-060. Their
expected results follow the SDK's current rules, not the page's, which were recorded on an older
build. Their steps run by themselves, so **Run all** goes through without you, and their checks
can count the requests a step sent (the fake backend logs every query it receives).

**Held answers**: a race scenario holds the server's answer on purpose, so you have time to do
the second action (another jump, another tap, a live message) before the first request finishes.
A held answer is computed when it is released, as a server finishing the request then would.
**Release next** lets the oldest held request finish, **Release all** every one. Once a scenario's
release step is done the server answers at once again, so scrolling or jumping afterwards loads
without another release.

**Windows** shows the paginator in plain words: each window as a card — "window being read",
"head window" or "stored window" — with its size and its first and last message (`sim-011`; a real
message by the first 8 characters of its id, the full id on hover). Below that, a column of what
the window has loaded, tail to head as the list reads top to bottom (tail: the channel's oldest
end; head: its newest): **tail loaded**, **can load more tailwards**, **can load more headwards**,
**head loaded**. "Show raw state" prints the fields this is read from.

**Manual controls** (collapsed) drive it by hand:

- Seed N (and reload), add N, hard-delete an id (newest by default), truncate, add a failed or
  sending message of yours. Adding while **online** also dispatches `message.new` locally; while
  offline the timeline grows silently and the channel's watch is marked interrupted, as a dropped
  socket does. Deletes and truncation never send an event.
- **Reload** is `channel.reload()`, what connection recovery runs for an open channel.
  **Channel-list refresh** is what `queryChannelsAndHydrate` does for this channel: the newest 25
  messages through `client.hydrateChannels`. Real recovery is not triggered, because it also
  re-queries the channel lists from the Stream API.
- Delay every answer, or hold them, to reorder racing queries. Turning hold off releases
  everything.
- Queries use the page size of the last scenario run (25 after a React Native one).

Code layout:

- `paginationScenarios.ts` — the scenarios as data (situation, rule, look for, bug prevented,
  precondition, steps, checks), the shared steps and checks they are built from, and
  `ScenarioRun`, which walks the steps. The dialog renders them generically, under their groups.
- `rnScenarios.ts` — the React Native team's scenarios, built from the shared steps and checks
  (passed in, as `paginationScenarios.ts` lists them), plus the steps and checks only they use.
- `paginatorWindows.ts` — reads the windows in plain words; shared by the inspector and the
  checks, so both describe the same state.
- `scenarioChannel.ts` — creates the local test channel and shows it in the app or takes it away.
- `windowChangeLog.ts` — logs every change of the windows with the SDK calls that made it.

Not covered: a thread's replies. A thread reloads through `client.getThreadAndHydrate` and pages
through `client.getReplies`, client-wide endpoints keyed by thread, not the channel query this
backend fakes.

Caveats:

- Whatever you do to a `sim-*` message from the UI (react, reply, mark unread, send, retry a
  failed one) goes to the Stream API, which does not know the test channel and refuses it.
- The test channel and its messages live only in this browser tab: a page reload clears them, and
  the dialog creates a new one when opened.
- A channel-list query from the Stream API (a refresh, a reconnect) drops the test channel from
  the list, as the server does not have it; the dialog keeps working with it.
- `STREAM_CHAT_JS_PATH` in `examples/vite/.env` must point at a **built** `stream-chat-js`
  checkout with the pagination work, or you are looking at the published package's behaviour.
- The windows are read from `BasePaginator`'s protected `_itemIntervals` / `_activeIntervalId`
  (debug-only, read defensively), refreshed on a short tick: the intervals have no store.
