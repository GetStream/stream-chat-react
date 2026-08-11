import { useEffect } from 'react';
import type { ChannelFilters, ChannelSort, ClientUser } from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelNavigation,
  Chat,
  MessageComposer,
  MessageList,
  Thread,
  useCreateChatClient,
} from 'stream-chat-react';
import { ChatView, useSlotChannels } from 'stream-chat-react/slot-layout';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../1-client-setup/credentials';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const sort: ChannelSort = [{ direction: -1, field: 'last_message_at' }];
const filters: ChannelFilters = {
  type: 'messaging',
  members: { $in: [userId] },
};

// One view ("channels") with a single channel slot. Module-scoped so the reference is
// stable (it feeds the ChatView layout controller).
const chatViewLayouts = [{ id: 'channels' as const, slots: ['main-channel'] }];

// Renders the channel navigation (list + search) and the channel(s) currently open in
// a layout slot. Selecting a channel in the list binds it into a slot via ChatView
// navigation; `useSlotChannels` reads back the open channel(s).
const ChannelsWorkspace = () => {
  const channelSlots = useSlotChannels();

  return (
    <>
      <ChannelNavigation />
      {channelSlots.map(({ channel, slot }) => (
        <Channel channel={channel} key={slot}>
          <ChannelHeader />
          <MessageList />
          <MessageComposer />
          <Thread />
        </Channel>
      ))}
    </>
  );
};

const App = () => {
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  });

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
    <Chat client={client} theme='custom-theme'>
      <ChatView layouts={chatViewLayouts} views={{ channels: <ChannelsWorkspace /> }} />
    </Chat>
  );
};

export default App;
