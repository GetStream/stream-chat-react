import type { ComponentType } from 'react';
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
  useMessageContext,
  useCreateChatClient,
} from 'stream-chat-react';
import type { ChannelPreviewUIComponentProps } from 'stream-chat-react';

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

const CustomChannelPreview = (props: ChannelPreviewUIComponentProps) => {
  const { channel, setActiveChannel } = props;

  const { messages } = channel.state;
  const messagePreview = messages[messages.length - 1]?.text?.slice(0, 30);

  return (
    <div
      onClick={() => setActiveChannel?.(channel)}
      style={{ margin: '12px', display: 'flex', gap: '5px' }}
    >
      <div>
        <img src={channel.data?.image} alt='channel-image' style={{ height: '36px' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div>{channel.data?.name || 'Unnamed Channel'}</div>
        {messagePreview && <div style={{ fontSize: '14px' }}>{messagePreview}</div>}
      </div>
    </div>
  );
};

const CustomMessage = () => {
  const { message } = useMessageContext();
  return (
    <div>
      <b style={{ marginRight: '4px' }}>{message.user?.name}</b> {message.text}
    </div>
  );
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
      <ChannelList
        Preview={CustomChannelPreview as ComponentType<ChannelPreviewUIComponentProps>}
        filters={filters}
        sort={sort}
        options={options}
      />
      <Channel Message={CustomMessage}>
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

export default App;
