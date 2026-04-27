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
yarn install              # Setup
yarn build                # Full build (translations, Vite, types, SCSS)
yarn test                 # Run Jest tests
yarn test <pattern>       # Run specific test (e.g., yarn test Channel)
yarn lint-fix             # Fix all lint/format issues (prettier + eslint)
yarn types                # TypeScript type checking (noEmit mode)

# E2E
yarn e2e-fixtures         # Generate e2e test fixtures
yarn e2e                  # Run Playwright tests

# Before committing
yarn lint-fix             # ALWAYS run this first
```

## Architecture: Core Concepts

### Component Hierarchy

```
<Chat>                    # Root: provides client, theme, i18n
  └─ <Channel>            # State container: messages, threads, WebSocket events
      ├─ <MessageList>    # Renders messages (or <VirtualizedMessageList>)
      ├─ <MessageInput>   # Composer with attachments/mentions
      └─ <Thread>         # Threaded replies
```

### Context Layers (14+ contexts)

```
ChatContext               # Client, active channel, theme, navigation
├─ ChannelStateContext    # Read-only: messages, members, loading states
├─ ChannelActionContext   # Write: sendMessage, deleteMessage, openThread
├─ ComponentContext       # 100+ customizable component slots
└─ MessageContext         # Per-message: actions, reactions, status
```

**All contexts have hooks:** `useChatContext()`, `useChannelStateContext()`, etc.

### State Management (Multi-Layer)

1. **Local state** (`useState`) - Component UI state
2. **Reducer state** (`useReducer`) - Channel uses `makeChannelReducer` for complex message state
3. **Context state** - Global shared state
4. **External state** - `stream-chat` SDK's StateStore via `useStateStore` hook (uses `useSyncExternalStore`)

## Critical Architectural Patterns

### 1. Optimistic Updates & Race Conditions

**File:** `src/components/Channel/Channel.tsx` + `channelState.ts`

- Messages are added to local state IMMEDIATELY when sending (optimistic)
- WebSocket events may arrive before/after API response
- **Timestamp-based conflict resolution:** Newest version always wins
- **Gotcha:** Thread state is separate from channel state - both must be updated

### 2. WebSocket Event Processing

**File:** `src/components/Channel/Channel.tsx` (`handleEvent` function)

```ts
// Events are THROTTLED to 500ms to prevent excessive re-renders
throttledCopyStateFromChannel = throttle(
  () => dispatch({ type: 'copyStateFromChannelOnEvent' }),
  500,
  { leading: true, trailing: true },
);
```

**Key behaviors:**

- Some events ignored: `user.watching.start/stop`
- Unread updates throttled separately (200ms)
- Message filtering: `parent_id` + `show_in_channel` determine thread visibility

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

### 5. Performance: Memoization & Throttling

**Critical memoization:**

- Message data serialized to string for comparison (see `useCreateChannelStateContext`)
- `areMessageUIPropsEqual` checks cheap props first (highlighted, mutes.length)
- **Gotcha:** Any prop not in serialization won't trigger updates!

**Throttling locations:**

- WebSocket events: 500ms
- Unread counter updates: 200ms
- `markRead`: 500ms (leading: true, trailing: false - only fires on FIRST call)
- `loadMoreFinished`: 2000ms debounced

## Critical Gotchas & Invariants

### DO NOT:

1. **Mutate `channel.state.messages` directly** - Use `channel.state.addMessageSorted()` / `removeMessage()`
2. **Include `channel` in dependency arrays** - Use `channel.cid` only (stable), not `channel.state` (changes constantly)
3. **Modify reducer action types without updating all dispatchers** - They're tightly coupled
4. **Change message sort order** - SDK maintains order; local changes will conflict
5. **Forget to update both channel AND thread state** - Thread messages must exist in main state too

### Thread State Synchronization

- Main channel: `state.messages` (flat list)
- Threads: `state.threads[parentId]` (keyed by parent message ID)
- **Invariant:** Messages in threads MUST also exist in main channel state

### Context Dependency Gotcha

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
3. `useCreateChannelStateContext` ↔ Message memoization - String serialization fragility

**Integration Risks:**

- Modifying reducer actions requires updates in multiple dispatchers
- Changing message sorting conflicts with SDK updates
- Thread state isolation is error-prone

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
- [ ] `yarn types` passed
- [ ] Tests added for changes
- [ ] No new warnings (zero tolerance)
- [ ] Screenshots for UI changes

**Release:** Automated via semantic-release based on commit messages.

### Deprecation Pattern

When deprecating, use `@deprecated` JSDoc tag with reason and docs link. Commit under `deprecate` type. See `developers/DEPRECATIONS.md` for full process.

## Build System

The build runs 4 steps in parallel via `concurrently`:

1. **`build-translations`** — Extracts `t()` calls from source via `i18next-cli`
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

- **12 languages**: de, en, es, fr, hi, it, ja, ko, nl, pt, ru, tr (JSON files in `src/i18n/`)
- **Keys are English text**: `t('Mute')`, `t('{{ user }} is typing...')`
- **Extraction**: `i18next-cli extract` scans `t()` calls in source → updates JSON files
- **Validation**: `yarn lint` runs `scripts/validate-translations.js` — fails on any empty translation string (zero tolerance)
- **Date/time**: `Streami18n` class wraps i18next + Dayjs with per-locale calendar formats
- **When adding translatable strings**: Use `t()` from `useTranslationContext()`, then run `yarn build-translations` to update JSON files. All 12 language files must have non-empty values.

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

1. `yarn build-translations` — Extracts `t()` calls via `i18next-cli`
2. `vite build` — Bundles 3 entry points (index, emojis, mp3-encoder) as ESM + CJS
3. `tsc --project tsconfig.lib.json` — Generates `.d.ts` type declarations to `dist/types/`
4. `yarn build-styling` — Compiles SCSS to `dist/css/index.css`

**Library entry points** (from `package.json` exports):

- `stream-chat-react` — Main SDK (all components, hooks, contexts)
- `stream-chat-react/emojis` — Emoji picker plugin (`src/plugins/Emojis/`)
- `stream-chat-react/mp3-encoder` — MP3 encoding for voice messages (`src/plugins/encoders/mp3.ts`)

Vite config: no minification, sourcemaps enabled, all deps externalized. Target: ES2020.

### i18n System

- 12 languages in `src/i18n/*.json` — **Natural language keys** (English text = key)
- `yarn build-translations` extracts `t()` calls from source via `i18next-cli extract`
- `yarn validate-translations` (runs during `yarn lint`) — **zero-tolerance: any empty string value fails the build**
- `Streami18n` class (`src/i18n/Streami18n.ts`) wraps i18next, integrates Dayjs for date/time formatting
- Interpolation: `t('Failed to update {{ field }}', { field })`, Plurals: `_one`/`_other` suffixes
- Access via `useTranslationContext()` hook — only works inside `<Chat>`

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

1. Add strings to `src/i18n/`
2. Run `yarn build-translations`
3. Use: `const { t } = useTranslationContext();`

## References

- **Integration patterns:** See `AI.md`
- **Repo structure:** See `AGENTS.md`
- **Development guides:** See `developers/`
- **Component docs:** https://getstream.io/chat/docs/sdk/react/
- **Stream Chat API:** https://getstream.io/chat/docs/javascript/
