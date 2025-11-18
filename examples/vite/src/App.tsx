import { useEffect } from 'react';
import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
  TextComposerMiddleware,
} from 'stream-chat';
import {
  AIStateIndicator,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelList,
  Chat,
  ChatView,
  MessageInput,
  Thread,
  ThreadList,
  useCreateChatClient,
  VirtualizedMessageList as MessageList,
  Window,
} from 'stream-chat-react';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';

init({ data });

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown as Record<string, string | null>;

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
const sort: ChannelSort = { pinned_at: 1, last_message_at: -1, updated_at: -1 };

// @ts-ignore
const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

const App = () => {
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  useEffect(() => {
    if (!chatClient) return;

    chatClient.setMessageComposerSetupFunction(({ composer }) => {
      composer.textComposer.middlewareExecutor.insert({
        middleware: [
          createTextComposerEmojiMiddleware(SearchIndex) as TextComposerMiddleware,
        ],
        position: { before: 'stream-io/text-composer/mentions-middleware' },
        unique: true,
      });
    });
  }, [chatClient]);

  if (!chatClient) return <>Loading...</>;

  chatClient.axiosInstance.interceptors.response.use(
    (response) => {
      // Simulate a 500 for specific routes
      if (response.config.url?.includes('/delivered')) {
        // throw a fake error like a real server would
        const error = {
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: { error: 'Simulated server error' },
            config: response.config,
          },
        };
        return Promise.reject(error);
      }

      return response;
    },
    (error) => Promise.reject(error),
  );
  return (
    <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
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
          <Channel emojiSearchIndex={SearchIndex} EmojiPicker={EmojiPicker}>
            <Window>
              <ChannelHeader Avatar={ChannelAvatar} />
              <MessageList returnAllReadData />
              <AIStateIndicator />
              <MessageInput focus audioRecordingEnabled />
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
