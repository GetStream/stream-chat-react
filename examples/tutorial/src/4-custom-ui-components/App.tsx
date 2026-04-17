import React, { useEffect, useState } from 'react';
import type { ChannelFilters, ChannelOptions, ChannelSort, User } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelList,
  MessageComposer,
  MessageList,
  Thread,
  Window,
  WithComponents,
  useCreateChatClient,
  useMessageContext,
  type ChannelListItemUIProps,
} from 'stream-chat-react';

import './layout.css';
import { apiKey, userId, userName, userToken } from '../1-client-setup/credentials';

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

const CustomChannelListItem = ({
  active,
  channel,
  displayImage,
  displayTitle,
  latestMessagePreview,
  onSelect,
  setActiveChannel,
}: ChannelListItemUIProps) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onSelect) {
      onSelect(event);
      return;
    }

    setActiveChannel?.(channel, undefined, event);
  };

  return (
    <button
      aria-pressed={active}
      onClick={handleClick}
      style={{
        width: '100%',
        padding: '12px',
        display: 'flex',
        gap: '12px',
        border: 'none',
        background: active ? '#d3f2ef' : 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '20px',
      }}
      type='button'
    >
      <ChannelAvatar
        imageUrl={displayImage ?? channel.data?.image}
        size='xl'
        userName={displayTitle ?? channel.data?.name ?? 'Channel'}
      />
      <div style={{ flex: 1 }}>
        <div>{displayTitle ?? channel.data?.name ?? 'Unnamed Channel'}</div>
        {latestMessagePreview ? (
          <div style={{ fontSize: '14px', opacity: 0.75 }}>{latestMessagePreview}</div>
        ) : null}
      </div>
    </button>
  );
};

const CustomMessage = () => {
  const { message } = useMessageContext();
  const isOwnMessage = message.user?.id === userId;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        padding: '4px 8px',
      }}
    >
      <div
        style={{
          background: isOwnMessage ? '#d3f2ef' : '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          maxWidth: 'min(80%, 640px)',
          padding: '12px 16px',
        }}
      >
        <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700 }}>
          {message.user?.name}
        </div>
        <div style={{ color: '#334155' }}>{message.text}</div>
      </div>
    </div>
  );
};

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useEffect(() => {
    if (!client) return;

    const initChannel = async () => {
      const channel = client.channel('messaging', 'react-tutorial', {
        image: 'https://getstream.io/random_png/?name=react-v14',
        name: 'Talk about React',
        members: [userId],
      });

      await channel.watch();
      setIsReady(true);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize tutorial channel', error);
    });
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;
  if (!isReady) return <div>Loading tutorial channel...</div>;

  return (
    <WithComponents
      overrides={{
        ChannelListItemUI: CustomChannelListItem,
        Message: CustomMessage,
      }}
    >
      <Chat client={client} theme='custom-theme'>
        <ChannelList filters={filters} sort={sort} options={options} />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </WithComponents>
  );
};

export default App;
