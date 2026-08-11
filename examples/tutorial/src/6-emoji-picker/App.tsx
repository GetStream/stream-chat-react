import { useEffect, useState } from 'react';
import type { ClientUser } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  useCreateChatClient,
  WithComponents,
} from 'stream-chat-react';
import { ChatView, useSlotChannels } from 'stream-chat-react/slot-layout';
import { EmojiPicker } from 'stream-chat-react/emojis';

import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../1-client-setup/credentials';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

init({ data });

// One view ("channels") with a single channel slot. Module-scoped for a stable reference.
const chatViewLayouts = [{ id: 'channels' as const, slots: ['main-channel'] }];

const ChannelsWorkspace = () => {
  const channelSlots = useSlotChannels();

  return (
    <>
      <ChannelNavigation />
      {channelSlots.map(({ channel, slot }) => (
        <Channel channel={channel} key={slot}>
          <ChannelHeader />
          <MessageList />
          <MessageComposer emojiSearchIndex={SearchIndex} />
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
        members: [userId],
        // custom channel fields live under `custom` since v10
        custom: {
          image: 'https://getstream.io/random_png/?name=react-v14',
          name: 'Talk about React',
        },
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
        <ChatView layouts={chatViewLayouts} views={{ channels: <ChannelsWorkspace /> }} />
      </WithComponents>
    </Chat>
  );
};

export default App;
