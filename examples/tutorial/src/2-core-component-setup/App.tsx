import { useEffect, useState } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import { type ClientUser } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  Chat,
  getChannel,
  MessageComposer,
  MessageList,
  ThreadHeader,
  useCreateChatClient,
} from 'stream-chat-react';

import { ChatView, ThreadSlot } from 'stream-chat-react/slot-layout';

import 'stream-chat-react/dist/css/index.css';
import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../1-client-setup/credentials';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

// A thread is opened through workspace navigation (a message's "reply in thread" action), which
// `ChatView` provides -- so even a single-channel app hosts its channel and thread in layout slots.
const chatViewLayouts = [{ id: 'channels' as const, slots: ['main-channel', 'thread'] }];

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

  useEffect(() => {
    if (!client) return;

    const initChannel = async () => {
      const channel = client.channel('messaging', 'custom_channel_id', {
        members: [userId],
        // custom channel fields live under `custom` since v10
        custom: {
          image: 'https://getstream.io/random_png/?name=react',
          name: 'Talk about React',
        },
      });

      // `Channel` binds a channel to its subtree; it does not query one. Whoever supplies the
      // channel initializes it.
      //
      // `client.channel()` returns the cached instance for this cid, so a re-run of this effect
      // can hand back a channel that is already loaded -- query only when it is not. When a query
      // is needed, `getChannel` de-duplicates concurrent calls for the same channel, so two
      // overlapping runs still produce a single request.
      if (!channel.initialized) {
        await getChannel({ channel, client });
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
