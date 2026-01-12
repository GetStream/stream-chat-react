# Stream Chat React Integration Guide for AI Assistants

This guide helps AI assistants provide accurate integration instructions when users ask to "integrate stream-chat-react" or similar vague commands.

## Quick Start Integration Pattern

When a user wants to integrate stream-chat-react, follow this standard pattern:

### 1. Installation

```bash
npm install stream-chat stream-chat-react
# or
yarn add stream-chat stream-chat-react
```

### 2. Get Your Credentials

Before setting up the chat client, you'll need:

- **API Key**: Get your API key from the [Stream Dashboard](https://dashboard.getstream.io/)
- **User Token**: For development purposes, you can generate a user token manually using the [Token Generator](https://getstream.io/chat/docs/php/tokens_and_authentication/#manually-generating-tokens)
  - **Note**: Manual token generation is for development/testing only. For production, generate tokens server-side using your Stream API secret.

### 3. Basic Setup (Minimal Working Example)

The minimal integration requires:

- Stream Chat client setup
- Chat component wrapper
- Channel component with basic UI

```tsx
import { Chat, useCreateChatClient } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

// Get your API key from: https://dashboard.getstream.io/
// For development, generate a token at: https://getstream.io/chat/docs/php/tokens_and_authentication/#manually-generating-tokens
const apiKey = 'YOUR_API_KEY';
const userId = 'YOUR_USER_ID';
const userName = 'YOUR_USER_NAME';
const userToken = 'YOUR_USER_TOKEN';

const App = () => {
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId, name: userName },
  });

  if (!client) return <div>Setting up client & connection...</div>;

  return <Chat client={client}>Chat with client is ready!</Chat>;
};
```

### 4. Complete Chat UI Setup

For a full-featured chat interface:

```tsx
import type { ChannelFilters, ChannelOptions, ChannelSort, User } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useCreateChatClient,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

// Get your API key from: https://dashboard.getstream.io/
// For development, generate a token at: https://getstream.io/chat/docs/php/tokens_and_authentication/#manually-generating-tokens
const apiKey = 'YOUR_API_KEY';
const userId = 'YOUR_USER_ID';
const userName = 'YOUR_USER_NAME';
const userToken = 'YOUR_USER_TOKEN';

const user: User = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const sort: ChannelSort = { last_message_at: -1 };
const filters: ChannelFilters = {
  type: 'messaging',
  members: { $in: [userId] },
};
const options: ChannelOptions = {
  limit: 10,
};

const App = () => {
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  if (!client) return <div>Setting up client & connection...</div>;

  return (
    <Chat client={client}>
      <ChannelList filters={filters} sort={sort} options={options} />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};
```

## Common Integration Scenarios

### Scenario 1: New React App (Vite/CRA)

**User intent**: "Add stream-chat-react to my React app"

**Steps**:

1. Install packages: `npm install stream-chat stream-chat-react`
2. Get credentials:
   - API key from [Stream Dashboard](https://dashboard.getstream.io/)
   - User token (for development): Generate at [Token Generator](https://getstream.io/chat/docs/php/tokens_and_authentication/#manually-generating-tokens)
3. Import CSS: `import 'stream-chat-react/dist/css/v2/index.css'`
4. Set up client using `useCreateChatClient` hook
5. Wrap app with `<Chat>` component
6. Add `<Channel>` with `<Window>`, `<MessageList>`, `<MessageInput>`

**Reference**: See `examples/tutorial/` for step-by-step examples

### Scenario 2: Add Chat to Existing App

**User intent**: "Integrate chat into my existing React application"

**Steps**:

1. Install packages
2. Get credentials:
   - API key from [Stream Dashboard](https://dashboard.getstream.io/)
   - User token (for development): Generate at [Token Generator](https://getstream.io/chat/docs/php/tokens_and_authentication/#manually-generating-tokens)
3. Import CSS (preferably in a CSS layer for proper override precedence)
4. Create a separate chat component or route
5. Initialize client once at app level (use `useCreateChatClient` only once)
6. Access client elsewhere using `useChatContext()` hook

**Important**: The client should be created once and reused. Don't create multiple clients.

### Scenario 3: Custom Styling

**User intent**: "Customize the chat appearance"

**Steps**:

1. Import Stream CSS into a CSS layer
2. Create custom theme using CSS variables
3. Apply theme via `theme` prop on `<Chat>` component

```css
@layer base, theme;
@import 'stream-chat-react/dist/css/v2/index.css' layer(base);

@layer theme {
  .str-chat__theme-custom {
    --str-chat__primary-color: #009688;
    --str-chat__surface-color: #f5f5f5;
    /* ... more variables */
  }
}
```

```tsx
<Chat client={client} theme='str-chat__theme-custom'>
  {/* ... */}
</Chat>
```

**Reference**: See theming documentation and `examples/vite/src/stream-imports-theme.scss`

### Scenario 4: Custom Components

**User intent**: "Customize message or channel preview appearance"

**Steps**:

1. Create custom component matching the prop interface
2. Pass custom component via props (e.g., `Message`, `ChannelPreview`, `Attachment`)
3. Use hooks like `useMessageContext()` to access data

```tsx
const CustomMessage = () => {
  const { message } = useMessageContext();
  return (
    <div>
      {message.user?.name}: {message.text}
    </div>
  );
};

<Channel Message={CustomMessage}>{/* ... */}</Channel>;
```

**Reference**: See `examples/tutorial/src/4-custom-ui-components/`

### Scenario 5: Livestream Chat

**User intent**: "Create a livestream-style chat"

**Steps**:

1. Use `livestream` channel type (disables typing indicators, read receipts)
2. Use `VirtualizedMessageList` instead of `MessageList` for performance
3. Apply dark theme: `theme="str-chat__theme-dark"`
4. Set `live` prop on `ChannelHeader`

```tsx
<Chat client={client} theme='str-chat__theme-dark'>
  <Channel channel={channel}>
    <Window>
      <ChannelHeader live />
      <VirtualizedMessageList />
      <MessageInput focus />
    </Window>
  </Channel>
</Chat>
```

**Reference**: See `examples/tutorial/src/7-livestream/`

### Scenario 6: Emoji Support

**User intent**: "Add emoji picker and autocomplete"

**Steps**:

1. Install emoji packages: `npm install emoji-mart @emoji-mart/react @emoji-mart/data`
2. Initialize emoji data: `init({ data })` from `emoji-mart`
3. Import `EmojiPicker` from `stream-chat-react/emojis`
4. Pass `EmojiPicker` and `emojiSearchIndex={SearchIndex}` to `Channel`

```tsx
import { EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';

init({ data });

<Channel EmojiPicker={EmojiPicker} emojiSearchIndex={SearchIndex}>
  {/* ... */}
</Channel>;
```

**Note**: For React 19, may need package.json overrides for `@emoji-mart/react`

**Reference**: See `examples/tutorial/src/6-emoji-picker/`

## TypeScript Setup

For custom properties on channels, messages, attachments, etc., create a declaration file:

```ts
// stream-chat.d.ts
import { DefaultChannelData, DefaultAttachmentData } from 'stream-chat-react';

declare module 'stream-chat' {
  interface CustomChannelData extends DefaultChannelData {
    image?: string;
    name?: string;
  }

  interface CustomAttachmentData extends DefaultAttachmentData {
    image?: string;
    name?: string;
    url?: string;
  }
}
```

## Layout Styling

Basic layout CSS for proper component positioning:

```css
html,
body,
#root {
  height: 100%;
}
body {
  margin: 0;
}
#root {
  display: flex;
}

.str-chat__channel-list {
  width: 30%;
}
.str-chat__channel {
  width: 100%;
}
.str-chat__thread {
  width: 45%;
}
```

## Key Components Reference

### Core Components

- `<Chat>` - Root provider, wraps entire chat app
- `<Channel>` - Channel context provider
- `<ChannelList>` - Displays list of channels
- `<MessageList>` - Displays messages in channel
- `<MessageInput>` - Input for sending messages
- `<Thread>` - Thread/reply view
- `<Window>` - Wrapper for channel UI
- `<VirtualizedMessageList>` - Virtualized message list for high volume

### Utility Components

- `<ChannelHeader>` - Channel header with info
- `<Attachment>` - Renders message attachments

### Hooks

- `useCreateChatClient()` - Creates and connects client (use once per app)
- `useChatContext()` - Access client instance
- `useMessageContext()` - Access current message data
- `useChannelContext()` - Access current channel data

## Common Issues & Solutions

### Issue: Client not connecting

**Solution**: Ensure `useCreateChatClient` returns a client before rendering `<Chat>`. Show loading state while `client` is `null`.

### Issue: Styles not applying

**Solution**:

- Import CSS: `import 'stream-chat-react/dist/css/v2/index.css'`
- Use CSS layers for proper override precedence
- Check CSS import order

### Issue: Multiple clients created

**Solution**: Use `useCreateChatClient` only once at app root. Use `useChatContext()` to access client elsewhere.

### Issue: TypeScript errors for custom properties

**Solution**: Create `stream-chat.d.ts` file with proper type declarations (see TypeScript Setup section).

### Issue: Emoji picker not working

**Solution**:

- Ensure emoji packages are installed
- Initialize with `init({ data })` before rendering
- For React 19, add package.json overrides if needed

## Resources

- **Official Tutorial**: https://getstream.io/chat/react-chat/tutorial/
- **Tutorial Source**: https://raw.githubusercontent.com/GetStream/getstream.io-tutorials/refs/heads/main/chat/tutorials/react-tutorial.mdx
- **Component Docs**: https://getstream.io/chat/docs/sdk/react/
- **Examples in Repo**: `examples/tutorial/` (step-by-step), `examples/vite/` (complete example)
- **API Docs**: https://getstream.io/chat/docs/javascript/
- **Get API Key**: https://dashboard.getstream.io/
- **Token Generator (Development)**: https://getstream.io/chat/docs/php/tokens_and_authentication/#manually-generating-tokens

## Package Information

- **Package Name**: `stream-chat-react`
- **Peer Dependencies**:
  - `react`: ^19.0.0 || ^18.0.0 || ^17.0.0
  - `react-dom`: ^19.0.0 || ^18.0.0 || ^17.0.0
  - `stream-chat`: ^9.27.2
- **Optional Dependencies** (for emoji support):
  - `emoji-mart`: ^5.4.0
  - `@emoji-mart/react`: ^1.1.0
  - `@emoji-mart/data`: ^1.1.0

## Best Practices

1. **Client Creation**: Create client once at app root, reuse via context
2. **CSS Layers**: Use CSS layers for proper style override precedence
3. **Loading States**: Always check if client is ready before rendering chat components
4. **Type Safety**: Use TypeScript declaration files for custom properties
5. **Performance**: Use `VirtualizedMessageList` for high message volume scenarios
6. **Theming**: Use CSS variables and theme classes rather than direct CSS overrides
7. **Credentials**: Never hardcode credentials in production; use environment variables

## Integration Checklist

When helping users integrate, ensure:

- [ ] Packages installed (`stream-chat`, `stream-chat-react`)
- [ ] API key obtained from [Stream Dashboard](https://dashboard.getstream.io/)
- [ ] User token generated (for development: use [Token Generator](https://getstream.io/chat/docs/php/tokens_and_authentication/#manually-generating-tokens))
- [ ] CSS imported (`stream-chat-react/dist/css/v2/index.css`)
- [ ] Client created with `useCreateChatClient` (once, at app root)
- [ ] Loading state handled (check `if (!client)`)
- [ ] `<Chat>` component wraps chat UI
- [ ] At minimum: `<Channel>` with `<Window>`, `<MessageList>`, `<MessageInput>`
- [ ] Layout CSS added if needed (for proper positioning)
- [ ] TypeScript declarations added if using custom properties
- [ ] Theme applied if customizing appearance
- [ ] Credentials properly configured (API key, user token, etc.)

---

**Note for AI Assistants**: When users ask vague questions like "integrate stream-chat-react", start with the Quick Start Integration Pattern above. Ask clarifying questions about their use case (new app vs existing, styling needs, features required) to provide the most relevant scenario from Common Integration Scenarios.
