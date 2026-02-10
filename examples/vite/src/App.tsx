import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
  TextComposerMiddleware,
  Event,
  createCommandInjectionMiddleware,
  createDraftCommandInjectionMiddleware,
  createActiveCommandGuardMiddleware,
  createCommandStringExtractionMiddleware,
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
  // VirtualizedMessageList as MessageList,
  MessageList,
  Window,
  WithComponents,
  GroupAvatar,
  ReactionsList,
  useMessageContext,
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
      new URLSearchParams(window.location.search).get('user_id') ||
      import.meta.env.VITE_USER_ID ||
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

const CustomMessageReactions = (props: React.ComponentProps<typeof ReactionsList>) => {
  const { visualStyle, verticalPosition, flipHorizontalPosition } = useContext(TempCtx);

  return (
    <ReactionsList
      {...props}
      flipHorizontalPosition={flipHorizontalPosition}
      verticalPosition={verticalPosition}
      visualStyle={visualStyle}
    />
  );
};

type TempCtxValue = {
  visualStyle: 'clustered' | 'segmented';
  verticalPosition: 'top' | 'bottom';
  flipHorizontalPosition: boolean;
};
const TempCtx = createContext<TempCtxValue>({
  visualStyle: 'clustered',
  verticalPosition: 'top',
  flipHorizontalPosition: false,
});

const App = () => {
  const { userId, tokenProvider } = useUser();

  const [tempCtxValue, setTempCtxValue] = useState<TempCtxValue>({
    visualStyle: 'clustered',
    verticalPosition: 'top',
    flipHorizontalPosition: false,
  });

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
      // todo: find a way to register multiple setup functions so that the SDK can have own setup independent from the integrator setup
      composer.compositionMiddlewareExecutor.insert({
        middleware: [createCommandInjectionMiddleware(composer)],
        position: { after: 'stream-io/message-composer-middleware/attachments' },
        unique: true,
      });

      composer.draftCompositionMiddlewareExecutor.insert({
        middleware: [createDraftCommandInjectionMiddleware(composer)],
        position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
      });

      composer.textComposer.middlewareExecutor.insert({
        middleware: [createActiveCommandGuardMiddleware() as TextComposerMiddleware],
        position: { before: 'stream-io/text-composer/commands-middleware' },
      });

      composer.textComposer.middlewareExecutor.insert({
        middleware: [createCommandStringExtractionMiddleware() as TextComposerMiddleware],
        position: { after: 'stream-io/text-composer/commands-middleware' },
      });

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
    <TempCtx.Provider value={tempCtxValue}>
      <WithComponents
        overrides={{
          emojiSearchIndex: SearchIndex,
          EmojiPicker,
          ReactionsList: CustomMessageReactions,
        }}
      >
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
              <Channel>
                <Window>
                  <div style={{ display: 'flex', gap: 10, padding: 10 }}>
                    <button
                      onClick={() =>
                        setTempCtxValue((prev) => ({
                          ...prev,
                          visualStyle:
                            prev.visualStyle === 'clustered' ? 'segmented' : 'clustered',
                        }))
                      }
                    >
                      Toggle Visual Style
                    </button>
                    <button
                      onClick={() =>
                        setTempCtxValue((prev) => ({
                          ...prev,
                          verticalPosition:
                            prev.verticalPosition === 'top' ? 'bottom' : 'top',
                        }))
                      }
                    >
                      Toggle Vertical Position
                    </button>
                    <button
                      onClick={() =>
                        setTempCtxValue((prev) => ({
                          ...prev,
                          flipHorizontalPosition: !prev.flipHorizontalPosition,
                        }))
                      }
                    >
                      Toggle Horizontal Position
                    </button>
                  </div>
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
      </WithComponents>
    </TempCtx.Provider>
  );
};

export default App;
