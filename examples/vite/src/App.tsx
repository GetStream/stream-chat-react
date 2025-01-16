import { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import {
  AIStateIndicator,
  Channel,
  ChannelAvatar,
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
} from 'stream-chat-react';
import 'stream-chat-react/css/v2/index.css';

const params = (new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown) as Record<string, string | null>;

const parseUserIdFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Token is missing');

  return JSON.parse(atob(payload))?.user_id;
};

const apiKey = params.key ?? (import.meta.env.VITE_STREAM_KEY as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);
const userId = parseUserIdFromToken(userToken);

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
  archived: false,
};
const options: ChannelOptions = { limit: 5, presence: true, state: true };
const sort: ChannelSort = [{ pinned_at: 1 }, { last_message_at: -1 }, { updated_at: -1 }];

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMemberType = Record<string, unknown>;
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
  memberType: LocalMemberType;
  messageType: LocalMessageType;
  pollOptionType: LocalPollOptionType;
  pollType: LocalPollType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

const App = () => {
  const chatClient = useCreateChatClient<StreamChatGenerics>({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  if (!chatClient) return <>Loading...</>;

  return (
    <Chat client={chatClient} isMessageAIGenerated={(message) => !!message?.ai_generated}>
      <ChatView>
        <ChatView.Selector />
        <ChatView.Channels>
          <ChannelList
            Avatar={ChannelAvatar}
            filters={filters}
            options={options}
            sort={sort}
            showChannelSearch
            additionalChannelSearchProps={{ searchForChannels: true }}
          />
          <Channel>
            <Window>
              <ChannelHeader Avatar={ChannelAvatar} />
              <MessageList returnAllReadData />
              <AIStateIndicator />
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
