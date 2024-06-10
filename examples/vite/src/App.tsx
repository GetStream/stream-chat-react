import React, { useState } from 'react';
import { Thread as ThreadType, ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  VirtualizedMessageList as MessageList,
  Thread,
  Window,
  useCreateChatClient,
  ThreadList,
  ThreadProvider,
} from 'stream-chat-react';
import '@stream-io/stream-chat-css/dist/v2/css/index.css';

const params = (new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown) as Record<string, string | null>;

const apiKey = import.meta.env.VITE_STREAM_KEY as string;
const userId = params.uid ?? (import.meta.env.VITE_USER_ID as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
};
const options: ChannelOptions = { limit: 10, presence: true, state: true };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalPollOptionType = Record<string, unknown>;
type LocalPollType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  pollOptionType: LocalPollOptionType;
  pollType: LocalPollType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

const threadOnly = userId !== 'john';

const App = () => {
  const chatClient = useCreateChatClient<StreamChatGenerics>({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  if (!chatClient) return <>Loading...</>;

  return (
    <Chat client={chatClient}>
      <div className='str-chat'>
        {!threadOnly && (
          <>
            <ChannelList filters={filters} options={options} sort={sort} />
            <Channel>
              <Window>
                <ChannelHeader />
                <MessageList returnAllReadData />
                <MessageInput focus />
              </Window>
              <Thread virtualized />
            </Channel>
          </>
        )}
        {threadOnly && <Threads />}
      </div>
    </Chat>
  );
};

const Threads = () => {
  const [state, setState] = useState<ThreadType | undefined>(undefined);

  return (
    <div className='str-chat__threads'>
      <ThreadList threadListItemProps={{ onPointerDown: (_, t) => setState(t) }} />
      <ThreadProvider thread={state}>
        <Thread virtualized />
      </ThreadProvider>
    </div>
  );
};

export default App;
