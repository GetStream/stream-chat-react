import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { StreamChat } from 'stream-chat';
import { AIChatApp } from '@/components/AIChatApp';
import { ThemeProvider } from '@/components/ThemeContext';

import '../components/index.scss';

const generateUserToken = (userId: string) => {
  const apiKey = process.env.STREAM_API_KEY as string | undefined;
  const secret = process.env.STREAM_API_SECRET as string | undefined;
  if (!apiKey || !secret) {
    throw new Error('Stream API key and secret are required');
  }

  const client = new StreamChat(apiKey, secret);
  const token = client.createToken(userId);
  return { apiKey, token, userId };
};

export default async function Home(props: {
  searchParams: Promise<{ conversation_id?: string; user_id?: string }>;
}) {
  const { conversation_id, user_id = 'jane' } = await props.searchParams;
  const { apiKey, token, userId } = generateUserToken(user_id);

  const filters: ChannelFilters = {
    members: { $in: [userId] },
    type: 'messaging',
    archived: false,
  };
  const options: ChannelOptions = { limit: 15, presence: true, state: true };
  const sort: ChannelSort = {
    pinned_at: 1,
    last_message_at: -1,
    updated_at: -1,
  };

  return (
    <ThemeProvider>
      <AIChatApp
        apiKey={apiKey}
        userToken={token}
        userId={userId}
        filters={filters}
        options={options}
        sort={sort}
        initialChannelId={conversation_id}
      />
    </ThemeProvider>
  );
}
