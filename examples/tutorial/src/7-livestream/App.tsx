import { useEffect, useState } from 'react';
import type { Channel as StreamChannel, User } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageComposer,
  VirtualizedMessageList,
  Window,
  useCreateChatClient,
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

const App = () => {
  const [channel, setChannel] = useState<StreamChannel>();
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useEffect(() => {
    if (!chatClient) return;

    const initChannel = async () => {
      const spaceChannel = chatClient.channel('livestream', 'spacex', {
        image: 'https://goo.gl/Zefkbx',
        name: 'SpaceX launch discussion',
      });

      await spaceChannel.watch();
      setChannel(spaceChannel);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize livestream channel', error);
    });
  }, [chatClient]);

  if (!chatClient) return <div>Setting up client & connection...</div>;
  if (!channel) return <div>Loading tutorial channel...</div>;

  return (
    <Chat client={chatClient} theme='str-chat__theme-dark tutorial-livestream'>
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <VirtualizedMessageList />
          <MessageComposer focus />
        </Window>
      </Channel>
    </Chat>
  );
};

export default App;
