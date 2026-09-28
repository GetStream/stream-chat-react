import { useEffect } from 'react';
import type { ChannelFilters, ClientUser, SortParamRequest } from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  ThreadHeader,
  useCreateChatClient,
} from 'stream-chat-react';
import {
  ChatView,
  type ChatViewSlotRenderers,
  type DeriveWorkspaceNavigation,
  Slot,
} from 'stream-chat-react/slot-layout';

import 'stream-chat-react/dist/css/index.css';
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

// One view ("channels") with two generic slots side by side. Each `<Slot>` renders whatever is
// open in it - a channel or a thread - through `slotRenderers`. Module-scoped so the references are
// stable (they feed the ChatView layout controller).
const chatViewLayouts = [{ id: 'channels' as const, slots: ['left', 'right'] }];

const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => (
    <Channel channel={source}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
  ),
  thread: ({ source }) => (
    <Thread thread={source}>
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
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

  if (!client) return <div>Setting up client & connection...</div>;

  return (
    <Chat client={client}>
      <ChatView
        deriveWorkspaceNavigation={deriveWorkspaceNavigation}
        layouts={chatViewLayouts}
        slotRenderers={slotRenderers}
        views={{ channels: <ChannelsWorkspace /> }}
      />
    </Chat>
  );
};

export default App;
