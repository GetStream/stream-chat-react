import { useEffect, useState } from 'react';
import type {
  ChannelFilters,
  ClientUser,
  SortParamRequest,
  TextComposerMiddleware,
} from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  getChannel,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  useCreateChatClient,
  WithComponents,
} from 'stream-chat-react';
import {
  ChatView,
  type ChatViewSlotRenderers,
  type DeriveWorkspaceNavigation,
  Slot,
} from 'stream-chat-react/slot-layout';
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

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];
const filters: ChannelFilters = {
  type: 'messaging',
  members: { $in: [userId] },
};

init({ data });

// One view ("channels") with two generic slots side by side. Each `<Slot>` renders whatever is
// open in it - a channel or a thread - through `slotRenderers`. Module-scoped so the references are
// stable (they feed the ChatView layout controller).
const chatViewLayouts = [{ id: 'channels' as const, slots: ['left', 'right'] }];

const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => (
    <Channel channel={source}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer emojiSearchIndex={SearchIndex} />
    </Channel>
  ),
  thread: ({ source }) => (
    <Thread thread={source}>
      <ThreadHeader />
      <MessageList />
      <MessageComposer emojiSearchIndex={SearchIndex} />
    </Thread>
  ),
};

// A plain click on a channel replaces the open one; ⌘/ctrl-click opens it beside, in the other slot.
const deriveWorkspaceNavigation: DeriveWorkspaceNavigation = (base) => ({
  openChannel: (channel, options) =>
    base.openChannel(channel, {
      ...options,
      additive:
        options?.additive ?? !!(options?.event?.metaKey || options?.event?.ctrlKey),
    }),
});

const ChannelsWorkspace = () => (
  <>
    <ChannelNavigation />
    {/* The slots' own container, so `layout.css` can react to the width they share. */}
    <div className='channel-slots'>
      <Slot slot='left' />
      <Slot slot='right' />
    </div>
  </>
);

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

  // Channel-list query config (filters/sort) lives on a `ChannelPaginator`. The list is registered
  // on `client.channelManager` — the orchestrator instantiated together with the client, which
  // keeps every registered list in sync with WS events. `<ChannelNavigation>` renders one list per
  // registered paginator.
  useEffect(() => {
    if (!client) return;
    const paginator = new ChannelPaginator({
      client,
      filters,
      id: 'channels:default',
      sort,
    });
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
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
        <ChatView
          deriveWorkspaceNavigation={deriveWorkspaceNavigation}
          layouts={chatViewLayouts}
          slotRenderers={slotRenderers}
          views={{ channels: <ChannelsWorkspace /> }}
        />
      </WithComponents>
    </Chat>
  );
};

export default App;
