import { useEffect, useState } from 'react';
import type { ClientUser, TextComposerMiddleware } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  getChannel,
  MessageComposer,
  MessageList,
  ThreadHeader,
  useCreateChatClient,
  WithComponents,
} from 'stream-chat-react';
import { ChatView, ThreadSlot, useSlotChannels } from 'stream-chat-react/slot-layout';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';

import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../2-client-setup/credentials';
import { setUpCommandMiddlewares } from '../2-client-setup/commandMiddlewares';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

init({ data });

// One view ("channels") with a single channel slot. Module-scoped for a stable reference.
const chatViewLayouts = [{ id: 'channels' as const, slots: ['main-channel', 'thread'] }];

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
        </Channel>
      ))}
      {/* The panel for a thread opened from a message's "reply in thread" action: `ThreadSlot`
          resolves the thread bound to the slot and hands it to `<Thread>`, which provides it to
          the components below. */}
      <ThreadSlot slot='thread'>
        <ThreadHeader />
        <MessageList />
        <MessageComposer emojiSearchIndex={SearchIndex} />
      </ThreadSlot>
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

  // Every composer the client creates - channel and thread alike - gets the command middlewares
  // (see `setUpCommandMiddlewares`) and emoji autocomplete: typing a `:shortcode` suggests matching
  // emojis. A setup function applies to composers created after it is set, so it is registered
  // before the effects below create any.
  useEffect(() => {
    if (!client) return;
    client.config.setSetupFunction('messageComposer', ({ composer }) => {
      setUpCommandMiddlewares(composer);
      composer.textComposer.middlewareExecutor.insert({
        middleware: [
          createTextComposerEmojiMiddleware(SearchIndex) as TextComposerMiddleware,
        ],
        position: { before: 'stream-io/text-composer/mentions-middleware' },
        unique: true,
      });
    });
  }, [client]);

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

      // `Channel` binds a channel to its subtree; it does not query one, so initializing is the
      // caller's job. The cached instance may already be loaded, so query only when it is not --
      // and when a query is needed, `getChannel` de-duplicates calls that overlap in time.
      if (!channel.initialized) {
        await getChannel({ channel, client });
      }
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
