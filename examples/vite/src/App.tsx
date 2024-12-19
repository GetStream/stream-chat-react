import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LiveLocationManagerConstructorParameters,
} from 'stream-chat';
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
  useChatContext,
  useLiveLocationSharingManager,
  Attachment,
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

const ShareLiveLocation = () => {
  const { channel } = useChatContext();

  return (
    <button
      onClick={() => {
        console.log('trying to fetch location');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('got location ', position);
            channel?.startLiveLocationSharing({
              latitude,
              longitude,
              end_time: new Date(Date.now() + 1 * 1000 * 3600 * 24).toISOString(),
            });
          },
          console.warn,
          { timeout: 200 },
        );
      }}
    >
      location
    </button>
  );
};

const watchLocationNormal: LiveLocationManagerConstructorParameters['watchLocation'] = (
  watcher,
) => {
  const watch = navigator.geolocation.watchPosition((position) => {
    watcher({ latitude: position.coords.latitude, longitude: position.coords.longitude });
  });

  return () => navigator.geolocation.clearWatch(watch);
};

const watchLocationTimed: LiveLocationManagerConstructorParameters['watchLocation'] = (watcher) => {
  const timer = setInterval(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      watcher({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    });
  }, 5000);

  return () => clearInterval(timer);
};

const App = () => {
  const chatClient = useCreateChatClient<StreamChatGenerics>({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  const manager = useLiveLocationSharingManager({
    client: chatClient ?? undefined,
    watchLocation: watchLocationTimed,
  });

  // const s = useStateStore(manager?.state)

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
          <Channel
            Attachment={(props) => {
              const [attachment] = props.attachments ?? [];

              if (attachment?.type === 'live_location') {
                return (
                  <div style={{ padding: 25 }}>
                    lat: {attachment.latitude}, lng: {attachment.longitude}
                  </div>
                );
              }

              return <Attachment {...props} />;
            }}
          >
            <Window>
              <ChannelHeader Avatar={ChannelAvatar} />
              <MessageList returnAllReadData />
              <AIStateIndicator />
              <MessageInput focus />
              <ShareLiveLocation />
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
