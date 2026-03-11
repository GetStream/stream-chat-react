import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  type ChatView as ChatViewType,
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
  useChatViewContext,
  defaultReactionOptions,
  ReactionOptions,
  mapEmojiMartData,
} from 'stream-chat-react';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data/sets/14/native.json';
import { humanId } from 'human-id';
import { chatViewSelectorItemSet } from './Sidebar/ChatViewSelectorItemSet.tsx';
import { useAppSettingsState } from './AppSettings';

import { Search } from 'stream-chat-react/experimental';

init({ data });

const parseUserIdFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Token is missing');

  return JSON.parse(atob(payload))?.user_id;
};

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const selectedChannelUrlParam = 'channel';
const selectedChatViewUrlParam = 'view';
const token =
  new URLSearchParams(window.location.search).get('token') ||
  import.meta.env.VITE_USER_TOKEN;

const getSelectedChannelIdFromUrl = () =>
  new URLSearchParams(window.location.search).get(selectedChannelUrlParam);

const getSelectedChatViewFromUrl = (): ChatViewType | undefined => {
  const selectedChatView = new URLSearchParams(window.location.search).get(
    selectedChatViewUrlParam,
  );

  if (selectedChatView === 'threads') return 'threads';
  if (selectedChatView === 'channels' || selectedChatView === 'chat') return 'channels';

  return undefined;
};

const updateSelectedChannelIdInUrl = (channelId?: string) => {
  const url = new URL(window.location.href);

  if (channelId) {
    url.searchParams.set(selectedChannelUrlParam, channelId);
  } else {
    url.searchParams.delete(selectedChannelUrlParam);
  }

  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

const updateSelectedChatViewInUrl = (chatView: ChatViewType) => {
  const url = new URL(window.location.href);

  url.searchParams.set(
    selectedChatViewUrlParam,
    chatView === 'threads' ? 'threads' : 'chat',
  );

  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

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

const newReactionOptions: ReactionOptions = {
  ...defaultReactionOptions,
  extended: mapEmojiMartData(data),
};

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
  const { chatView } = useAppSettingsState();
  const initialChannelId = useMemo(() => getSelectedChannelIdFromUrl(), []);
  const initialChatView = useMemo(() => getSelectedChatViewFromUrl(), []);

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
        reactionOptions: newReactionOptions,
      }}
    >
      <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
        <ChatView>
          <ChatStateSync initialChatView={initialChatView} />
          <ChatView.Selector
            itemSet={chatViewSelectorItemSet}
            iconOnly={chatView.iconOnly}
          />
          <ChatView.Channels>
            <ChannelList
              ChannelSearch={Search}
              Avatar={ChannelAvatar}
              customActiveChannel={initialChannelId ?? undefined}
              filters={filters}
              options={options}
              sort={sort}
              showChannelSearch
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

const ChatStateSync = ({ initialChatView }: { initialChatView?: ChatViewType }) => {
  const { activeChatView, setActiveChatView } = useChatViewContext();
  const { channel, client } = useChatContext();
  const previousSyncedChatView = useRef<ChatViewType | undefined>(undefined);
  const previousChannelId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      initialChatView &&
      previousSyncedChatView.current === undefined &&
      activeChatView !== initialChatView
    ) {
      setActiveChatView(initialChatView);
      return;
    }

    if (previousSyncedChatView.current === activeChatView) return;

    previousSyncedChatView.current = activeChatView;
    updateSelectedChatViewInUrl(activeChatView);
  }, [activeChatView, initialChatView, setActiveChatView]);

  useEffect(() => {
    if (channel?.id) {
      previousChannelId.current = channel.id;
      updateSelectedChannelIdInUrl(channel.id);
      return;
    }

    if (!previousChannelId.current) return;

    previousChannelId.current = undefined;
    updateSelectedChannelIdInUrl();
  }, [channel?.id]);

  // @ts-expect-error expose client and channel for debugging purposes
  window.client = client;
  // @ts-expect-error expose client and channel for debugging purposes
  window.channel = channel;
  return null;
};

export default App;
