# AGENTS.md

Guidance for AI coding agents (Claude Code, Copilot, Cursor, Codex, Aider, etc.) working in this repository. Human readers are welcome, but this file is written for tools.

> **Single source of truth.** `CLAUDE.md` contains nothing but `@AGENTS.md`, which Claude Code expands into this file. Edit this file only — never fork guidance into `CLAUDE.md`.

Agents should prioritize API stability and high test coverage when changing code.

## Repository purpose

Stream's React Chat SDK — React components, hooks and contexts for building chat UIs on the Stream Chat API. The published package (`stream-chat-react`) lives at the repo root; `examples/*` are private Yarn workspaces consuming it via `workspace:^`.

This is the **v15** line, developed on `release-v15`. It is built on `stream-chat` v10 (the "LLC"), which owns message, thread and composer state; this package renders it.

## Tech & toolchain

- **Language:** TypeScript + React
- **Runtime:** Node 24 (`.nvmrc` — use `nvm use`)
- **Package manager:** Yarn 4 (Berry). The binary is committed under `.yarn/releases/` and activated via `yarnPath` in `.yarnrc.yml`. Any globally installed `yarn` (even classic 1.x) acts only as a launcher — no Corepack required.
- **Workspaces:** Yarn workspaces monorepo (`examples/*`)
- **Dependency versions:** read them from `package.json` (`peerDependencies`, `dependencies`, `devDependencies`). They change with every release, so they are not repeated here.
- **Testing:** Vitest + React Testing Library (+ `vitest-axe` for a11y). There is no Jest and no Playwright/e2e suite in this repo.
- **Bundler:** Vite 8 / Rolldown (library mode); `tsc` emits declarations only
- **Styles:** Sass compiled to `dist/css/`. Consumers override via CSS layers (see README) — never edit compiled CSS.
- **i18n:** the runtime is `@stream-io/i18n` (a regular dependency); this package owns only its key catalog and bindings
- **Lint/format:** ESLint (flat config, `--max-warnings 0`) + Prettier
- **CI:** GitHub Actions — lint + types, build + bundle validation, tests with coverage
- **Release:** Conventional Commits + semantic-release (`commitlint.config.mjs`, `.releaserc.json`)

### Root configuration files

`.nvmrc` · `.yarnrc.yml` · `eslint.config.mjs` · `.prettierrc` / `.prettierignore` · `tsconfig.json` (solution) + `tsconfig.lib.json` (src) + `tsconfig.test.json` (tests) + `tsconfig.scripts.json` (scripts) · `vite.config.ts` · `vitest.config.ts` / `vitest.setup.ts` · `axe-helper.js` · `commitlint.config.mjs` · `.releaserc.json` · `.lintstagedrc.json` / `.lintstagedrc.fix.json` · `codecov.yml`

Respect repo-specific rules. Do not suppress lint rules broadly; justify and scope every exception.

## Project layout

- `src/` — library source: `components/`, `context/`, `hooks/`, `store/`, `i18n/`, `styling/`, `a11y/`, `plugins/`, `utils/`, `types/`, `constants/`, `mock-builders/`
- `src/plugins/` — separately exported entry points: `ChannelDetail`, `Emojis`, `SlotGeometry`, `SlotLayout`, `encoders`
- `scripts/` — build/validation scripts
- `examples/` — private example workspaces: `examples/tutorial` (one folder per tutorial step), `examples/vite` (complete app)
- `ai-docs/` — integrator-facing migration guides (`ai-migration-v14-v15.md`, `i18n-v15-migration.md`, `instance-configuration.md`, …) and the hand-reviewed `i18n-v15-key-map.json`
- `developers/` — dev notes (`BRANCHES.md`, `COMMIT.md`, `DEPRECATIONS.md`, `DEVELOPMENT.md`, `DOCUMENTATION.md`, `PR.md`, `RELEASE.md`)

Use the closest folder's patterns and conventions when editing.

## Essential commands

```bash
yarn install              # Root + examples/* workspaces

# Build
yarn build                # clean + 4 parallel steps (translations, vite, tsc types, sass)
yarn start                # tsc -p tsconfig.lib.json --watch (emit .d.ts on change)
yarn start:css            # watch + recompile SCSS

# Tests
yarn test                 # vitest run (single pass)
yarn test MessageList     # filter by file path substring
yarn test -t 'marks read' # filter by test name
yarn test:watch           # watch mode
yarn coverage             # v8 coverage (what CI runs)

# Lint / format
yarn lint                 # prettier --list-different + eslint --max-warnings 0
yarn lint-fix             # ALWAYS run this before committing
yarn fix-staged           # auto-fix only staged files

# Type checking
yarn types                # src (tsc -p tsconfig.lib.json --noEmit) — run in CI
yarn types:scripts        # scripts/*.mts — run in CI (Node strips types, it does not check them)
yarn types:tests          # tests + mock-builders — NOT run in CI, currently red (see below)

# i18n
yarn build-translations   # regenerate src/i18n/keys.ts from the t() call sites
yarn validate-translations # regenerate and fail on any diff to keys.ts
yarn i18n:export          # write an en.json on demand (for a translator or TMS)

# Bundle smoke tests (run in CI after build)
yarn validate-cjs         # loads dist/cjs in Node + a browser-like context
yarn validate-esm         # imports dist/es in Node

# Examples
yarn start:tutorial       # @stream-io/stream-chat-react-tutorial dev server
yarn start:vite           # @stream-io/stream-chat-react-vite dev server
yarn examples:build       # build all example workspaces
```

**`yarn types` checks `src` only.** `tsconfig.lib.json` excludes `__tests__`, `mock-builders` and `stories`. CI runs it in the lint job, and `yarn build` compiles the same config, so type errors under `src/` fail CI twice over. `yarn types:tests` (`tsconfig.test.json`) is red repo-wide with over a thousand pre-existing errors — treat its output as advisory and compare against a baseline rather than expecting zero.

**Adding dependencies.** `.yarnrc.yml` sets `npmMinimalAgeGate: 1d`, so packages published within the last day are refused unless listed under `npmPreapprovedPackages`. `enableScripts: false` disables install scripts globally; per-package opt-ins live in `dependenciesMeta` in `package.json`.

## Architecture: core concepts

### State lives in the LLC

`stream-chat` v10 owns the state; React subscribes to it. There is no React-held message list, no channel reducer, and no context that copies channel state:

- Channel messages: `channel.messagePaginator`
- Thread replies: `thread.messagePaginator` (resolve threads via `client.threads`) — **independent** of the channel's list
- Pinned messages: `channel.pinnedMessagesPaginator`
- Composition (text, attachments, polls, drafts, edits): `stream-chat`'s `MessageComposer` class

Each is a `StateStore`. Components read them with `useStateStore(store, selector)` (`src/store/hooks/useStateStore.ts`) and write by calling LLC methods; the LLC's own event handlers apply WebSocket updates. Optimistic sends, dedupe-by-id, sorted inserts and conflict resolution between API responses and WebSocket events all happen in the LLC.

`ChannelStateContext`, `ChannelActionContext`, `useChannelStateContext()` and `makeChannelReducer` were **removed in v15**. Do not reintroduce a React copy of LLC state.

### Component tree

```
<Chat>                          # client, theme, i18n, channelManager, searchController
  └─ <ChatView>                 # stream-chat-react/slot-layout: layouts + slots
      ├─ <ChannelNavigation>    # channel list(s) + search; selecting binds a channel into a slot
      ├─ <Channel channel={…}>  # one per bound slot (useSlotChannels()); renders no layout
      │   ├─ <ChannelHeader>
      │   ├─ <MessageList>      # or <VirtualizedMessageList>
      │   └─ <MessageComposer>
      └─ <ThreadSlot slot='thread'>   # resolves the slot's thread and renders <Thread>
          ├─ <ThreadHeader>
          ├─ <MessageList>
          └─ <MessageComposer>
```

`Channel` takes a single `channel` prop (`src/components/Channel/Channel.tsx`). It activates the channel on mount, deactivates it on unmount, seeds the paginator's unread snapshot, and re-queries on `user.deleted` — nothing else. It does not query the channel for you: initialize it first (`channel.ensureWatched()` sends one watch for overlapping calls, and none for a channel already watched). There is no `Window` component in v15; compose layout yourself or through `ChatView` slots.

Read the bound channel with `useChannel()` (`src/context/useChannel.ts`, thread's channel first, then the `Channel` subtree's) and the active message list with `useMessagePaginator()` (`src/hooks/useMessagePaginator.ts`, thread first, then channel).

### Context layers (`src/context/`)

```
ChatContext                    # client, theme, channelManager, searchController, mutes
├─ ChannelInstanceContext      # the LLC channel for a subtree (read via useChannel())
├─ ComponentContext            # customizable component slots + `icons` slot map
├─ MessageContext              # per-message: actions, reactions, status
├─ MessageComposerContext      # composer bindings
├─ MessageComposerControllerContext  # an integrator-supplied composer (see Composer state)
├─ DialogManagerContext / ModalContext
└─ AttachmentContext, AttachmentSelectorContext, ChannelListContext, MessageBounceContext,
   MessageListContext, MessageTranslationViewContext, PollContext,
   VirtualizedMessageListContext, WorkspaceNavigationContext
```

Each has a hook (`useChatContext()`, `useComponentContext()`, `useMessageContext()`, …). Other contexts live next to their components or plugins (`ThreadContext`, `SearchContext`, `ChatViewContext`, `ChannelDetailContext`, `NotificationConfigurationContext`, …).

### Customization: `WithComponents` for app-wide slots

`Channel`, `Thread`, the message lists and `MessageComposer` take no component overrides. App-wide slots come from `ComponentContext`, populated by `<WithComponents overrides={{ … }}>` (`src/context/WithComponents.tsx`), which merges over the parent context and merges `icons` slot-by-slot:

```tsx
<WithComponents overrides={{ MessageUI: CustomMessageUI, icons: { IconFlag } }}>
  <MessageList />
</WithComponents>
```

Icons are read via `useComponentContextIcons()`, which merges `DEFAULT_ICONS` (`src/components/Icons/icons`) under the overrides, so every slot is defined and callers destructure without fallbacks.

Some components also take component props for their own parts — `Attachment` (`Audio`, `Card`, `File`, `Image`, …), for example. Follow the component's own props type.

When adding a customizable component: add the slot to `ComponentContextValue` (`src/context/ComponentContext.tsx`), provide a default implementation, and read it through `useComponentContext()`.

Request customization is not a component prop either: `sendMessageRequest`, `updateMessageRequest`, `deleteMessageRequest` and `markReadRequest` handlers are registered on `client.config` (see "Per-component request-handler props removed" in `ai-docs/ai-migration-v14-v15.md`).

### `useStateStore` requires a selector

`useStateStore(store, selector)` shallow-compares the object the selector returns, key by key. Return a small, flat object and define the selector at module scope so it stays referentially stable:

```ts
import { useStateStore } from '../../store';

const selector = (nextValue: ThreadManagerState) => ({
  isLoading: nextValue.pagination.isLoading,
  threads: nextValue.threads,
});

const { isLoading, threads } = useStateStore(client.threads.state, selector);
```

A change the selector does not pick up does not re-render.

### Composer state

`useMessageComposerController()` (`src/components/MessageComposer/hooks/useMessageComposerController.ts`) resolves which `stream-chat` `MessageComposer` backs the current UI, in this order:

```
supplied (MessageComposerControllerProvider) → thread.messageComposer → channel.messageComposer
```

A composer supplied through `MessageComposerControllerProvider` (`src/context/MessageComposerControllerContext.tsx`) is how an integrator composes into something other than the channel or thread, e.g. editing a message inline. Only a supplied composer can carry a message context; such a composer is stored in `client.messageComposerCache` under its tag. `registerSubscriptions()` is bound to the component lifecycle.

On unmount, `MessageComposer` saves a draft for every composer (`createDraft()` itself skips edits and composers with drafts disabled), but clears only the thread's or channel's own. A supplied composer belongs to whoever supplied it, and so does deciding when to clear it.

Submitting goes through `useMessageComposerSubmitFn()`: `update()` while a message is being edited, `send()` otherwise, decided at submit time. Custom submit controls should use it so they cannot disagree with the send button or the Enter key.

Draft, attachment, poll and command state is owned by the `MessageComposer` class, not React state — read it with `useStateStore`.

## Critical architectural patterns

### 1. Message enrichment pipeline

**File:** `src/components/MessageList/utils.ts` (`processMessages`)

Per message, in order: deleted messages skipped (`hideDeletedMessages`) → ephemeral giphy preview extracted (`setGiphyPreviewMessage`) → unread separator (skipped for the current user's own messages) → date separator (first message or a date change, never two in a row) → `reviewProcessedMessage` may rewrite the emitted slice. Group styling (`getGroupStyles`) is applied separately, keyed on user ID + time gaps.

Date separators come from `withDateSeparator`: on by default in `MessageList`, off in `VirtualizedMessageList`.

**Gotcha:** with `hideDeletedMessages=true`, a date separator is still required when the next rendered message falls on a different date than the last separator.

### 2. Virtualization

**Files:** `src/components/MessageList/VirtualizedMessageList.tsx`, `VirtualizedMessageListComponents.tsx`

- Built on **react-virtuoso** with custom item sizing
- **Offset trick:** `PREPEND_OFFSET = 10 ** 7` lets prepended messages work without Virtuoso knowing (`calculateItemIndex` / `calculateFirstItemIndex`)
- Only visible items + overscan render

`ThreadList` and `ChannelDetail` lists are virtualized too — see `src/a11y/hooks/useVirtualizedListboxKeyboardNavigation.ts` for the keyboard-nav contract those lists must honor.

### 3. Memoization

- `useStateStore` selectors scope re-renders: an over-broad or unstable slice re-renders everything that reads it.
- `areMessageUIPropsEqual` (`src/components/Message/utils.tsx`) is the per-message `React.memo` comparator. It checks cheap props first (`highlighted`, `endOfGroup`, `readBy.length`, `deliveredTo.length`, `groupStyles`, `showDetailedReactions`, `lastReceivedId`) before comparing messages. A prop it does not check will not re-render a message.

## Critical gotchas & invariants

### DO NOT:

1. **Write messages into `channel.state`** — the paginators own messages, threads and pinned messages. Read them reactively; the LLC's event handlers perform the writes. `channel.state.addMessageSorted()` / `removeMessage()` do not exist in v10.
2. **Depend on `channel.cid` where you mean the channel object.** `channel` (the instance) is stable and is the correct dependency; what churns is `channel.state`. `cid` names a _conversation_, and two different `Channel` instances can share one: the client's cache is dropped on `disconnectUser`, an app can hold channels from more than one client, and re-created channels come back as new objects. Anything bound to an instance — a `useStateStore` subscription, `channel.on(...)`, `watch()` — must depend on `channel`, or a replacement instance is silently left unsubscribed. Depend on `cid` only when you mean "which conversation".
3. **Change message sort order** — the paginator maintains it; local reordering conflicts.
4. **Assume thread replies live in the channel's message list** — they are an independent paginator. Whether a reply also shows in the channel is the server's `show_in_channel` flag, applied when the message is ingested.

### Where `StateStore` comes from

Import it from **`@stream-io/state-store`**, never from `stream-chat` (enforced by the `react-compat` and `state-store-single-source` blocks in `eslint.config.mjs`). `stream-chat` re-exported the store until v10 extracted it, so the old specifier still reads as correct — but it is now `undefined` at runtime (`TypeError: StateStore is not a constructor`).

`stream-chat`, `@stream-io/i18n` and this package all depend on `@stream-io/state-store` and hand each other store instances, so an app must end up with exactly one copy. A normal install dedupes them; a linked `stream-chat` checkout does not, which is what `resolve.dedupe` in `vitest.config.ts` covers for test runs.

### React version compatibility

The SDK supports **React 17, 18, 19**. Enforced by the `react-compat` block in `eslint.config.mjs` — forbidden in `src/`:

- `useId` from `react` → use `useStableId` from `src/components/UtilityComponents/useStableId`
- `useSyncExternalStore` from `react` → use the shim from `use-sync-external-store/shim`
- `useEffectEvent`, `use()` → React 19-only, not allowed
- `ref` in a prop type or destructured from props → use `forwardRef` (React 17/18 only deliver `ref` to forwardRef'd components)

Compatibility is lint-enforced only; there is no type/runtime matrix across React versions.

### Context dependency gotcha

```ts
useMemo(
  () => ({
    /* value */
  }),
  [
    channel, // ✅ Stable reference, and the right axis - a new instance must invalidate this
    deleteMessage, // ✅ Stable callback
    // ❌ NOT channel.cid - a replacement instance for the same conversation would not invalidate
    // ❌ NOT channel.messagePaginator.state - subscribe via useStateStore instead
  ],
);
```

## Testing

**Policy:** add or extend tests in the matching module's `__tests__/` folder. Cover React components, hooks, and utility functions. Reuse the repo's fakes/mocks instead of hand-rolling new ones.

**Runner:** Vitest (`vitest.config.ts`) — `globals: true` (no imports needed for `describe`/`it`/`expect`/`vi`), `jsdom`, `pool: 'forks'`, `testTimeout: 15000`, `css: false`, tests matched at `src/**/*.test.{js,jsx,ts,tsx}`. `resolve.dedupe` collapses `@stream-io/state-store`, `@stream-io/i18n`, `stream-chat`, `react` and `react-dom` onto one copy each. `vitest.setup.ts` forces `TZ=UTC`, registers `@testing-library/jest-dom/vitest` + `vitest-axe` matchers, and polyfills `crypto.getRandomValues`, `structuredClone`, `File`, `FileReader`, `URL.createObjectURL`, `matchMedia`, and canvas `getContext`.

Import test helpers from `src/mock-builders` (also aliased as `mock-builders`):

```ts
// Fastest path: client + watched channels in one call
const {
  client,
  channels: [channel],
} = await initClientWithChannels();

// Manual setup when you need control over the API responses
const client = await getTestClientWithUser({ id: 'test-user' });
useMockedApis(client, [getOrCreateChannelApi(mockedChannelData)]);
const channel = client.channelManager.ensure({ id: channelId, type: 'messaging' });
await channel.watch();
```

- `src/mock-builders/generator/` — `generateChannel`, `generateMessage`, `generateUser`, `generateMember`, `generatePoll`, `generateMessageDraft`, `generateReminderResponse`, attachment generators, …
- `src/mock-builders/api/` — response builders (`getOrCreateChannelApi`, `queryChannelsApi`, `sendMessageApi`, `markReadApi`, `threadRepliesApi`, errored-request helpers); `useMockedApis` spies on `client.axiosInstance.request`
- `src/mock-builders/event/` — `dispatchMessageNewEvent`, `dispatchNotificationMarkUnread`, connection-status helpers, …
- `src/mock-builders/context.ts` — `mockChatContext`, `mockComponentContext`, `mockMessageContext`, … built with `fromPartial` from `@total-typescript/shoehorn`
- `src/mock-builders/browser/` — `MediaRecorder`, `AudioContext`, `AnalyserNode`, `ResizeObserver` fakes
- Accessibility: `import { axe } from '<relative>/axe-helper'` (root `axe-helper.js` wraps `configureAxe`), then `expect(await axe(container)).toHaveNoViolations()`

Component render shape:

```tsx
render(
  <Chat client={client}>
    <Channel channel={channel}>
      <MessageList />
    </Channel>
  </Chat>,
);
```

Mock modules with `vi.mock('../../EmptyStateIndicator', () => ({ … }))`; use `importOriginal<typeof import('…')>()` to partially mock. Mock methods on the channel/client, never replace the whole object.

## Build system

`yarn build` = `yarn clean` + 4 steps in parallel via `concurrently`, each writing to a separate location:

1. **`build-translations`** — regenerates `src/i18n/keys.ts` from the `t()` call sites
2. **`vite build`** — bundles the entry points as ESM (`dist/es/*.mjs`, one file per module) + CJS (`dist/cjs/*.js`)
3. **`tsc -p tsconfig.lib.json`** — `.d.ts` only → `dist/types/`
4. **`build-styling`** — Sass → `dist/css/index.css`, `emoji-replacement.css`, `emoji-picker.css`, `channel-detail.css`, plus `cp -r src/styling/assets dist/css/assets`

**Entry points** (`package.json` exports ↔ `vite.config.ts` `lib.entry`):

| Import path                        | Source                             |
| ---------------------------------- | ---------------------------------- |
| `stream-chat-react`                | `src/index.ts`                     |
| `stream-chat-react/channel-detail` | `src/plugins/ChannelDetail/`       |
| `stream-chat-react/emojis`         | `src/plugins/Emojis/`              |
| `stream-chat-react/mp3-encoder`    | `src/plugins/encoders/mp3.ts`      |
| `stream-chat-react/slot-geometry`  | `src/plugins/SlotGeometry/`        |
| `stream-chat-react/slot-layout`    | `src/plugins/SlotLayout/index.tsx` |
| `stream-chat-react/css/*`          | `dist/css/*`                       |

Vite 8 / Rolldown specifics baked into `vite.config.ts` (do not "simplify" these):

- Output dirs are **hardcoded** to `es`/`cjs` — the `[format]` placeholder expands to `esm` under Rolldown, which would break `package.json` `exports`
- Externals are regexes (`^dep(\/.+)?$`) built from `dependencies` + `peerDependencies`, so **subpath** imports (`dayjs/locale/de`) stay external; otherwise CJS `require()` glue leaks into the ESM output
- No minification, sourcemaps on, target from `tsconfig.lib.json`
- Rolldown's strict CJS interop means a default-imported CJS dependency may need its `.default` unwrapped at the call site (see `src/components/VideoPlayer/ReactPlayerWrapper.tsx`)

## Styling architecture

All styles live in `src/styling/` (entry: `src/styling/index.scss`) and per-component `src/components/*/styling/index.scss`, `@use`d by the master stylesheet. Nothing is pulled from an external design-system package. Never edit compiled CSS.

### CSS layers

Consumers order layers so overrides win without `!important`. Reference implementation — `examples/vite/src/index.scss`:

```scss
@layer modern-normalize, stream-new, stream-new-plugins, stream-overrides, stream-app-overrides;

@import url('modern-normalize') layer(modern-normalize);
@import url('stream-chat-react/dist/css/index.css') layer(stream-new);
@import url('stream-chat-react/dist/css/emoji-picker.css') layer(stream-new-plugins);
@import url('stream-chat-react/dist/css/channel-detail.css') layer(stream-new-plugins);
```

### Theming variables

1. **Base values** — `src/styling/variables/` (fonts, shadows)
2. **Semantic tokens** — `src/styling/light.scss` / `dark.scss` (generated; e.g. `--str-chat__accent-primary`, `--str-chat__text-primary`, `--str-chat__background-core-app`), applied by `variable-tokens.scss` to `.str-chat` and `.str-chat__theme-dark`
3. **Component tokens** — per-component SCSS (e.g. `--str-chat__message-bubble-radius-tail`)

## i18n system

**The runtime is `@stream-io/i18n`**, shared with the React Native SDK — one `Streami18n`, one set of formatters, one date layer. This package owns only its generated key catalog, `src/i18n/runtimeDefaults.ts`, the React context/hook binding, and the notification translation topic. `src/i18n/Streami18n.ts` is a thin subclass injecting this SDK's bundled data. Integrators import `Streami18n` from this package and never `@stream-io/i18n` directly, which is why it is a regular dependency, not a peer. Do not add `i18next` as a direct dependency.

**English only.** Every other language is supplied by the integrator via `Streami18n.registerTranslation()`. There is no checked-in locale JSON; `yarn i18n:export` writes one on demand.

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

- **Namespaces follow the source tree** (`message.*`, `messageComposer.*`, `poll.*`); shared copy lives in `common.*`. Modality is the leaf: `.label`, `.ariaLabel`, `.placeholder`, `.title`, `.description`, `.text`.
- **Keys are flat strings that contain dots.** `@stream-io/i18n` sets `keySeparator: false`; several keys contain `...` in their copy, which a `.` separator would mis-resolve.
- **Typed keys:** `src/i18n/keys.ts` (generated — never edit by hand) declares `TranslationCatalog`; `src/i18n/types.ts` derives `TranslationKey`, `TranslationDictionary` (strict), `LooseTranslationDictionary` and `StreamTFunction`, which is what `useTranslationContext().t` is typed as — a typo is a compile error.
- **Runtime keys** (resolved from a runtime value: a `stream-chat` notification, slash-command metadata, a language code, an integrator prop) go through `asDynamicKey()`. That brand is required, so every escape is deliberate and greppable. `stream-chat` notifications are resolved by their stable `type` through `src/i18n/TranslationBuilder/notifications/`, not by matching English prose.
- **`yarn build-translations`** (`scripts/generate-i18n-keys.mts`, driven by `@stream-io/i18n/codegen`) joins the call sites with `runtimeDefaults.ts` and hard-fails on, among others: a key used with two different inline copies; a key with no inline default and no `runtimeDefaults` entry (it would render as the raw dotted key); and a key present in both.
- **`yarn validate-translations`** regenerates and fails on any diff to `keys.ts`; CI runs the same diff in its build job.
- **Date/time:** `Streami18n` wraps i18next + Dayjs. Only the `en` dayjs locale is bundled; integrators import their own and pass `dayjsLocaleConfigForLanguage`.
- **The v14 → v15 key mapping** lives in `ai-docs/i18n-v15-key-map.json` and is read by the integrator-facing guide. It is hand-reviewed — nothing regenerates it.

**Adding a translatable string:** call `t('namespace.component.thing.label', 'English copy')`, then run `yarn build-translations`. A key with no inline copy (a formatter expression, or one built from a runtime value) goes in `src/i18n/runtimeDefaults.ts` instead, which _is_ hand-maintained. Access `t` via `useTranslationContext()`, which only works inside `<Chat>`.

## Accessibility

`src/a11y/` holds cross-component a11y primitives: `useAriaIdentifiers`, `useListboxKeyboardNavigation`, `useVirtualizedListboxKeyboardNavigation`, `useResolvedModalAriaProps`, plus `accessibleLabel.ts` / `a11yUtils.ts`. Related components: `Accessibility/` (aria-live announcer and outlet), `SkipNavigation/`, `VisuallyHidden/`. New interactive UI should reuse these hooks and ship an `axe` assertion in its tests.

## Module boundaries & coupling

**Tightest coupling:**

1. `Message.tsx` ↔ `MessageContext` — every message needs actions
2. `useStateStore` selectors ↔ message memoization — an unstable or over-broad slice re-renders the list
3. `MessageComposer` ↔ `stream-chat`'s `MessageComposer` class + `client.messageComposerCache`

**Integration risks:** reordering messages conflicts with the paginator; reading LLC state through anything but `useStateStore` on its store yields stale copies.

## Code organization standards

```
ComponentName/
├── ComponentName.tsx
├── hooks/              # Component-specific hooks
├── styling/            # SCSS (index.scss aggregates)
├── utils/ or utils.ts
├── __tests__/
└── index.ts
```

Component-specific hooks stay in the component's `hooks/`: `Message/hooks/` (delete, flag, mark-unread, mentions, reminders, …), `MessageComposer/hooks/` (controller, bindings, attachments, cooldown, …), `MessageList/hooks/` (mark-read, last-read/delivered, receipts, …), `ChannelList/hooks/`, `Threads/hooks/`. Cross-cutting hooks live in `src/hooks/`.

Lint rules worth knowing (enforced with `--max-warnings 0`): `sort-keys`, `sort-destructure-keys`, `react/jsx-sort-props`, `@typescript-eslint/consistent-type-imports`, `react-hooks/exhaustive-deps` as **error**, `@typescript-eslint/no-non-null-assertion` in `src/` (relaxed in tests and examples; examples also relax the sort rules).

## Contribution rules

### Linting & formatting

Run `yarn lint-fix` before every commit. Follow the "zero warnings" policy — fix new warnings, never introduce any.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint via the `commit-msg` husky hook, and on the PR title by `pr-check.yml` (PRs are squash-merged, so the title becomes the commit):

```
feat(MessageComposer): add audio recording support

Implement MediaRecorder API integration with MP3 encoding.

Closes #123
```

- v15 is a major release line: a change that breaks the v14 API is marked with `!` and a `BREAKING CHANGE:` footer, and gets an entry in `ai-docs/ai-migration-v14-v15.md`.
- Never commit directly to `master` or `release-v15`; always create a feature branch (see `developers/BRANCHES.md`). v15 work targets `release-v15`.
- Never commit unless explicitly requested.

The **pre-commit hook** runs `lint-staged`: eslint (`--max-warnings 0`) on staged `src/**`, and prettier `--list-different` on all supported files. `yarn fix-staged` attempts auto-fix.

### Pull requests

Follow `.github/pull_request_template.md` (Goal / Implementation details / UI Changes). Keep PRs small and focused; include tests.

- [ ] `yarn lint-fix` passed
- [ ] `yarn test` passed
- [ ] `yarn types` passed (and no new errors from `yarn types:tests`)
- [ ] `yarn validate-translations` passed, if any `t()` call changed
- [ ] Tests added for changes
- [ ] No new warnings (zero tolerance)
- [ ] Screenshots (before/after) for UI changes
- [ ] Public API changes documented

**CI** (`.github/workflows/ci.yml`, on every PR): lint (`yarn lint`, `yarn types`, `yarn types:scripts`) · build + `validate-cjs` + `validate-esm` + `keys.ts` drift check · `yarn coverage` → Codecov · deploy `examples/vite` to Vercel. `pr-check.yml` lints the PR title; `size.yml` reports bundle size.

**Release:** automated via semantic-release (`.releaserc.json`) from commit messages.

### Deprecations

Use the `@deprecated` JSDoc tag with a reason and docs link; commit under the `deprecate` type. Full process in `developers/DEPRECATIONS.md`.

### Docs & samples

When altering public API, update inline docs and any affected guide pages where this repo is the source of truth, including `ai-docs/` for v14 → v15 changes. Keep sample/snippet code compilable.

### Security & credentials

Never commit API keys or customer data. Example code must use obvious placeholders (e.g. `YOUR_STREAM_KEY`). Scripts must fail closed on missing env vars.

### When in doubt

Mirror existing patterns in the nearest module. Prefer additive changes. Ask maintainers (`CODEOWNERS`) through PR mentions for modules you touch.

## References

- **Development guides:** `developers/`
- **v14 → v15 migration:** `ai-docs/ai-migration-v14-v15.md`, `ai-docs/i18n-v15-migration.md`
- **Component docs:** https://getstream.io/chat/docs/sdk/react/
- **Stream Chat API:** https://getstream.io/chat/docs/javascript/
- **Stream agent skills** (installed via `getstream init`): https://getstream.io/agent-skills/docs/installation/

---

End of machine guidance. Edit this file to refine agent behavior over time; keep human-facing details in `README.md` and the docs site.
