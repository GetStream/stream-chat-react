import { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
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
  ChatView,
  useChannelStateContext,
} from 'stream-chat-react';
import '@stream-io/stream-chat-css/dist/v2/css/index.css';

const params = (new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown) as Record<string, string | null>;

const apiKey = params.key ?? (import.meta.env.VITE_STREAM_KEY as string);
const userId = params.uid ?? (import.meta.env.VITE_USER_ID as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
};
const options: ChannelOptions = { limit: 4, presence: true, state: true };
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

const C = () => {
  const { channel } = useChannelStateContext();

  return <button onPointerDown={() => channel.stopWatching()}></button>;
};

const App = () => {
  const chatClient = useCreateChatClient<StreamChatGenerics>({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  // const channel = useMemo(() => {
  //   if (!chatClient) return;

  //   const c = chatClient.channel('messaging', 'random-channel-2', {
  //     members: ['john', 'marco', 'mark'],
  //     name: 'Random 1',
  //   });
  //   c.updatePartial({ set: { name: 'Random 2' } });
  //   return c
  // }, [chatClient]);

  if (!chatClient) return <>Loading...</>;

  return (
    <Chat client={chatClient}>
      <ChatView>
        <ChatView.Selector />
        <ChatView.Channels>
          <ChannelList filters={filters} options={options} sort={sort} />
          <Channel>
            <C />
            <Window>
              <ChannelHeader />
              <MessageList returnAllReadData />
              <MessageInput focus />
            </Window>
            <Thread virtualized />
          </Channel>
        </ChatView.Channels>
        <ChatView.Threads>
          <ThreadList />
          <ChatView.ThreadAdapter>
            <Thread virtualized />
          </ChatView.ThreadAdapter>
        </ChatView.Threads>
      </ChatView>
    </Chat>
  );
};

export default App;
