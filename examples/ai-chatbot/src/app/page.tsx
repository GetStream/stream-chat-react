import type {
  ChannelFilters,
  ChannelPaginatorRequestOptions,
  SortParamRequest,
} from 'stream-chat';
import { AIChatApp } from '@/components/AIChatApp';
import { ThemeProvider } from '@/components/ThemeContext';
import { UserProvider } from '@/components/UserProvider';
import { createUserToken } from './createUserToken';

import '../components/index.scss';

const generateUserToken = (userId: string) => {
  const apiKey = process.env.STREAM_API_KEY as string | undefined;
  const secret = process.env.STREAM_API_SECRET as string | undefined;
  if (!apiKey || !secret) {
    throw new Error('Stream API key and secret are required');
  }

  const token = createUserToken(userId, secret);
  return { apiKey, token };
};

export default async function Home(props: {
  searchParams: Promise<{ conversation_id?: string; user_id?: string }>;
}) {
  const { conversation_id, user_id } = await props.searchParams;

  // If no user_id provided, generate a random UUID
  // The client will persist this in localStorage
  const userId = user_id || crypto.randomUUID();
  const { apiKey, token } = generateUserToken(userId);

  const filters: ChannelFilters = {
    members: { $in: [userId] },
    type: 'messaging',
    archived: false,
  };
  const pageSize = 15;
  const requestOptions: ChannelPaginatorRequestOptions = { presence: true, state: true };
  const sort: SortParamRequest[] = [
    { field: 'pinned_at', direction: 1 },
    { field: 'last_message_at', direction: -1 },
    { field: 'updated_at', direction: -1 },
  ];

  return (
    <ThemeProvider>
      <UserProvider>
        <AIChatApp
          apiKey={apiKey}
          userToken={token}
          userId={userId}
          filters={filters}
          pageSize={pageSize}
          requestOptions={requestOptions}
          sort={sort}
          initialChannelId={conversation_id}
        />
      </UserProvider>
    </ThemeProvider>
  );
}
