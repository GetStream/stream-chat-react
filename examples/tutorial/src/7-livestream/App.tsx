import { useEffect, useState } from 'react';
import type { ClientUser, Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  Chat,
  getChannel,
  MessageComposer,
  useCreateChatClient,
  VirtualizedMessageList,
} from 'stream-chat-react';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../1-client-setup/credentials';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const App = () => {
  const [channel, setChannel] = useState<StreamChannel>();
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  });

  useEffect(() => {
    if (!chatClient) return;

    const initChannel = async () => {
      const spaceChannel = chatClient.channel('livestream', 'spacex', {
        // custom channel fields live under `custom` since v10
        custom: {
          image: 'https://goo.gl/Zefkbx',
          name: 'SpaceX launch discussion',
        },
      });

      // `Channel` binds a channel to its subtree; it does not query one, so initializing is the
      // caller's job. The cached instance may already be loaded, so query only when it is not --
      // and when a query is needed, `getChannel` de-duplicates calls that overlap in time.
      if (!spaceChannel.initialized) {
        await getChannel({ channel: spaceChannel, client: chatClient });
      }
      setChannel(spaceChannel);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize livestream channel', error);
    });
  }, [chatClient]);

  if (!chatClient) return <div>Setting up client & connection...</div>;
  if (!channel) return <div>Loading tutorial channel...</div>;

  return (
    <Chat client={chatClient} theme='str-chat__theme-dark'>
      <Channel channel={channel}>
        <ChannelHeader />
        <VirtualizedMessageList />
        <MessageComposer focus />
      </Channel>
    </Chat>
  );
};

export default App;
