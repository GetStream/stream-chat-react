import { useEffect, useState } from 'react';
import type { ChannelFilters, ChannelSort, User } from 'stream-chat';
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
  WithComponents,
} from 'stream-chat-react';
import { EmojiPicker } from 'stream-chat-react/emojis';

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
    <Chat client={client}>
      <WithComponents overrides={{ EmojiPicker }}>
        <ChannelList filters={filters} sort={sort} />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer />
          </Window>
          <Thread />
        </Channel>
      </WithComponents>
    </Chat>
  );
};

export default App;
