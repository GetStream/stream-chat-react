import React from 'react';
import { ChannelFilters, ChannelOptions, ChannelSort, StreamChat } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  useChatContext,
  Window,
} from 'stream-chat-react';
import '@stream-io/stream-chat-css/dist/v2/css/index.css';
import { ThreadList } from './ThreadList/ThreadList';
import { ThreadListContextProvider, useThreadListContext } from './ThreadList/ThreadListContext';
import { useThreadsUnreadCount } from './ThreadList/useThreadsUnreadCount';

const params = (new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown) as Record<string, string | null>;

const apiKey = import.meta.env.VITE_STREAM_KEY as string;
const userId = params.uid ?? (import.meta.env.VITE_USER_ID as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);

const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
const options: ChannelOptions = { limit: 10, presence: true, state: true };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);

if (import.meta.env.VITE_CHAT_SERVER_ENDPOINT) {
  chatClient.setBaseURL(import.meta.env.VITE_CHAT_SERVER_ENDPOINT as string);
}

chatClient.connectUser({ id: userId }, userToken);

const OpenThreadButton = () => {
  const { unreadThreadCount } = useThreadsUnreadCount();
  const { reloadThreads } = useThreadListContext();

  return (
    <button onClick={reloadThreads} style={{ height: 50 }} type='button'>
      <span style={{ fontSize: 20, fontWeight: unreadThreadCount > 0 ? 'bold' : 'initial' }}>
        Open Thread{' '}
        {unreadThreadCount > 0 && (
          <span
            style={{
              backgroundColor: 'red',
              borderRadius: 20,
              color: 'white',
              fontSize: 10,
              padding: 10,
            }}
          >
            {unreadThreadCount}
          </span>
        )}
      </span>
    </button>
  );
};

const App = () => (
  <Chat client={chatClient}>
    <ThreadListContextProvider>
      <ChannelList
        filters={filters}
        HeaderComponent={() => <OpenThreadButton />}
        options={options}
        showChannelSearch
        sort={sort}
      />
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput focus />
        </Window>
        <Thread />
      </Channel>
      <ThreadList />
    </ThreadListContextProvider>
  </Chat>
);

export default App;
