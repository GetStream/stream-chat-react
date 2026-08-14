# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Repository:** Stream's React Chat SDK - 40+ React components for building chat UIs with the Stream Chat API.

**Key Files:**

- `AI.md` - Integration patterns for users
- `AGENTS.md` - Repository structure & contribution workflow
- `developers/` - Detailed development guides

## Essential Commands

```bash
# Development (requires Node 24 — see .nvmrc)
# Yarn 4 is committed to .yarn/releases/ and activated via .yarnrc.yml
# (yarnPath). Any globally installed `yarn` shim launches it; no Corepack.
yarn install              # Setup (installs root + examples/* workspaces)
yarn build                # Full build (translations, Vite, types, SCSS)
yarn test                 # Run Vitest
yarn test <pattern>       # Run specific test (e.g., yarn test Channel)
yarn lint-fix             # Fix all lint/format issues (prettier + eslint)

# Type checking
tsc -p tsconfig.lib.json --noEmit   # The library. THIS is the real check.
yarn types:scripts                  # scripts/*.mts (Node strips types, it does not check them)

# i18n (see the i18n System section)
yarn build-translations   # Regenerate src/i18n/keys.ts from the t() call sites
yarn validate-translations # Drift gate: regenerate and fail on any diff

# Examples (workspaces under examples/*)
yarn start:tutorial       # Start the tutorial example dev server
yarn start:vite           # Start the vite example dev server
yarn examples:build       # Build all examples

# Before committing
yarn lint-fix             # ALWAYS run this first
```

> **`yarn types` checks nothing — do not rely on it.** It runs `tsc` with no `--project`, so it
> picks up the root `tsconfig.json`, which is a solution file with `"files": []`. It exits 0 even
> with a deliberate type error in `src/`. Use `tsc -p tsconfig.lib.json --noEmit`.
>
> `yarn types:tests` (`tsconfig.test.json`) reports ~1200 pre-existing errors and is not wired into
> CI. Treat it as unenforced.

## Architecture: Core Concepts

### Component Hierarchy

```
<Chat>                    # Root: provides client, theme, i18n
  └─ <Channel>            # Bootstrap + WS side-effects; provides the LLC channel instance
      ├─ <MessageList>    # Renders messages (or <VirtualizedMessageList>)
      ├─ <MessageInput>   # Composer with attachments/mentions
      └─ <Thread>         # Threaded replies
```

### Context Layers

```
ChatContext               # Client, active channel, theme, navigation
├─ ChannelInstanceContext # The LLC `channel` for this subtree (read via `useChannel()`)
├─ ComponentContext       # Customizable component slots
└─ MessageContext         # Per-message: actions, reactions, status
```

**Hooks:** `useChatContext()`, `useChannel()`, `useMessagePaginator()`, `useComponentContext()`, etc.

> **Removed in v15:** `ChannelStateContext` / `ChannelActionContext` and their
> `useChannelStateContext()` / `useCreateChannelStateContext` / `useCreateChannelActionContext`
> builders. Message/channel state is no longer copied into a React context — components read it
> directly from the LLC (`useChannel()` + `useStateStore(channel.messagePaginator.state, …)`), and
> actions are invoked on the LLC channel / navigation adapters.

### State Management

1. **Local state** (`useState`) - only UI/lifecycle flags on `Channel` (`isBootstrapping`,
   `bootstrapError`); no reducer, no React-held message list.
2. **External LLC state** - the message list, thread replies, and pinned messages live on
   `channel.messagePaginator` / `thread.messagePaginator` / `channel.pinnedMessagesPaginator`
   (`StateStore`s). Components subscribe via the `useStateStore` hook (backed by
   `useSyncExternalStore`) — this is the primary re-render driver.
3. **Context** - the channel instance and component-slot overrides (see Context Layers).

## Critical Architectural Patterns

### 1. Optimistic Updates & Race Conditions

**Owner:** the LLC (`stream-chat`), not React state.

- Optimistic sends go through `channel.sendMessage`, which ingests the pending message into
  `channel.messagePaginator` immediately (`ingestItem`, dedupe-by-id + sorted insert). Because
  `MessageList` subscribes to the paginator `StateStore`, the message renders at once — no React-local
  copy. The React SDK only customizes the request via `channel.configState.requestHandlers` (see
  `Channel/hooks/useChannelRequestHandlers.ts`).
- WebSocket events may arrive before/after the API response; **conflict resolution is in the paginator
  / LLC** (newest version wins, dedupe by id).
- **Gotcha:** thread replies are a separate paginator (`thread.messagePaginator`) from the channel's
  `channel.messagePaginator` — they are not dual-written; each is updated by its own event handling.

### 2. WebSocket Event Processing

**File:** `src/components/Channel/Channel.tsx` (`handleEvent`, registered in the bootstrap effect).

Re-renders on events are **not** driven from `Channel`. The LLC's own event handlers write into the
paginators' `StateStore`s, and components re-render via their `useStateStore` subscriptions
(`useSyncExternalStore`). There is **no** throttled `copyStateFromChannelOnEvent` dispatch anymore
(the old reducer + 500ms throttle were removed).

`Channel.handleEvent` now performs only **side effects**: online-status tracking, document-title /
unread-count updates on `message.new`, latest-message bookkeeping, and a full `channel.query(...)`
re-fetch on `user.deleted`.

- Message filtering: `parent_id` + `show_in_channel` determine thread visibility.

### 3. Message Enrichment Pipeline

**File:** `src/components/MessageList/utils.ts`

Messages are processed in order:

1. Date separator insertion (by date comparison)
2. Unread separator (only for other users' messages)
3. Deleted messages filtered/kept based on config
4. Giphy preview extraction (for VirtualizedMessageList)
5. Group styling applied (user ID + time gaps)

**Gotcha:** If `hideDeletedMessages=true`, date separators still needed when next message has different date.

### 4. Virtualization Strategy

**Files:** `src/components/MessageList/VirtualizedMessageList.tsx` + `VirtualizedMessageListComponents.tsx`

- Uses **react-virtuoso** with custom item sizing
- **Offset trick:** `PREPEND_OFFSET = 10^7` in `VirtualizedMessageListComponents.tsx` handles prepended messages without Virtuoso knowing
- Only visible items + overscan buffer rendered
- `skipMessageDataMemoization` prop exists for channels with 1000s of messages

### 5. Performance: Memoization

**Critical memoization:**

- `useStateStore(store, selector)` selectors: return small flat objects — the hook shallow-compares
  the selected slice and only re-renders on a real change. This is what scopes paginator-state
  updates (e.g. `MessageList` selects `{ messages, hasMoreNewer, isLoading }`).
- `areMessageUIPropsEqual` (`src/components/Message/utils.tsx`) — per-message `React.memo` comparator;
  checks cheap props first (highlighted, mutes.length).
- **Gotcha:** a change the selector or `areMessageUIPropsEqual` doesn't observe won't trigger a
  re-render.

> The old event throttling (500ms `copyStateFromChannelOnEvent`, 200ms unread, `markRead` 500ms,
> `loadMoreFinished` debounce) and the `useCreateChannelStateContext` string-serialization memoization
> are **gone** — re-rendering is now driven by `StateStore` subscriptions, not a throttled reducer
> copy.

## Critical Gotchas & Invariants

### DO NOT:

1. **Push messages into `channel.state`** - messages/threads/pinned are owned by the LLC paginators (`channel.messagePaginator`, `thread.messagePaginator`, `channel.pinnedMessagesPaginator`). Read them reactively via `useStateStore(channel.messagePaginator.state, …)`; the SDK's own event handlers perform the writes. There is no `channel.state.addMessageSorted()` / `removeMessage()` (removed in v15).
2. **Include `channel` in dependency arrays** - Use `channel.cid` only (stable), not `channel.state` (changes constantly)
3. **Change message sort order** - the paginator maintains order; local changes will conflict
4. **Assume thread replies live in the channel's message list** - a thread's replies are an independent paginator (`thread.messagePaginator`); they are not mirrored into `channel.messagePaginator`

### Thread vs. channel messages

- Main channel messages: `channel.messagePaginator` (LLC).
- Thread replies: `thread.messagePaginator`, owned by the `Thread` object (resolve via `client.threads`) — **independent** of the channel's message list.
- **No cross-store invariant:** a reply is not required to exist in the channel's message list. Whether a reply also shows in the channel is the server's `show_in_channel` flag, applied when the message is ingested.

### React Version Compatibility

SDK supports **React 17, 18, 19**.

**Forbidden in `src/`** (enforced by the `react-compat` block in `eslint.config.mjs`):

- `useId` from `react` → use `useStableId` from `src/components/UtilityComponents/useStableId`
- `useSyncExternalStore` from `react` → use the shim from `use-sync-external-store/shim`
- `useEffectEvent`, `use()` → not allowed (React 19-only)
- `ref` declared in a prop type or destructured from props → use `forwardRef` (React 17/18 only deliver `ref` to forwardRef'd components)

### Context Dependency Gotcha

```ts
useMemo(
  () => ({
    /* value */
  }),
  [
    channel.cid, // ✅ Stable - include this
    deleteMessage, // ✅ Stable callback
    // ❌ NOT channel.messagePaginator.state.items - changes constantly (subscribe via useStateStore)
    // ❌ NOT channel.initialized - changes constantly
  ],
);
```

## Testing Patterns

### Mock Builder Pattern

**File:** `src/mock-builders/`

```ts
// Standard test setup
const chatClient = await getTestClientWithUser({ id: 'test-user' });
useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannelData)]);
const channel = chatClient.channel('messaging', channelId);
await channel.watch();
```

**Key mocks:**

- `client.connectionId = 'dummy_connection_id'`
- `client.wsPromise = Promise.resolve(true)` (mocks WebSocket)
- Mock methods on channel, not entire channel object

### Component Test Structure

```tsx
render(
  <Chat client={chatClient}>
    <Channel channel={channel}>
      <MessageList />
    </Channel>
  </Chat>,
);
```

## Module Boundaries & Coupling

**Tightest Coupling:**

1. `Message.tsx` ↔ `MessageContext` - Every message needs actions
2. `Channel.tsx` ↔ `VirtualizedMessageList` - Complex prop drilling
3. `useStateStore` selectors ↔ Message memoization - a selector that returns an unstable/over-broad
   slice defeats the shallow-compare and re-renders the list

**Integration Risks:**

- Changing message sorting conflicts with the LLC paginator's ordering
- Reading LLC message state through anything other than `useStateStore` on the paginator (stale copies)

## Code Organization Standards

**Component structure:**

```
ComponentName/
├── ComponentName.tsx
├── hooks/              # Component-specific hooks
├── styling/            # SCSS files
├── utils/              # Component utilities
├── __tests__/          # Tests
└── index.ts
```

**Hook organization:** Component-specific hooks in `hooks/` subdirectories:

- `Channel/hooks/` - Channel state, typing, editing
- `Message/hooks/` - Actions (delete, pin, flag, react, retry)
- `MessageInput/hooks/` - Input controls, attachments, submission
- `MessageList/hooks/` - Scroll, enrichment, notifications

## Commit & PR Standards

**Commit format:** [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint)

```
feat(MessageInput): add audio recording support

Implement MediaRecorder API integration with MP3 encoding.

Closes #123
```

**PR Requirements:**

- [ ] `yarn lint-fix` passed
- [ ] `yarn test` passed
- [ ] `tsc -p tsconfig.lib.json --noEmit` passed (NOT `yarn types` — see Essential Commands)
- [ ] `yarn validate-translations` passed, if any `t()` call changed
- [ ] Tests added for changes
- [ ] No new warnings (zero tolerance)
- [ ] Screenshots for UI changes

**Release:** Automated via semantic-release based on commit messages.

### Deprecation Pattern

When deprecating, use `@deprecated` JSDoc tag with reason and docs link. Commit under `deprecate` type. See `developers/DEPRECATIONS.md` for full process.

## Build System

The build runs 4 steps in parallel via `concurrently`:

1. **`build-translations`** — Regenerates `src/i18n/keys.ts` from the `t()` call sites
2. **`vite build`** — Bundles 3 entry points (index, emojis, mp3-encoder) as CJS + ESM, no minification
3. **`tsc`** — Generates `.d.ts` type declarations only (`tsconfig.lib.json`) to `dist/types/`
4. **`build-styling`** — Compiles `src/styling/index.scss` → `dist/css/index.css`

All steps write to separate directories under `dist/` so they don't conflict.

## Styling Architecture

All component styles live in `src/styling/` (master entry: `src/styling/index.scss`) and in `src/components/*/styling/index.scss`. The Sass build compiles the tree to `dist/css/index.css`. There is no longer any step that pulls CSS/SCSS from an external design-system package.

### CSS Layers (cascade order, low → high)

```
css-reset → stream-new (compiled index.css) → stream-overrides → stream-app-overrides
```

See `examples/vite/src/index.scss` for reference implementation. Layers eliminate the need for `!important`.

### Theming Variables (3 tiers)

1. **Primitives** (`src/styling/variables.css`) — Figma-sourced: `--slate-50`, `--blue-500`, etc.
2. **Semantic tokens** (`src/styling/_global-theme-variables.scss`) — `--str-chat__primary-color`, `--str-chat__text-color` with light/dark variants
3. **Component tokens** (per-component SCSS) — `--str-chat__message-bubble-background-color`, etc.

## i18n System

**English only.** Every other language is supplied by the integrator via
`Streami18n.registerTranslation()`.

**There is no checked-in `en.json`.** The catalog has exactly two sources, and both are where the
copy is actually used: the inline `defaultValue` at each `t()` call site (562 keys), and
`src/i18n/runtimeDefaults.ts` (71 keys — hand-maintained, and the only translation data that
ships). A committed JSON locale was a third copy of the same strings that needed an extract pass
and a sync pass to stay honest. `yarn i18n:export` writes one on demand for a translator or TMS.

**Keys are stable dotted identifiers, with the English copy inline as i18next's `defaultValue`:**

```ts
const { t } = useTranslationContext();
t('message.status.sent.text', 'Sent'); // singular
t('channel.memberCount.title', {
  // plural: `count` is required
  count,
  defaultValue_one: '{{ count }} member',
  defaultValue_other: '{{ count }} members',
});
t('timestamp.MessageTimestamp', { timestamp }); // formatter key: no default
```

The inline default is what makes a partial custom dictionary safe — an unsupplied key still
renders English — and it keeps the copy visible at the call site.

- **Namespaces follow the source tree** (`message.*`, `messageComposer.*`, `poll.*`), so keys are
  predictable from the component. Genuinely shared copy lives in `common.*`. Modality is the leaf:
  `.label`, `.ariaLabel`, `.placeholder`, `.title`, `.description`, `.text`.
- **`keySeparator: false` must stay.** Keys are flat strings that happen to contain dots; several
  contain `...` in their copy, which `keySeparator: '.'` would mis-resolve.
- **Typed keys:** `src/i18n/keys.ts` (generated, type-only) declares `TranslationCatalog`.
  `src/i18n/types.ts` derives `TranslationKey`, `TranslationDictionary` (strict),
  `LooseTranslationDictionary` and `StreamTFunction`,
  which is what `useTranslationContext().t` is typed as — a typo is a compile error. Interpolation
  variables are typed for plural keys only (see the note in `types.ts` for why).
- **Runtime keys:** the ~10 keys resolved from a runtime value (a `stream-chat`
  `notification.message`, slash-command metadata, a language code, an integrator prop) go through
  `asDynamicKey()`. That brand is required, so every escape is deliberate and greppable.
  `src/i18n/externalStrings.ts` maps the `stream-chat` messages we recognise onto stable keys.
- **`yarn build-translations`** parses the `t()` call sites (`scripts/i18n-call-sites.mts`), joins
  them with `runtimeDefaults.ts`, and regenerates `keys.ts`. It hard-fails on three things:
  a key used with two different inline copies; a key called with no inline default and no
  `runtimeDefaults` entry (it would render as the raw dotted key); and a key present in _both_
  (the bundled value wins, so editing the call site would silently change nothing — this is the
  bug class that used to hide behind the old en.json).
- **`yarn validate-translations`** regenerates and fails on any diff to `keys.ts` — the drift gate.
- **There is no `i18next-cli`.** Its extract/`removeUnusedKeys` pass existed only to maintain
  en.json. Dead prose keys are now structurally impossible (a key exists because a call site
  declares it), which also retires the `preservePatterns` footgun that once nearly deleted the 57
  `language.*` keys.
- **The v14 -> v15 key mapping** lives in `ai-docs/i18n-v15-key-map.json` (603 rows) and is read by
  the integrator-facing guide. It is a hand-reviewed artifact — nothing regenerates it. The
  one-shot codemods that produced it and rewrote the call sites were deleted once applied; recover
  them from git history if a v14 -> v15 question ever needs re-deriving.
- **Date/time:** `Streami18n` wraps i18next + Dayjs. Only the `en` dayjs locale is bundled;
  integrators import their own and pass `dayjsLocaleConfigForLanguage`.

**Adding a translatable string:** call `t('namespace.component.thing.label', 'English copy')`, then
run `yarn build-translations`.

## Styling Architecture (Theming & Build Details)

All styles live in `src/styling/` (master entry: `src/styling/index.scss`) and in `src/components/*/styling/index.scss`. Component styles are imported by the master stylesheet and compiled to `dist/css/index.css` via Sass.

### CSS Layers & Theming

CSS layers control cascade order (no `!important` needed):

```
css-reset → stream-new (compiled SDK CSS) → stream-overrides → stream-app-overrides
```

See `examples/vite/src/index.scss` for the reference layer setup.

**Theming uses a 3-tier CSS variable hierarchy:**

1. **Primitives** (`src/styling/variables.css`) — Figma-sourced color palette tokens
2. **Semantic tokens** (`src/styling/_global-theme-variables.scss`) — Light/dark mode mappings (e.g., `--str-chat__primary-color`)
3. **Component tokens** (per-component SCSS) — e.g., `--str-chat__message-bubble-background-color`

### Build System

`yarn build` runs 4 tasks in parallel via `concurrently`:

1. `yarn build-translations` — Regenerates `src/i18n/keys.ts` from the `t()` call sites
2. `vite build` — Bundles 3 entry points (index, emojis, mp3-encoder) as ESM + CJS
3. `tsc --project tsconfig.lib.json` — Generates `.d.ts` type declarations to `dist/types/`
4. `yarn build-styling` — Compiles SCSS to `dist/css/index.css`

**Library entry points** (from `package.json` exports):

- `stream-chat-react` — Main SDK (all components, hooks, contexts)
- `stream-chat-react/emojis` — Emoji picker plugin (`src/plugins/Emojis/`)
- `stream-chat-react/mp3-encoder` — MP3 encoding for voice messages (`src/plugins/encoders/mp3.ts`)

Vite config: no minification, sourcemaps enabled, all deps externalized. Target: ES2020.

### i18n System

See the **i18n System** section above — English-only, dotted keys with the copy inline as
i18next's `defaultValue`. Access via `useTranslationContext()`, which only works inside `<Chat>`.

## Key Patterns for Development

### Adding Custom Components

1. Add to `ComponentContext` (`src/context/ComponentContext.tsx`)
2. Provide default implementation
3. Allow override via prop: `<Channel Message={CustomMessage} />`
4. Access via `useComponentContext()`

### Using StateStore (for reactive SDK state)

```typescript
import { useStateStore } from './store';
const channels = useStateStore(chatClient.state.channelsArray);
```

### Adding Translations

1. Call `t('namespace.component.thing.label', 'English copy')` — the key is namespaced by the
   source tree, the copy goes inline (see **i18n System**)
2. Run `yarn build-translations` to regenerate `src/i18n/keys.ts`
3. Never hand-edit `keys.ts` — it is generated, and CI fails on any drift. A key with no inline
   copy (a formatter expression, or one built from a runtime value) goes in
   `src/i18n/runtimeDefaults.ts` instead, which _is_ hand-maintained

## References

- **Integration patterns:** See `AI.md`
- **Repo structure:** See `AGENTS.md`
- **Development guides:** See `developers/`
- **i18n v15 migration (integrator-facing):** See `ai-docs/i18n-v15-migration.md`
- **Component docs:** https://getstream.io/chat/docs/sdk/react/
- **Stream Chat API:** https://getstream.io/chat/docs/javascript/
