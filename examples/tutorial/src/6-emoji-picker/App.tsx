import { useEffect, useState } from 'react';
import type { User } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  ChatView,
  MessageComposer,
  MessageList,
  Thread,
  useCreateChatClient,
  useSlotChannels,
  Window,
  WithComponents,
} from 'stream-chat-react';
import { EmojiPicker } from 'stream-chat-react/emojis';

import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../1-client-setup/credentials';

const user: User = {
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
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer emojiSearchIndex={SearchIndex} />
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
    <Chat client={client}>
      <WithComponents overrides={{ EmojiPicker }}>
        <ChatView layouts={chatViewLayouts} views={{ channels: <ChannelsWorkspace /> }} />
      </WithComponents>
    </Chat>
  );
};

export default App;
