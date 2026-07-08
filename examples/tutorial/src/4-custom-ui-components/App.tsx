import React, { useEffect, useState } from 'react';
import type { User } from 'stream-chat';
import {
  Channel,
  ChannelAvatar,
  ChannelHeader,
  type ChannelListItemUIProps,
  ChannelNavigation,
  Chat,
  ChatView,
  MessageComposer,
  MessageList,
  Thread,
  useChatViewNavigation,
  useCreateChatClient,
  useMessageContext,
  useSlotChannels,
  Window,
  WithComponents,
} from 'stream-chat-react';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../1-client-setup/credentials';

const user: User = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const CustomChannelListItem = ({
  active,
  channel,
  displayImage,
  displayTitle,
  latestMessagePreview,
}: ChannelListItemUIProps) => {
  // Selection is one navigation model: open the channel into a layout slot.
  const { open } = useChatViewNavigation();

  return (
    <button
      aria-pressed={active}
      onClick={() =>
        open({ key: channel.cid ?? undefined, kind: 'channel', source: channel })
      }
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

// One view ("channels") with a single channel slot. Module-scoped for a stable reference.
const chatViewLayouts = [{ id: 'channels' as const, slots: ['main-channel'] }];

const ChannelsWorkspace = () => {
  const channelSlots = useSlotChannels();

  return (
    <>
      <ChannelNavigation />
      {channelSlots.map(({ channel, slot }) => (
        <Channel channel={channel} key={slot}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer />
          </Window>
          <Thread />
        </Channel>
      ))}
    </>
  );
};

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
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
        <ChatView layouts={chatViewLayouts} views={{ channels: <ChannelsWorkspace /> }} />
      </Chat>
    </WithComponents>
  );
};

export default App;
