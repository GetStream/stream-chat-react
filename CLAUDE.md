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
# Development
yarn install              # Setup (use Node version from .nvmrc)
yarn build                # Full build
yarn test                 # Run Jest tests
yarn test <pattern>       # Run specific test
yarn lint-fix             # Fix all lint/format issues
yarn types                # TypeScript type checking

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

**File:** `src/components/Channel/Channel.tsx` (lines 342-433)

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

**File:** `src/components/MessageList/VirtualizedMessageList.tsx`

- Uses **react-virtuoso** with custom item sizing
- **Offset trick:** Uses `PREPEND_OFFSET = 10^7` to handle prepended messages without Virtuoso knowing
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
