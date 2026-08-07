# AGENTS.md

Guidance for AI coding agents (Claude Code, Copilot, Cursor, Codex, Aider, etc.) working in this repository. Human readers are welcome, but this file is written for tools.

> **Single source of truth.** `CLAUDE.md` contains nothing but `@AGENTS.md`, which Claude Code expands into this file. Edit this file only — never fork guidance into `CLAUDE.md`.

Agents should prioritize backwards compatibility, API stability, and high test coverage when changing code.

## Repository purpose

Stream's React Chat SDK — React components, hooks and contexts for building chat UIs on the Stream Chat API. The published package (`stream-chat-react`) lives at the repo root; `examples/*` are private Yarn workspaces consuming it via `workspace:^`.

## Tech & toolchain

- **Language:** TypeScript + React
- **Runtime:** Node 24 (`.nvmrc` — use `nvm use`)
- **Package manager:** Yarn 4 (Berry). The binary is committed under `.yarn/releases/` and activated via `yarnPath` in `.yarnrc.yml`. Any globally installed `yarn` (even classic 1.x) acts only as a launcher — no Corepack required.
- **Workspaces:** Yarn workspaces monorepo (`examples/*`)
- **Testing:** Vitest + React Testing Library (+ `vitest-axe` for a11y). There is no Jest and no Playwright/e2e suite in this repo.
- **Bundler:** Vite 8 / Rolldown (library mode); `tsc` emits declarations only
- **Styles:** Sass compiled to `dist/css/`. Consumers override via CSS layers (see README) — never edit compiled CSS.
- **Lint/format:** ESLint (flat config, `--max-warnings 0`) + Prettier
- **CI:** GitHub Actions — PR validation on lint + build/bundle-validation + tests
- **Release:** Conventional Commits + semantic-release (`commitlint.config.mjs`, `.releaserc.json`)

### Root configuration files

`.nvmrc` · `.yarnrc.yml` · `eslint.config.mjs` · `.prettierrc` / `.prettierignore` · `tsconfig.json` (solution) + `tsconfig.lib.json` (src) + `tsconfig.test.json` (tests) · `vite.config.ts` · `vitest.config.ts` / `vitest.setup.ts` · `i18next.config.ts` · `commitlint.config.mjs` · `.releaserc.json` · `.lintstagedrc.json` / `.lintstagedrc.fix.json` · `codecov.yml`

Respect repo-specific rules. Do not suppress lint rules broadly; justify and scope every exception.

## Project layout

- `src/` — library source: `components/`, `context/`, `store/`, `i18n/`, `styling/`, `a11y/`, `plugins/`, `utils/`, `mock-builders/`
- `scripts/` — build/validation scripts
- `examples/` — private example workspaces: `examples/tutorial`, `examples/vite`
- `developers/` — dev notes (`BRANCHES.md`, `COMMIT.md`, `DEPRECATIONS.md`, `PR.md`, `RELEASE.md`)

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
yarn lint                 # prettier --list-different + eslint --max-warnings 0 + validate-translations
yarn lint-fix             # ALWAYS run this before committing
yarn fix-staged           # auto-fix only staged files

# Type checking
yarn types                # src — the gate that matters (CI's build runs the same config)
yarn types:tests          # tests + mock-builders; NOT run in CI, currently red (see below)

# Bundle smoke tests (run in CI after build)
yarn validate-cjs         # loads dist/cjs in Node + a browser-like context
yarn validate-esm         # imports dist/es in Node

# Examples
yarn start:tutorial       # @stream-io/stream-chat-react-tutorial dev server
yarn start:vite           # @stream-io/stream-chat-react-vite dev server
yarn examples:build       # build all example workspaces
```

**`yarn types` checks `src`, and only recently started to.** It now runs `tsc --project tsconfig.lib.json --noEmit`. It previously ran bare `tsc --noEmit`, which resolved the root `tsconfig.json` — a solution-style config with `"files": []` and project references only — so it checked nothing and always passed in under a second. If you remember it as a no-op, that is fixed; if it returns instantly, something is wrong.

**`src` is the enforced type gate.** CI never runs `types:tests`, but `yarn build` runs the same `tsconfig.lib.json` with `noEmitOnError`, so type errors under `src/` (excluding `__tests__` and `mock-builders`, which that config excludes) do fail CI. `yarn types:tests` is currently red repo-wide (~1300 errors, including some sourced from a sibling `../stream-chat-js` checkout when one is present) — treat its output as advisory and compare against a baseline rather than expecting zero.

**Adding dependencies.** `.yarnrc.yml` sets `npmMinimalAgeGate: 1d`, so packages published within the last day are refused unless listed under `npmPreapprovedPackages`. `enableScripts: false` disables install scripts globally; per-package opt-ins live in `dependenciesMeta` in `package.json`.

## Architecture: core concepts

### Component hierarchy

```
<Chat>                     # Root: client, theme, i18n, SearchController, notification filter
  ├─ <ChannelList>         # Channel list + search
  └─ <Channel>             # State container: messages, threads, WebSocket events
      ├─ <Window>
      │   ├─ <ChannelHeader>
      │   ├─ <MessageList>      # or <VirtualizedMessageList>
      │   └─ <MessageComposer>  # composer with attachments/mentions/polls/voice
      └─ <Thread>          # threaded replies (renders its own MessageComposer)
```

`<ChatView>` (in `src/plugins/SlotLayout/`) + `<Threads>`/`<ThreadList>` provide the channels-vs-threads (inbox) view switching.

### Context layers (17 contexts in `src/context/`)

```
ChatContext                # client, active channel, theme, searchController, navigation
├─ ChannelInstanceContext  # the LLC `channel` for this subtree (read via `useChannel()`)
├─ ComponentContext        # ~100 customizable component slots + `icons` slot map
├─ MessageContext          # per-message: actions, reactions, status
├─ MessageComposerContext  # composer props/bindings
├─ AttachmentContext       # giphyVersion + attachment size handlers
├─ WorkspaceNavigationContext  # open/close channels and threads, active-slot queries
├─ DialogManagerContext / ModalContext  # dialog + modal orchestration
└─ TranslationContext, TypingContext, PollContext, MessageListContext,
   VirtualizedMessageListContext, ChannelListContext, MessageBounceContext,
   AttachmentSelectorContext, MessageTranslationViewContext
```

Each has a hook: `useChatContext()`, `useChannel()`, `useComponentContext()`, … Other contexts live next to their components (`SearchContext`, `ChannelDetailContext`, `ThreadContext`, `NotificationConfigurationContext`).

> **Removed in v15:** `ChannelStateContext` / `ChannelActionContext` and their
> `useChannelStateContext()` / `useCreateChannelStateContext` / `useCreateChannelActionContext`
> builders. Message and channel state is no longer copied into a React context — components read it
> directly from the LLC (`useChannel()` + `useStateStore(channel.messagePaginator.state, …)`), and
> actions are invoked on the LLC channel or on the navigation adapters.

### Customization: `WithComponents`, not component props

`ChannelProps` **does not** accept component overrides. Slots come from `ComponentContext`, populated by `<WithComponents overrides={{ … }}>`, which merges over the parent context (and merges `icons` slot-by-slot):

```tsx
<Channel>
  <Window>
    <WithComponents overrides={{ MessageUI: CustomMessageUI, icons: { IconFlag } }}>
      <MessageList />
    </WithComponents>
  </Window>
</Channel>
```

Icons are read via `useComponentContextIcons()`, which merges `DEFAULT_ICONS` (`src/components/Icons/icons`) under the override so every slot is guaranteed defined and callers destructure without fallbacks. Note the returned map is memoized with `[]` — icon overrides are read once and must be stable.

`Channel` props are behavioral escape hatches instead: `doSendMessageRequest`, `doUpdateMessageRequest`, `doDeleteMessageRequest`, `doMarkReadRequest`, `channelQueryOptions`, `initializeOnMount`, `markReadOnMount`, `skipMessageDataMemoization`, `EmptyPlaceholder`.

When adding a customizable component: add the slot to `ComponentContext` (`src/context/ComponentContext.tsx`), provide a default implementation, and read it through `useComponentContext()`.

### State management

1. **Local state** (`useState`) — component UI state, plus `Channel`'s own lifecycle flags
   (`isBootstrapping`, `bootstrapError`). There is no reducer and no React-held message list.
2. **External LLC state** — the message list, thread replies and pinned messages live on
   `channel.messagePaginator` / `thread.messagePaginator` / `channel.pinnedMessagesPaginator`
   (`StateStore`s), consumed via `useStateStore` (`src/store/hooks/useStateStore.ts`). This is the
   primary re-render driver.
3. **Context state** — the channel instance and component-slot overrides (see Context layers).

`useStateStore` **requires a selector** returning a flat object/array (it shallow-compares the selected keys). Define the selector at module scope so it stays referentially stable:

```ts
import { useStateStore } from '../../store';

const selector = (nextValue: ThreadManagerState) => ({
  isLoading: nextValue.pagination.isLoading,
  threads: nextValue.threads,
});

const { isLoading, threads } = useStateStore(client.threads.state, selector);
```

### Composer state lives in `stream-chat`

`useMessageComposerController()` resolves which `MessageComposer` instance (from `stream-chat`) backs the current UI, in this order:

```
edited message → thread instance (thread.messageComposer) → legacy thread parent → channel.messageComposer
```

Composers for `message`/`legacy_thread` contexts are cached in `client.messageComposerCache` by `tag`, and `registerSubscriptions()` is bound to the component lifecycle. Draft/attachment/poll/command state is owned by the SDK class, not React state — read it with `useStateStore`.

## Critical architectural patterns

### 1. Optimistic updates & race conditions

**Owner:** the LLC (`stream-chat`), not React state.

- Optimistic sends go through `channel.sendMessage`, which ingests the pending message into
  `channel.messagePaginator` immediately (`ingestItem`, dedupe-by-id + sorted insert). `MessageList`
  subscribes to that paginator `StateStore`, so the message renders at once — there is no
  React-local copy. The React SDK only customizes the request via
  `channel.configState.requestHandlers` (see `Channel/hooks/useChannelRequestHandlers.ts`).
- WebSocket events may arrive before or after the API response; **conflict resolution lives in the
  paginator / LLC** (newest version wins, dedupe by id).
- **Gotcha:** thread replies live in a separate paginator (`thread.messagePaginator`) from
  `channel.messagePaginator` — they are not dual-written; each is updated by its own event handling.

### 2. WebSocket event processing

**File:** `src/components/Channel/Channel.tsx` (`handleEvent`, registered in the bootstrap effect)

Re-renders on events are **not** driven from `Channel`. The LLC's own event handlers write into the
paginators' `StateStore`s and components re-render through their `useStateStore` subscriptions. There
is **no** throttled `copyStateFromChannelOnEvent` dispatch any more — the reducer and its 500ms
throttle were removed in v15.

`Channel.handleEvent` now performs only **side effects**: an early return for a disconnected channel,
online-status tracking, document-title / unread-count updates on `message.new`, latest-message
bookkeeping, and a full `channel.query(...)` re-fetch on `user.deleted`.

- Some events are ignored (e.g. `user.watching.start/stop`)
- Message visibility in threads is decided by `parent_id` + `show_in_channel`

### 3. Message enrichment pipeline

**File:** `src/components/MessageList/utils.ts` (`processMessages`)

Per message, in order: deleted messages filtered (`hideDeletedMessages`) → giphy `ephemeral` preview extracted (`setGiphyPreviewMessage`, VirtualizedMessageList) → unread separator (skipped for the current user's own messages) → date separator inserted (first message, date change, or when hidden deleted messages shifted the last rendered date) → `reviewProcessedMessage` hook may rewrite the emitted slice.

Date separators are enabled in `MessageList` and disabled in `VirtualizedMessageList` and threads by default. Group styling (`getGroupStyles`) is applied separately, keyed on user ID + time gaps.

**Gotcha:** with `hideDeletedMessages=true`, a date separator is still required when the next rendered message falls on a different date than the last separator.

### 4. Virtualization strategy

**Files:** `src/components/MessageList/VirtualizedMessageList.tsx`, `VirtualizedMessageListComponents.tsx`

- Built on **react-virtuoso** with custom item sizing
- **Offset trick:** `PREPEND_OFFSET = 10 ** 7` lets prepended messages work without Virtuoso knowing (`calculateItemIndex` / `calculateFirstItemIndex`)
- Only visible items + overscan render
- `skipMessageDataMemoization` exists for channels with thousands of messages

`ThreadList` and `ChannelDetail` lists are virtualized too — see `src/a11y/hooks/useVirtualizedListboxKeyboardNavigation.ts` for the keyboard-nav contract those lists must honor.

### 5. Performance: memoization

- `useStateStore(store, selector)` selectors: return a small flat object — the hook shallow-compares
  the selected slice and only re-renders on a real change. This is what scopes paginator-state
  updates (e.g. `MessageList` selects `{ messages, hasMoreNewer, isLoading }`).
- `areMessageUIPropsEqual` (`src/components/Message/utils.tsx`) checks cheap props first (`highlighted`, `threadList`, `endOfGroup`, `mutes.length`, `readBy.length`, `deliveredTo.length`, `groupStyles`) before deep message comparison.
- **Gotcha:** a change that neither the selector nor `areMessageUIPropsEqual` observes will not
  trigger a re-render.

> The old event throttling (500ms `copyStateFromChannelOnEvent`, 200ms unread, `markRead` 500ms,
> debounced `loadMoreFinished`) and the `useCreateChannelStateContext` string-serialization
> memoization are **gone** — re-rendering is driven by `StateStore` subscriptions, not a throttled
> reducer copy.

## Critical gotchas & invariants

### DO NOT:

1. **Push messages into `channel.state`** — messages, thread replies and pinned messages are owned by the LLC paginators (`channel.messagePaginator`, `thread.messagePaginator`, `channel.pinnedMessagesPaginator`). Read them reactively via `useStateStore(channel.messagePaginator.state, …)`; the SDK's own event handlers perform the writes. `channel.state.addMessageSorted()` / `removeMessage()` were removed in v15.
2. **Include `channel` in dependency arrays** — use `channel.cid` (stable), never `channel.state` (changes constantly)
3. **Change message sort order** — the paginator maintains order; local changes conflict
4. **Assume thread replies live in the channel's message list** — they are an independent paginator and are not mirrored into `channel.messagePaginator`

### Thread vs. channel messages

- Main channel messages: `channel.messagePaginator` (LLC).
- Thread replies: `thread.messagePaginator`, owned by the `Thread` object (resolve via `client.threads`) — **independent** of the channel's message list.
- **No cross-store invariant:** a reply is not required to exist in the channel's message list. Whether a reply also shows in the channel is the server's `show_in_channel` flag, applied when the message is ingested.

### React version compatibility

The SDK supports **React 17, 18, 19**. Enforced by the `react-compat` block in `eslint.config.mjs` — forbidden in `src/`:

- `useId` from `react` → use `useStableId` from `src/components/UtilityComponents/useStableId`
- `useSyncExternalStore` from `react` → use the shim from `use-sync-external-store/shim`
- `useEffectEvent`, `use()` → React 19-only, not allowed
- `ref` in a prop type (`TSPropertySignature[key.name='ref']`) or destructured from props → use `forwardRef` (React 17/18 only deliver `ref` to forwardRef'd components)

Compatibility is lint-enforced only; there is no type/runtime matrix across React versions.

### Context dependency gotcha

```ts
useMemo(
  () => ({
    /* value */
  }),
  [
    channel.cid, // ✅ Stable - include this
    deleteMessage, // ✅ Stable callback
    // ❌ NOT channel.state.messages - causes infinite re-renders
    // ❌ NOT channel.initialized - changes constantly
  ],
);
```

## Testing

**Policy:** add or extend tests in the matching module's `__tests__/` folder. Cover React components, hooks, and utility functions. Reuse the repo's fakes/mocks instead of hand-rolling new ones.

**Runner:** Vitest (`vitest.config.ts`) — `globals: true` (no imports needed for `describe`/`it`/`expect`/`vi`), `jsdom`, `pool: 'forks'`, `testTimeout: 15000`, `css: false`, tests matched at `src/**/*.test.{js,jsx,ts,tsx}`. `vitest.setup.ts` forces `TZ=UTC`, registers `@testing-library/jest-dom/vitest` + `vitest-axe` matchers, and polyfills `crypto`, `structuredClone`, `File`, `FileReader`, `URL.createObjectURL`, `matchMedia`, and canvas `getContext`.

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
const channel = client.channel('messaging', channelId);
await channel.watch();
```

- `src/mock-builders/generator/` — `generateChannel`, `generateMessage`, `generateUser`, `generateMember`, `generatePoll`, `generateMessageDraft`, `generateReminder`, `generateSharedLocation`, …
- `src/mock-builders/api/` — response builders (`getOrCreateChannelApi`, `queryChannelsApi`, `sendMessageApi`, `markReadApi`, `threadRepliesApi`, error helpers); `useMockedApis` spies on `client.axiosInstance`
- `src/mock-builders/event/` — `dispatchMessageNewEvent`, `dispatchNotificationMarkUnread`, …
- `src/mock-builders/context.ts` — `mockChatContext`, `mockChannelStateContext`, … built with `fromPartial` from `@total-typescript/shoehorn`
- `src/mock-builders/browser/` — `MediaRecorder`, `AudioContext`, `AnalyserNode`, `ResizeObserver`, `HTMLMediaElement` fakes
- Accessibility: `import { axe } from '<relative>/axe-helper'` (root `axe-helper.js` wraps `configureAxe`), then `expect(await axe(container)).toHaveNoViolations()`

Component render shape:

```tsx
render(
  <Chat client={chatClient}>
    <Channel channel={channel}>
      <MessageList />
    </Channel>
  </Chat>,
);
```

Mock modules with `vi.mock('../../EmptyStateIndicator', () => ({ … }))`; use `importOriginal<typeof import('…')>()` to partially mock. Mock methods on the channel/client, never replace the whole object.

## Build system

`yarn build` = `yarn clean` + 4 steps in parallel via `concurrently`, each writing to a separate `dist/` subdirectory:

1. **`build-translations`** — `i18next-cli extract` pulls `t()` calls from source into `src/i18n/*.json`
2. **`vite build`** — bundles 4 entry points as ESM (`dist/es/*.mjs`) + CJS (`dist/cjs/*.js`)
3. **`tsc -p tsconfig.lib.json`** — `.d.ts` only → `dist/types/`
4. **`build-styling`** — Sass → `dist/css/index.css`, `emoji-replacement.css`, `emoji-picker.css`, `channel-detail.css`, plus `cp -r src/styling/assets dist/css/assets`

**Entry points** (`package.json` exports ↔ `vite.config.ts` `lib.entry`):

| Import path                        | Source                        |
| ---------------------------------- | ----------------------------- |
| `stream-chat-react`                | `src/index.ts`                |
| `stream-chat-react/channel-detail` | `src/plugins/ChannelDetail/`  |
| `stream-chat-react/emojis`         | `src/plugins/Emojis/`         |
| `stream-chat-react/mp3-encoder`    | `src/plugins/encoders/mp3.ts` |
| `stream-chat-react/css/*`          | `dist/css/*`                  |

Vite 8 / Rolldown specifics baked into `vite.config.ts` (do not "simplify" these):

- Output dirs are **hardcoded** to `es`/`cjs` — the `[format]` placeholder expands to `esm` under Rolldown, which would break `package.json` `exports`
- Externals are regexes (`^dep(\/.+)?$`) so **subpath** imports (`dayjs/locale/de`) stay external; otherwise CJS `require()` glue leaks into the ESM output
- No minification, sourcemaps on, target from `tsconfig.lib.json` (`es2020`), all deps/peerDeps externalized
- Rolldown's strict CJS interop means default-imported CJS deps may need `.default` unwrapping at the call site

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

### Theming variables (3 tiers)

1. **Primitives** — `src/styling/variables/` (fonts, shadows) + Figma-sourced palette tokens
2. **Semantic tokens** — `src/styling/variable-tokens.scss` with `light.scss` / `dark.scss` mappings (e.g. `--str-chat__primary-color`, `--str-chat__text-color`)
3. **Component tokens** — per-component SCSS (e.g. `--str-chat__message-bubble-background-color`)

## i18n system

- **12 locales** in `src/i18n/*.json`: de, en, es, fr, hi, it, ja, ko, nl, pt, ru, tr
- **Keys are English text**: `t('Mute')`, `t('{{ user }} is typing...')`
- `i18next.config.ts` sets `keySeparator: false` and `nsSeparator: false`, so keys may contain `/` and `:` literally (e.g. `timestamp/DateSeparator`). `timestamp/*` keys are listed under `preservePatterns` and are not pruned; `removeUnusedKeys: false`
- Extraction: `yarn build-translations` (scans `src/**/*.{ts,tsx}`, ignores `__tests__` and `mock-builders`)
- Validation: `yarn validate-translations` runs inside `yarn lint` and in CI — **zero tolerance for empty translation values**
- `Streami18n` (`src/i18n/Streami18n.ts`) wraps i18next + Dayjs with per-locale calendar formats; access `t` via `useTranslationContext()` (only works inside `<Chat>`)
- Adding a string: use `t()` → run `yarn build-translations` → fill in all 12 files

## Accessibility

`src/a11y/` holds cross-component a11y primitives: `useAriaIdentifiers`, `useListboxKeyboardNavigation`, `useVirtualizedListboxKeyboardNavigation`, `useResolvedModalAriaProps`, plus `accessibleLabel.ts` / `a11yUtils.ts`. Related components: `Accessibility/`, `SkipNavigation/`, `VisuallyHidden/`. New interactive UI should reuse these hooks and ship an `axe` assertion in its tests.

## Module boundaries & coupling

**Tightest coupling:**

1. `Message.tsx` ↔ `MessageContext` — every message needs actions
2. `Channel.tsx` ↔ `VirtualizedMessageList` — complex prop drilling
3. `useStateStore` selectors ↔ message memoization — a selector returning an unstable or over-broad slice defeats the shallow-compare and re-renders the whole list
4. `MessageComposer` ↔ `stream-chat`'s `MessageComposer` class + `client.messageComposerCache`

**Integration risks:** message sorting changes conflict with the LLC paginator's ordering; reading LLC message state through anything other than `useStateStore` on the paginator yields stale copies.

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

Component-specific hooks stay in the component's `hooks/`: `Channel/hooks/` (state context, typing, editing), `Message/hooks/` (delete, pin, flag, react, retry, reminders), `MessageComposer/hooks/` (controller, bindings, submit, attachments, cooldown), `MessageList/hooks/` (scroll, mark-read, last-read/delivered).

Lint rules worth knowing (enforced with `--max-warnings 0`): `sort-keys`, `sort-destructure-keys`, `react/jsx-sort-props`, `@typescript-eslint/consistent-type-imports`, `react-hooks/exhaustive-deps` as **error**, no non-null assertions in `src/` (relaxed in tests).

## Contribution rules

### Linting & formatting

Run `yarn lint-fix` before every commit. Follow the "zero warnings" policy — fix new warnings, never introduce any.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint via the `commit-msg` husky hook:

```
feat(MessageComposer): add audio recording support

Implement MediaRecorder API integration with MP3 encoding.

Closes #123
```

- Avoid `BREAKING CHANGE` footers and `!` — ship changes as semver minors.
- Never commit directly to `master`; always create a feature branch (see `developers/BRANCHES.md`).
- Never commit unless explicitly requested.

The **pre-commit hook** runs `lint-staged`: eslint (`--max-warnings 0`) on staged `src/**`, prettier `--list-different` on all supported files, and translation validation on `src/i18n/*.json`. `yarn fix-staged` attempts auto-fix.

### Pull requests

Follow `.github/pull_request_template.md` (Goal / Implementation details / UI Changes). Keep PRs small and focused; include tests.

- [ ] `yarn lint-fix` passed
- [ ] `yarn test` passed
- [ ] `yarn types` passed (and no new errors from `yarn types:tests`)
- [ ] Tests added for changes
- [ ] No new warnings (zero tolerance)
- [ ] Screenshots (before/after) for UI changes
- [ ] Public API changes documented

**CI** (`.github/workflows/ci.yml`): lint · build + `validate-cjs` + `validate-esm` + `validate-translations` · `yarn coverage` → Codecov · deploy `examples/vite` to Vercel.

**Release:** automated via semantic-release (`.releaserc.json`) from commit messages.

### Deprecations

Use the `@deprecated` JSDoc tag with a reason and docs link; commit under the `deprecate` type. Full process in `developers/DEPRECATIONS.md`.

### Docs & samples

When altering public API, update inline docs and any affected guide pages where this repo is the source of truth. Keep sample/snippet code compilable.

### Security & credentials

Never commit API keys or customer data. Example code must use obvious placeholders (e.g. `YOUR_STREAM_KEY`). Scripts must fail closed on missing env vars.

### When in doubt

Mirror existing patterns in the nearest module. Prefer additive changes; avoid breaking public APIs. Ask maintainers (`CODEOWNERS`) through PR mentions for modules you touch.

## References

- **Development guides:** `developers/`
- **Component docs:** https://getstream.io/chat/docs/sdk/react/
- **Stream Chat API:** https://getstream.io/chat/docs/javascript/
- **Stream agent skills** (installed via `getstream init`): https://getstream.io/agent-skills/docs/installation/

---

End of machine guidance. Edit this file to refine agent behavior over time; keep human-facing details in `README.md` and the docs site.
