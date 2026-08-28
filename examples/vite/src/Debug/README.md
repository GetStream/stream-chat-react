# Debug tooling

Two independent aids for working on the message composer. Neither is part of the SDK — both are
example-app only.

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
