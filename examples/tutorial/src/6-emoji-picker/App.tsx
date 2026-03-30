import { useEffect, useState } from 'react';
import type {
  Channel as StreamChannel,
  ChannelFilters,
  ChannelSort,
  User,
} from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageComposer,
  MessageList,
  Thread,
  WithComponents,
  Window,
  useCreateChatClient,
} from 'stream-chat-react';
import { EmojiPicker } from 'stream-chat-react/emojis';

import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';

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

init({ data });

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
    <WithComponents overrides={{ EmojiPicker }}>
      <Chat client={client} theme='str-chat__theme-custom'>
        <ChannelList filters={filters} sort={sort} />
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer emojiSearchIndex={SearchIndex} />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </WithComponents>
  );
};

export default App;
