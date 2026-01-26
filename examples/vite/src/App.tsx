import { useCallback, useEffect, useMemo } from 'react';
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
  // MessageList,
  Window,
} from 'stream-chat-react';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';
import { humanId } from 'human-id';

init({ data });

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const token = import.meta.env.VITE_USER_TOKEN;

if (!apiKey) {
  throw new Error('VITE_STREAM_API_KEY is not defined');
}

const options: ChannelOptions = { limit: 5, presence: true, state: true };
const sort: ChannelSort = { pinned_at: 1, last_message_at: -1, updated_at: -1 };

// @ts-ignore
const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

const useUser = () => {
  const userId = useMemo(() => {
    return (
      import.meta.env.VITE_USER_ID ||
      new URLSearchParams(window.location.search).get('user_id') ||
      localStorage.getItem('user_id') ||
      humanId({ separator: '_', capitalize: false })
    );
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');

    if (userId && storedUserId === userId) return;

    localStorage.setItem('user_id', userId);
  }, [userId]);

  const tokenProvider = useCallback(() => {
    return token
      ? Promise.resolve(token)
      : fetch(
          `https://pronto.getstream.io/api/auth/create-token?environment=shared-chat-redesign&user_id=${userId}`,
        )
          .then((response) => response.json())
          .then((data) => data.token as string);
  }, [userId]);

  return { userId: userId, tokenProvider };
};

const App = () => {
  const { userId, tokenProvider } = useUser();

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: { id: userId },
  });

  const filters: ChannelFilters = useMemo(
    () => ({
      members: { $in: [userId] },
      type: 'messaging',
      archived: false,
    }),
    [userId],
  );

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

      composer.updateConfig({
        linkPreviews: { enabled: true },
        location: { enabled: true },
      });
    });
  }, [chatClient]);

  if (!chatClient) return <>Loading...</>;

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
              <MessageInput
                focus
                audioRecordingEnabled
                maxRows={10}
                asyncMessagesMultiSendEnabled
              />
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
