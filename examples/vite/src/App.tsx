import { useCallback, useEffect, useMemo } from 'react';
import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
  TextComposerMiddleware,
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
  ReactionsList,
  WithDragAndDropUpload,
  useChatContext,
} from 'stream-chat-react';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';
import { humanId } from 'human-id';
import { chatViewSelectorItemSet } from './Sidebar/ChatViewSelectorItemSet.tsx';
import { useAppSettingsState } from './AppSettings';

init({ data });

const parseUserIdFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Token is missing');

  return JSON.parse(atob(payload))?.user_id;
};

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const token =
  new URLSearchParams(window.location.search).get('token') ||
  import.meta.env.VITE_USER_TOKEN;

if (!apiKey) {
  throw new Error('VITE_STREAM_API_KEY is not defined');
}

const options: ChannelOptions = {
  // limit: 10,
  // message_limit: 10,
  // member_limit: 10,
  presence: true,
  state: true,
};
// pinned_at param leads to BE not returning (empty) channels
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

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
    return token && userId === parseUserIdFromToken(token)
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
  const { reactions } = useAppSettingsState();
  const { visualStyle, verticalPosition, flipHorizontalPosition } = reactions;

  return (
    <ReactionsList
      {...props}
      flipHorizontalPosition={flipHorizontalPosition}
      verticalPosition={verticalPosition}
      visualStyle={visualStyle}
    />
  );
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
      $or: [
        {
          members: { $in: [userId] },
        },
        { type: 'public' },
      ],
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
    <WithComponents
      overrides={{
        emojiSearchIndex: SearchIndex,
        EmojiPicker,
        ReactionsList: CustomMessageReactions,
      }}
    >
      <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
        <ChatView>
          <ChatView.Selector itemSet={chatViewSelectorItemSet} />
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
              <WithDragAndDropUpload>
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
                  <ChannelExposer />
                </Window>
              </WithDragAndDropUpload>
              <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
                <Thread virtualized />
              </WithDragAndDropUpload>
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
  );
};

const ChannelExposer = () => {
  const { channel, client } = useChatContext();
  // @ts-expect-error expose client and channel for debugging purposes
  window.client = client;
  // @ts-expect-error expose client and channel for debugging purposes
  window.channel = channel;
  return null;
};

export default App;
