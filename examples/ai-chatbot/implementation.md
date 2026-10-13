# Implementation: ChatGPT 4/Plus UI Redesign (Next.js)

## ✅ Completed Features

### Design Goals

- ✅ Match ChatGPT 4/Plus UI
- ✅ Next.js App Router architecture with Server Components
- ✅ Component-based architecture with isolated SCSS modules
- ✅ Light/dark theme toggle with localStorage persistence
- ✅ Mobile-responsive navigation with top bar
- ✅ Bookmarkable conversations with URL parameters
- ✅ Browser back/forward button support
- ✅ Override Stream Chat React styles via CSS variables
- ✅ Automatic conversation titles (summarized from the first message)
- ✅ Server-side token generation for secure authentication
- ✅ Rate limiting: 10 messages per conversation per 4 hours
- ✅ UUID-based random user generation with localStorage persistence
- ✅ Animated loading screen with fade-out transition and minimum display time

---

## Project Structure

```
examples/ai-chatbot/
├── src/app/
│   ├── layout.tsx                 # ✅ Root layout with metadata
│   ├── page.tsx                   # ✅ Server Component - generates user token, renders AIChatApp
│   └── createUserToken.ts         # ✅ Server-only HS256 user-token signing (node:crypto)
├── src/components/
│   ├── AIChatApp/
│   │   ├── AIChatApp.tsx          # ✅ Client Component - Chat wrapper with URL state management
│   │   └── AIChatApp.scss         # ✅ App layout styles with responsive grid
│   ├── LoadingScreen/
│   │   ├── LoadingScreen.tsx      # ✅ Animated loading screen with fade-out
│   │   ├── LoadingScreen.scss     # ✅ Loading animations and theme-aware styles
│   │   └── index.ts
│   ├── Sidebar/
│   │   ├── Sidebar.tsx            # ✅ Channel list sidebar with collapse
│   │   ├── Sidebar.scss           # ✅ Dark/light sidebar styles
│   │   ├── SidebarHeader.tsx      # ✅ New chat button + logo
│   │   ├── SidebarHeader.scss
│   │   ├── SidebarFooter.tsx      # ✅ Theme toggle (desktop)
│   │   ├── SidebarFooter.scss
│   │   ├── ChannelPreviewItem.tsx # ✅ Custom channel preview
│   │   └── ChannelPreviewItem.scss
│   ├── TopNavBar/
│   │   ├── TopNavBar.tsx          # ✅ Mobile navigation with hamburger + theme toggle
│   │   └── TopNavBar.scss
│   ├── ChatContainer/
│   │   ├── ChatContainer.tsx      # ✅ Main chat area wrapper
│   │   └── ChatContainer.scss     # ✅ Flexbox layout with overflow management
│   ├── MessageBubble/
│   │   ├── MessageBubble.tsx      # ✅ Custom message component
│   │   └── MessageBubble.scss     # ✅ ChatGPT-style bubbles with dynamic sizing
│   ├── MessageInputBar/
│   │   ├── MessageInputBar.tsx    # ✅ AIMessageComposer wrapper
│   │   └── MessageInputBar.scss   # ✅ Theme-aware input & model selector
│   ├── AIStateIndicator/
│   │   ├── AIStateIndicator.tsx   # ✅ Custom thinking indicator with random messages
│   │   └── AIStateIndicator.scss
│   ├── EmptyState/
│   │   ├── EmptyState.tsx         # ✅ Empty placeholder
│   │   └── EmptyState.scss        # ✅ Theme-aware styling
│   ├── ActiveChannelContext.tsx   # ✅ The conversation shown in the chat area (app-owned)
│   ├── ThemeContext.tsx           # ✅ Client-side theme state with localStorage
│   ├── UserProvider.tsx           # ✅ Client-side user initialization and URL sync
│   ├── rateLimitUtils.ts          # ✅ Rate limiting utilities for message tracking
│   ├── api.ts                     # ✅ API functions (startAiAgent, summarizeConversation)
│   ├── stream-chat.d.ts           # ✅ Custom data typing (channel `summary`, message `ai_generated`)
│   └── index.scss                 # ✅ Global styles + CSS variables for both themes
├── public/                        # ✅ Static assets
├── next.config.ts                 # ✅ Next.js configuration (single copy of stream-chat / state-store)
├── package.json                   # ✅ Dependencies (Next.js 16, React 19)
└── tsconfig.json                  # ✅ TypeScript configuration
```

---

## Color Scheme

**CSS Variables in `index.scss`:**

```scss
:root,
:root[data-theme='dark'] {
  /* Dark theme colors matching ChatGPT 4 */
  --ai-demo-bg-primary: #212121; // Main background
  --ai-demo-bg-secondary: #171717; // Sidebar background
  --ai-demo-bg-tertiary: #2f2f2f; // Hover states & inputs
  --ai-demo-border: #4a4a4a; // Borders

  /* Text colors */
  --ai-demo-text-primary: #ececec; // Main text
  --ai-demo-text-secondary: #b4b4b4; // Secondary text
  --ai-demo-text-tertiary: #8e8e8e; // Muted text

  /* Message colors */
  --ai-demo-user-bg: #2f2f2f; // User message background
  --ai-demo-ai-bg: #2f2f2f; // AI message background

  /* Accent colors */
  --ai-demo-accent: #10a37f; // ChatGPT green
  --ai-demo-accent-hover: #0d8968;

  /* Font */
  --ai-demo-font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial',
    sans-serif;
}

:root[data-theme='light'] {
  /* Light theme colors */
  --ai-demo-bg-primary: #ffffff;
  --ai-demo-bg-secondary: #f7f7f8;
  --ai-demo-bg-tertiary: #ececf1;
  --ai-demo-border: #d9d9e3;

  --ai-demo-text-primary: #353740;
  --ai-demo-text-secondary: #565869;
  --ai-demo-text-tertiary: #8e8ea0;

  --ai-demo-user-bg: #ececf1;
  --ai-demo-ai-bg: #ececf1;

  --ai-demo-accent: #10a37f;
  --ai-demo-accent-hover: #0d8968;
}
```

---

## Component Details

### 1. **app/page.tsx (Server Component)**

✅ Implemented features:

- **Server-side token generation**: Signs a Stream user token (HS256 JWT, `{ user_id }`) with `STREAM_API_SECRET` in `createUserToken.ts`; `stream-chat` v10 is client-only and has no `createToken()`
- **UUID-based user generation**: Generates random UUID for each user (replaces hardcoded 'jane')
- **User ID override**: Supports `?user_id=` URL parameter for testing/debugging
- Defines the conversation list's filters, sort (`SortParamRequest[]`), page size and request options
- Extracts `conversation_id` from URL params
- Renders `AIChatApp` wrapped in `ThemeProvider` and `UserProvider`
- Passes authentication and configuration props to client component

### 2. **LoadingScreen (Client Component)**

✅ Implemented features:

- **Animated AI icon**: Material Symbols "auto_awesome" with floating animation
- **Pulsing effect**: Circular pulse animation behind the icon
- **Professional copy**: "Stream AI Chat" title with "Initializing Stream AI assistant..." subtitle
- **Loading dots**: Three dots with staggered bounce animation
- **Theme-aware styling**: Uses CSS variables for seamless dark/light mode support
- **Smooth fade-out**: 400ms opacity transition when unmounting
- **Minimum display time**: Guaranteed 750ms display time to prevent jarring flashes
- **Absolute positioning**: Overlays on top of content with z-index: 1000
- **Controlled unmount**: Three-stage state management (minTime → fadeOut → unmount)

**Animations:**

- `float`: Icon moves up and down smoothly (3s loop)
- `pulse`: Background circle expands and fades (2s loop)
- `bounce`: Three dots bounce with 0.2s stagger delays

### 3. **AIChatApp.tsx (Client Component)**

✅ Implemented features:

- Marked as `'use client'` directive for client-side interactivity
- Sets up `Chat` provider with `isMessageAIGenerated` (reads `message.custom.ai_generated`)
- Split into wrapper component and `ChatContent` (uses `useChatContext`)
- Wraps the app in `ActiveChannelProvider`: v15 has no `ChatContext.setActiveChannel`, so the app owns which channel `<Channel channel={…}>` renders
- Registers the conversation list as a `ChannelPaginator` on `client.channelManager`
- **Loading Screen Management**:
  - Shows `LoadingScreen` until chat client is ready AND 750ms minimum time has elapsed
  - Three-stage fade-out: ready state → fade animation (400ms) → unmount
  - Prevents jarring flashes when client initializes quickly
- **URL State Management**: Updates URL with `?conversation_id=` when switching channels
- **Browser Navigation**: Handles popstate events for back/forward button support
- **Initial Channel Loading**: Watches the channel from the URL with `getChannel` on mount (`Channel` no longer queries)
- Layout: CSS Grid with collapsible sidebar
- Renders `Sidebar` + `ChatContainer`

### 4. **Sidebar**

✅ Implemented features:

- Theme-aware sidebar with `--ai-demo-bg-secondary`
- Contains `SidebarHeader`, `ChannelLists` (renders the paginator registered on the channel manager), and `SidebarFooter`
- Mobile: Overlay with backdrop, toggle via TopNavBar hamburger
- Desktop: Fixed sidebar with theme toggle in footer
- Width: 260px (desktop), full-width overlay (mobile)
- Smooth transitions for collapse/expand

### 5. **SidebarHeader**

✅ Implemented features:

- "New Chat" button with Material Symbols icon
- Creates new channel with `ai-${nanoId()}` pattern
- Styled as button with hover effect
- ChatGPT logo/branding area

### 6. **SidebarFooter**

✅ Implemented features:

- Theme toggle button (desktop only)
- Material Symbols icons (light_mode/dark_mode)
- Smooth transitions

### 7. **TopNavBar**

✅ Implemented features:

- Mobile navigation bar with hamburger menu
- Shows current conversation title (with ellipsis for long titles)
- Theme toggle button (mobile)
- Material Symbols rounded icons
- Fixed positioning at top

### 8. **ChannelPreviewItem**

✅ Implemented features:

- Shows `channel.data.custom.summary`, falling back to "New Chat" (read reactively from `channel.state`)
- Hover background: `--ai-demo-bg-tertiary`
- Active state: background color change
- Truncate long text with ellipsis
- Theme-aware colors

### 9. **ChatContainer**

✅ Implemented features:

- Wraps `Channel` component (rendered once a channel is active)
- Contains `TopNavBar`, `MessageList`, `AIStateIndicator` and `MessageComposer` (with the `MessageInputBar` UI) in the channel column
- Max-width: 900px, centered
- **Flexbox layout with overflow management** to ensure message list scrolls while keeping indicator and input visible
- Mobile-responsive with top padding for TopNavBar

### 10. **MessageBubble**

✅ Implemented features:

- User messages: right-aligned with `--ai-demo-user-bg`, rounded bubbles (18px)
- AI messages: left-aligned with `--ai-demo-ai-bg`, rounded bubbles (18px)
- **Dynamic sizing**: bubbles grow with content
- Compact padding (0.5rem 0.75rem) matching ChatGPT
- Min-width: 50% for AI messages (better streaming UX)
- Max-width: 70% (user), 80% (AI)
- Avatar hidden

### 11. **AIStateIndicator**

✅ Implemented features:

- Custom thinking indicator with animated dots
- **Random cheesy messages**: "Consulting the AI gods", "Brewing up an answer", etc.
- Messages change every 2 seconds during thinking state
- Theme-aware styling

### 12. **MessageInputBar**

✅ Implemented features:

- Wraps `AIMessageComposer`
- Creates the conversation on first send (`getChannel`), starts the AI agent, sends via `channel.sendMessageWithLocalUpdate`
- Titles a new conversation from its first message (`/summarize`), stored with `channel.update({ data: { custom: { summary } } })`
- Rounded input box (1.5rem border-radius)
- **Theme-aware model selector**: overrides `.str-chat__ai-message-composer__select`
- Theme-aware input field and submit button
- Focus states with accent color
- Responsive padding
- **Rate limiting**: 10 messages per conversation in 4-hour window
  - Tracks message count per conversation in localStorage
  - Disables all inputs when limit reached
  - Shows informative banner with reset countdown
  - Automatically resets after 4 hours
  - Updates countdown every minute

### 13. **EmptyState**

✅ Implemented features:

- Centered content with welcome message
- Auto-creates channel (existing behavior preserved)
- Theme-aware styling with CSS variables
- Material Symbols icon

### 14. **ThemeContext (Client Component)**

✅ Implemented features:

- React Context for theme state ('light' | 'dark')
- localStorage persistence with key 'ai-demo-theme'
- Respects system preference (prefers-color-scheme) on first load
- Sets `data-theme` attribute on document root
- `useTheme` hook for accessing theme state and toggle function

### 15. **UserProvider (Client Component)**

✅ Implemented features:

- Client-side user initialization and URL synchronization
- Gets or generates UUID for user on first load
- Syncs user ID with URL parameters (`?user_id=`)
- Persists user ID to localStorage for session continuity
- Shows loading state during initialization

### 16. **rateLimitUtils.ts**

✅ Implemented features:

- **getUserId()**: Gets or creates random UUID user ID
  - Checks URL params first for `?user_id=` override
  - Falls back to localStorage for persistence
  - Generates new UUID if neither exists
- **checkRateLimit()**: Checks if conversation has hit rate limit
  - Returns `isLimited`, `resetTime`, and `remainingMessages`
  - Automatically resets after 4-hour window expires
- **recordMessage()**: Records message sent to conversation
  - Tracks message count and first message timestamp
  - Stores data in localStorage per conversation
  - Resets counter when 4-hour window expires
- **formatTimeRemaining()**: Formats reset time as human-readable string
  - Returns format like "3h 45m" or "25m"
  - Used in rate limit banner message

### 17. **api.ts**

✅ Implemented features:

- **startAiAgent**: Initiates AI agent for a channel
  - Accepts channel, model, and platform parameters
  - Posts to `/start-ai-agent` endpoint
- **summarizeConversation**: Generates conversation summaries
  - Accepts conversation text
  - Posts to `/summarize` endpoint with OpenAI platform
  - Returns summary string from API response

---

## Next.js Architecture

### App Router Structure

The application uses Next.js App Router with a hybrid Server/Client Component architecture:

**Server Components:**

- `app/layout.tsx` - Root layout with metadata
- `src/app/page.tsx` - Main page component that handles server-side token generation

**Client Components:**

- `src/components/AIChatApp/AIChatApp.tsx` - Marked with `'use client'` directive
- `src/components/ThemeContext.tsx` - Uses React Context and browser APIs
- All interactive UI components (Sidebar, ChatContainer, etc.)

**Benefits:**

- **Security**: Stream API credentials never exposed to client
- **Performance**: Token generation happens on server
- **SEO**: Better metadata handling with Next.js metadata API

### Environment Variables

Required in `.env.local`:

```
STREAM_API_KEY=your_api_key_here
STREAM_API_SECRET=your_api_secret_here
```

These are accessed server-side only in `src/app/page.tsx` using `process.env`.

### localStorage Keys

The app uses the following localStorage keys for client-side persistence:

- `ai-demo-theme` - Stores user's theme preference ('light' | 'dark')
- `user_id` - Stores randomly generated UUID for user identification
- `rate_limit_{conversationId}` - Stores rate limit data per conversation (message count, first message timestamp)

---

## Stream Chat React CSS Variable Overrides

Implemented globally in `src/components/index.scss`:

```scss
:root {
  /* Override Stream Chat React variables */
  --str-chat__primary-color: var(--ai-demo-accent);
  --str-chat__background-color: var(--ai-demo-bg-primary);
  --str-chat__channel-background-color: var(--ai-demo-bg-primary);
  --str-chat__secondary-background-color: var(--ai-demo-bg-secondary);
  --str-chat__border-color: var(--ai-demo-border);
  --str-chat__text-color: var(--ai-demo-text-primary);
  --str-chat__text-low-emphasis-color: var(--ai-demo-text-secondary);

  /* Channel list overrides */
  --str-chat__channel-preview-hover-background: var(--ai-demo-bg-tertiary);
  --str-chat__channel-preview-active-background: var(--ai-demo-bg-tertiary);

  /* Message overrides */
  --str-chat__message-bubble-color: var(--ai-demo-user-bg);
  --str-chat__font-family: var(--ai-demo-font-family);
}
```

---

## Mobile Responsiveness

✅ **Breakpoint:** 768px

- ✅ Sidebar overlay with backdrop on mobile
- ✅ TopNavBar with hamburger menu, conversation title, and theme toggle
- ✅ ChatContainer takes full width with top padding for fixed TopNavBar
- ✅ Responsive padding and spacing throughout
- ✅ Smooth transitions for sidebar collapse/expand
- ✅ Touch-friendly button sizes

---

## Technical Highlights

### URL State Management

The app uses `window.history.pushState()` to update the URL when switching conversations, and listens to `popstate` events to handle browser back/forward navigation. This makes conversations shareable and bookmarkable.

### Theme System

Theme state is managed via React Context and persisted to localStorage. The theme is applied by setting a `data-theme` attribute on the document root, which allows CSS variables to be scoped appropriately.

### Loading Screen System

The app implements a sophisticated loading screen with smooth transitions:

- **Minimum display time**: LoadingScreen always shows for at least 750ms to prevent jarring flashes
- **Three-stage state management**:
  1. `minTimeElapsed` - Tracks whether minimum 750ms has passed
  2. `isFadingOut` - Triggers fade animation when client ready AND time elapsed
  3. `showLoadingScreen` - Controls unmount after 400ms fade completes
- **Smooth fade-out**: CSS transition on opacity (400ms ease-out)
- **Absolute positioning**: z-index: 1000 ensures overlay on top of content
- **Animation polish**:
  - Floating AI icon (3s loop)
  - Pulsing glow effect (2s loop)
  - Staggered bouncing dots (0.2s delays)
- **Theme-aware**: Inherits all color variables for seamless light/dark mode

**Implementation details:**

- Timer cleanup on unmount prevents memory leaks
- Fade-out only triggers once via `isFadingOut` guard
- Chat content loads in parallel, hidden behind loading screen until ready
- Prevents "already loaded" flicker on fast connections

### Rate Limiting System

The app implements client-side rate limiting to control message sending:

- **Per-conversation limits**: Each conversation tracks its own message count independently
- **4-hour rolling window**: Limits reset automatically 4 hours after the first message
- **localStorage persistence**: Rate limit data persists across page refreshes
- **Real-time updates**: Countdown updates every minute to show time remaining
- **Graceful UI**:
  - Disabled fieldset prevents all input interactions
  - Amber warning banner shows informative message with countdown
  - Material Symbols info icon for visual clarity
- **UUID-based users**: Each user gets a random UUID stored in localStorage
- **Override support**: `?user_id=` URL parameter allows testing with specific user IDs

**Implementation details:**

- Rate limit state checked on mount and when channel changes
- Message recorded after successful send
- Form submission blocked when limit reached
- All inputs (text, file, speech-to-text, model selector, submit) disabled via fieldset

### Automatic Conversation Summarization

The app titles a conversation from its first message:

- **Triggering**: `MessageInputBar` checks after sending whether the channel has a summary yet
- **API integration**: Calls `/summarize` endpoint with OpenAI platform
- **Channel update**: Stores returned summary in `channel.data.custom.summary`

This summary is displayed in the sidebar's `ChannelPreviewItem` and the `TopNavBar`, falling back to "New Chat" if no summary exists.

### Flexbox Overflow Management

The ChatContainer uses a careful flexbox layout to ensure the message list scrolls while the AIStateIndicator and MessageInputBar remain visible:

### Dynamic Message Bubble Sizing

Message bubbles grow dynamically based on content, with different constraints for user vs AI messages:

### SDK Style Overrides

To properly override the AI Message Composer styles, we target the correct class (`.str-chat__ai-message-composer__select`) which has `all: unset` and `background-color: transparent` set by default:

---

## SCSS Architecture

Each component has its own isolated SCSS file:

```tsx
import './ComponentName.scss';
```

**Global styles** in `src/components/index.scss`:

- CSS variables for both themes
- CSS layers
- Reset styles
- Font imports (Material Symbols Rounded)
- Stream Chat React CSS variable overrides
- Imported once in `src/app/page.tsx`

**Component styles** follow BEM-like naming: `ai-demo-component__element--modifier`

**Next.js Integration:**

- Global styles imported in server component (`src/app/page.tsx`)
- Component-level SCSS imported directly in each component file
- Next.js automatically handles SCSS compilation via built-in support

---

## Build and Development

### Commands

Run from the repository root (Yarn workspaces; build the SDK first with `yarn build`):

```bash
# Development server with hot reload
yarn start:ai-chatbot

# Production build
yarn workspace @stream-io/stream-chat-react-ai-chatbot build

# Start production server
yarn workspace @stream-io/stream-chat-react-ai-chatbot start
```

### Key Differences from Vite

- No `vite.config.ts` - configuration in `next.config.ts`
- No separate `index.html` entry point - uses App Router
- Built-in SCSS support without additional plugins
- Server-side rendering capabilities
- Automatic code splitting and optimization

---
