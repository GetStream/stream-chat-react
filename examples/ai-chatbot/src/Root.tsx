import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
} from 'stream-chat';
import { AIChatApp } from './components/AIChatApp';
import { ThemeProvider } from './contexts/ThemeContext';

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown as Record<string, string | null>;

const parseUserIdFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Token is missing');

  return JSON.parse(atob(payload))?.user_id;
};

const apiKey = params.key ?? (import.meta.env.VITE_STREAM_KEY as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);
const userId = parseUserIdFromToken(userToken);
const conversationId = params.conversation_id ?? undefined;

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
  archived: false,
};
const options: ChannelOptions = { limit: 5, presence: true, state: true };
const sort: ChannelSort = { pinned_at: 1, last_message_at: -1, updated_at: -1 };

const App = () => {
  return (
    <ThemeProvider>
      <AIChatApp
        apiKey={apiKey}
        userToken={userToken}
        userId={userId}
        filters={filters}
        options={options}
        sort={sort}
        initialChannelId={conversationId}
      />
    </ThemeProvider>
  );
};

export default App;
