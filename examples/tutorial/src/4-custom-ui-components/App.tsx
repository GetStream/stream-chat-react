import { useEffect, useState } from 'react';
import type {
  Channel as StreamChannel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  User,
} from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelList,
  MessageComposer,
  MessageList,
  Thread,
  WithComponents,
  Window,
  useMessageContext,
  useCreateChatClient,
  type ChannelListItemUIProps,
} from 'stream-chat-react';

import './layout.css';

const apiKey = 'REPLACE_WITH_API_KEY';
const userId = 'REPLACE_WITH_USER_ID';
const userName = 'REPLACE_WITH_USER_NAME';
const userToken = 'REPLACE_WITH_USER_TOKEN';

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
      className='tutorial-channel-list-item'
      onClick={handleClick}
      type='button'
    >
      <ChannelAvatar
        imageUrl={displayImage ?? channel.data?.image}
        size='xl'
        userName={displayTitle ?? channel.data?.name ?? 'Channel'}
      />
      <div className='tutorial-channel-list-item__content'>
        <div className='tutorial-channel-list-item__title'>
          {displayTitle ?? channel.data?.name ?? 'Unnamed Channel'}
        </div>
        {latestMessagePreview && (
          <div className='tutorial-channel-list-item__preview'>
            {latestMessagePreview}
          </div>
        )}
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
  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useEffect(() => {
    if (!client) return;

    const initChannel = async () => {
      const nextChannel = client.channel('messaging', 'react-tutorial', {
        image: 'https://getstream.io/random_png/?name=react-v14',
        name: 'Talk about React',
        members: [userId],
      });

      await nextChannel.watch();
      setChannel(nextChannel);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize tutorial channel', error);
    });
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;
  if (!channel) return <div>Loading tutorial channel...</div>;

  return (
    <WithComponents
      overrides={{
        ChannelListItemUI: CustomChannelListItem,
        Message: CustomMessage,
      }}
    >
      <Chat client={client} theme='str-chat__theme-custom'>
        <ChannelList filters={filters} sort={sort} options={options} />
        <Channel channel={channel}>
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
