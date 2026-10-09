import { useEffect, useState } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import { type ClientUser } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageComposer,
  MessageList,
  ThreadHeader,
  useCreateChatClient,
} from 'stream-chat-react';

import { ChatView, ThreadSlot } from 'stream-chat-react/slot-layout';

import 'stream-chat-react/dist/css/index.css';
import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../2-client-setup/credentials';
import { setUpCommandMiddlewares } from '../2-client-setup/commandMiddlewares';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

// A thread is opened through workspace navigation (a message's "reply in thread" action), which
// `ChatView` provides, into a layout slot. The channel is rendered directly, so the only slot is the
// thread's.
const chatViewLayouts = [{ id: 'channels' as const, slots: ['thread'] }];

const ChannelWorkspace = ({ channel }: { channel: StreamChannel }) => (
  <>
    <Channel channel={channel}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
    {/* `ThreadSlot` resolves the thread bound to the slot and hands it to `<Thread>`, which
        provides it to the components below. Renders nothing while no thread is open. */}
    <ThreadSlot slot='thread'>
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
    </ThreadSlot>
  </>
);

const App = () => {
  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  });

  // Commands such as /giphy need their middlewares in every composer (see
  // `setUpCommandMiddlewares`). A setup function applies to composers created after it is set, so
  // it is registered before the effects below create any.
  useEffect(() => {
    if (!client) return;
    client.config.setSetupFunction('messageComposer', ({ composer }) =>
      setUpCommandMiddlewares(composer),
    );
  }, [client]);

  useEffect(() => {
    if (!client) return;

    const initChannel = async () => {
      const channel = client.channelManager.ensure({
        data: {
          members: [userId],
          // custom channel fields live under `custom` since v10
          custom: {
            image: 'https://getstream.io/random_png/?name=react',
            name: 'Talk about React',
          },
        },
        id: 'custom_channel_id',
        type: 'messaging',
      });

      // `Channel` binds a channel to its subtree; it does not query one. Whoever supplies the
      // channel initializes it.
      //
      // `client.channelManager.ensure()` returns the stored instance for this cid, so a re-run of this effect
      // can hand back a channel that is already loaded -- query only when it is not. When a query
      // is needed, `channel.ensureWatched()` de-duplicates concurrent calls for the same channel, so two
      // overlapping runs still produce a single request.
      if (!channel.initialized) {
        await channel.ensureWatched();
      }

      setChannel(channel);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize tutorial channel', error);
    });
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;
  // Shown while the channel query is in flight -- `Channel` renders no loading state of its own.
  if (!channel) return <div>Loading tutorial channel...</div>;

  return (
    <Chat client={client}>
      <ChatView
        layouts={chatViewLayouts}
        views={{ channels: <ChannelWorkspace channel={channel} /> }}
      />
    </Chat>
  );
};

export default App;
