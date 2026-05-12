import type { ChannelFilters, ChannelOptions, ChannelSort, User } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  useCreateChatClient,
  Window,
} from 'stream-chat-react';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../1-client-setup/credentials';

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
    tokenOrProvider: tokenProvider,
    userData: user,
  });

  if (!client) return <div>Setting up client & connection...</div>;

  return (
    <Chat client={client} theme='custom-theme'>
      <ChannelList filters={filters} options={options} sort={sort} />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageComposer />
        </Window>
        <Thread />
      </Channel>
    </Chat>
  );
};

export default App;
