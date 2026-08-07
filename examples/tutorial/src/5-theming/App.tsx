import { useMemo } from 'react';
import type { ChannelFilters, ChannelSort, User } from 'stream-chat';
import { ChannelPaginator, ChannelPaginatorsOrchestrator } from 'stream-chat';
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
import { apiKey, tokenProvider, userId, userName } from '../2-client-setup/credentials';

const user: User = {
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

  // Channel-list query config (filters/sort) now lives on a `ChannelPaginator`,
  // coordinated by the `ChannelPaginatorsOrchestrator` passed to `<Chat>`.
  const channelPaginatorsOrchestrator = useMemo(
    () =>
      client &&
      new ChannelPaginatorsOrchestrator({
        client,
        paginators: [
          new ChannelPaginator({ client, filters, id: 'channels:default', sort }),
        ],
      }),
    [client],
  );

  if (!client || !channelPaginatorsOrchestrator)
    return <div>Setting up client & connection...</div>;

  return (
    <Chat
      channelPaginatorsOrchestrator={channelPaginatorsOrchestrator}
      client={client}
      theme='custom-theme'
    >
      <ChatView layouts={chatViewLayouts} views={{ channels: <ChannelsWorkspace /> }} />
    </Chat>
  );
};

export default App;
