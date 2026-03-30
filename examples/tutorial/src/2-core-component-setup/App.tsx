import { useState, useEffect } from 'react';
import type { User, Channel as StreamChannel } from 'stream-chat';
import {
  useCreateChatClient,
  Chat,
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';

import 'stream-chat-react/dist/css/index.css';
// additionally
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
    <Chat client={client} theme='str-chat__theme-custom'>
      <Channel channel={channel}>
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
