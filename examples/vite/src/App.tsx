import { type CSSProperties, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
  TextComposerMiddleware,
  SearchController,
  ChannelSearchSource,
  UserSearchSource,
  createActiveCommandGuardMiddleware,
  createCommandInjectionMiddleware,
  createCommandStringExtractionMiddleware,
  createDraftCommandInjectionMiddleware,
} from 'stream-chat';
import {
  Attachment,
  type AttachmentProps,
  Chat,
  ChatView,
  ReactionsList,
  MessageInput,
  type NotificationListProps,
  NotificationList,
  Streami18n,
  WithComponents,
  defaultReactionOptions,
  type ReactionOptions,
  mapEmojiMartData,
  useCreateChatClient,
  Search,
} from 'stream-chat-react';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data/sets/14/native.json';
import { humanId } from 'human-id';

import { appSettingsStore, useAppSettingsSelector } from './AppSettings/state.ts';
import { DESKTOP_LAYOUT_BREAKPOINT } from './ChatLayout/constants.ts';
import { ChannelsPanels, ThreadsPanels } from './ChatLayout/Panels.tsx';
import {
  ChatViewSelectorWidthSync,
  PanelLayoutStyleSync,
  SidebarLayoutSync,
} from './ChatLayout/Resize.tsx';
import {
  ChatStateSync,
  getSelectedChannelIdFromUrl,
  getSelectedChatViewFromUrl,
} from './ChatLayout/Sync.tsx';
import { chatViewSelectorItemSet } from './Sidebar/ChatViewSelectorItemSet.tsx';
import {
  CustomAttachmentActions,
  CustomSystemMessage,
  SegmentedReactionsList,
  customReactionOptions,
  customReactionOptionsUpvote,
  getAttachmentActionsVariant,
  getMessageUiComponent,
  getMessageUiVariant,
  getReactionsVariant,
  getSystemMessageVariant,
} from './CustomMessageUi/index.tsx';

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
  presence: true,
  state: true,
};

const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

// @ts-ignore
const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

const newReactionOptions: ReactionOptions = {
  ...defaultReactionOptions,
  extended: mapEmojiMartData(data),
};

const useUser = () => {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const userId = useMemo(() => {
    return (
      searchParams.get('user_id') ||
      import.meta.env.VITE_USER_ID ||
      localStorage.getItem('user_id') ||
      humanId({ separator: '_', capitalize: false })
    );
  }, []);

  const userImage = useMemo(() => searchParams.get('user_image') || undefined, []);
  const userName = useMemo(() => searchParams.get('user_name') || undefined, []);

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

  return { tokenProvider, userId, userImage, userName };
};

const CustomMessageReactions = (props: React.ComponentProps<typeof ReactionsList>) => {
  const { visualStyle, verticalPosition, flipHorizontalPosition } =
    useAppSettingsSelector((state) => state.reactions);

  return (
    <ReactionsList
      {...props}
      flipHorizontalPosition={flipHorizontalPosition}
      verticalPosition={verticalPosition}
      visualStyle={visualStyle}
    />
  );
};

const CustomChannelSearch = () => <Search exitSearchOnInputBlur />;

const EmojiPickerWithCustomOptions = (
  props: React.ComponentProps<typeof EmojiPicker>,
) => {
  const { mode } = useAppSettingsSelector((state) => state.theme);

  return <EmojiPicker {...props} pickerProps={{ theme: mode }} />;
};

const ConfigurableNotificationList = (props: NotificationListProps) => {
  const { verticalAlignment } = useAppSettingsSelector((state) => state.notifications);

  return <NotificationList {...props} verticalAlignment={verticalAlignment} />;
};

const language = new URLSearchParams(window.location.search).get('language');
const i18nInstance = language ? new Streami18n({ language: language as any }) : undefined;

const messageUiVariant = getMessageUiVariant();
const MessageUiOverride = messageUiVariant
  ? getMessageUiComponent(messageUiVariant)
  : null;
const systemMessageVariant = getSystemMessageVariant();
const reactionsVariant = getReactionsVariant();
const attachmentActionsVariant = getAttachmentActionsVariant();

const CustomAttachmentWithActions = (props: AttachmentProps) => (
  <Attachment {...props} AttachmentActions={CustomAttachmentActions} />
);

const App = () => {
  const { tokenProvider, userId, userImage, userName } = useUser();
  const chatView = useAppSettingsSelector((state) => state.chatView);
  const { mode: themeMode } = useAppSettingsSelector((state) => state.theme);
  const initialChannelId = useMemo(() => getSelectedChannelIdFromUrl(), []);
  const initialChatView = useMemo(() => getSelectedChatViewFromUrl(), []);
  const initialPanelLayout = useMemo(
    () => appSettingsStore.getLatestValue().panelLayout,
    [],
  );
  const initialNavOpen = useMemo(
    () =>
      typeof window !== 'undefined' && window.innerWidth < DESKTOP_LAYOUT_BREAKPOINT
        ? true
        : !initialPanelLayout.leftPanel.collapsed,
    [initialPanelLayout.leftPanel.collapsed],
  );
  const appLayoutRef = useRef<HTMLDivElement | null>(null);

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: {
      id: userId,
      ...(userImage && { image: userImage }),
      ...(userName && { name: userName }),
    },
  });
  const searchController = useMemo(() => {
    if (!chatClient) return undefined;

    return new SearchController({
      sources: [
        new ChannelSearchSource(chatClient, undefined, {
          initialFilterConfig: {
            $or: {
              enabled: true,
              generate: () => ({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $or: [{ members: { $in: [chatClient.userID!] } }, { type: 'public' }],
                members: undefined,
              }),
            },
          },
        }),
        new UserSearchSource(chatClient),
      ],
    });
  }, [chatClient]);

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

  const chatTheme = themeMode === 'dark' ? 'str-chat__theme-dark' : 'messaging light';
  const initialAppLayoutStyle = useMemo(
    () =>
      ({
        '--app-left-panel-width': `${initialPanelLayout.leftPanel.width}px`,
        '--app-thread-panel-width': `${initialPanelLayout.threadPanel.width}px`,
      }) as CSSProperties,
    [initialPanelLayout.leftPanel.width, initialPanelLayout.threadPanel.width],
  );

  if (!chatClient) return <>Loading...</>;

  const messageUiOverrides: Record<string, unknown> = {};
  if (MessageUiOverride) {
    messageUiOverrides.Message = MessageUiOverride;
  }
  if (messageUiVariant === '8') {
    messageUiOverrides.reactionOptions = customReactionOptions;
  }
  if (systemMessageVariant === 'custom') {
    messageUiOverrides.MessageSystem = CustomSystemMessage;
  }
  if (reactionsVariant === 'custom-options') {
    messageUiOverrides.reactionOptions = customReactionOptionsUpvote;
  }
  if (reactionsVariant === 'segmented') {
    messageUiOverrides.ReactionsList = SegmentedReactionsList;
  }
  if (attachmentActionsVariant === 'custom') {
    messageUiOverrides.Attachment = CustomAttachmentWithActions;
  }

  return (
    <WithComponents
      overrides={{
        emojiSearchIndex: SearchIndex,
        EmojiPicker: EmojiPickerWithCustomOptions,
        MessageListNotifications: ConfigurableNotificationList,
        NotificationList: ConfigurableNotificationList,
        ReactionsList: CustomMessageReactions,
        reactionOptions: newReactionOptions,
        Search: CustomChannelSearch,
        ...messageUiOverrides,
      }}
    >
      <Chat
        searchController={searchController}
        client={chatClient}
        i18nInstance={i18nInstance}
        initialNavOpen={initialNavOpen}
        isMessageAIGenerated={isMessageAIGenerated}
        theme={chatTheme}
      >
        <div
          className='app-chat-layout'
          ref={appLayoutRef}
          style={initialAppLayoutStyle}
          data-variant={messageUiVariant ?? undefined}
        >
          <PanelLayoutStyleSync layoutRef={appLayoutRef} />
          <ChatViewSelectorWidthSync
            iconOnly={chatView.iconOnly}
            layoutRef={appLayoutRef}
          />
          <ChatView>
            <ChatStateSync initialChatView={initialChatView} />
            <SidebarLayoutSync />
            <ChatView.Selector
              itemSet={chatViewSelectorItemSet}
              iconOnly={chatView.iconOnly}
            />
            <ChannelsPanels
              filters={filters}
              initialChannelId={initialChannelId ?? undefined}
              options={options}
              sort={sort}
            />
            <ThreadsPanels />
          </ChatView>
        </div>
      </Chat>
    </WithComponents>
  );
};

export default App;
