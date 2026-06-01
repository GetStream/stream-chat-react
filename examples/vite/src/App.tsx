import { type CSSProperties, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
  TextComposerMiddleware,
} from 'stream-chat';
import {
  ChannelSearchSource,
  createActiveCommandGuardMiddleware,
  createCommandInjectionMiddleware,
  createCommandStringExtractionMiddleware,
  createDraftCommandInjectionMiddleware,
  SearchController,
  UserSearchSource,
} from 'stream-chat';
import {
  Attachment,
  type AttachmentProps,
  Chat,
  ChatView,
  defaultReactionOptions,
  DialogManagerProvider,
  mapEmojiMartData,
  MessageReactions,
  NotificationList,
  type NotificationListProps,
  type ReactionOptions,
  Search,
  Streami18n,
  useCreateChatClient,
  WithComponents,
} from 'stream-chat-react';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data/sets/14/native.json';
import { humanId } from 'human-id';

import { appSettingsStore, useAppSettingsSelector } from './AppSettings';
import { DESKTOP_LAYOUT_BREAKPOINT } from './ChatLayout/constants.ts';
import { ChatSkipNavigation } from './AccessibilityNavigation/ChatSkipNavigation.tsx';
import { ChannelsPanels, ThreadsPanels } from './ChatLayout/Panels.tsx';
import { SidebarProvider } from './ChatLayout/SidebarContext.tsx';
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
import { LoadingScreen } from './LoadingScreen/LoadingScreen.tsx';
import { SystemNotification } from './SystemNotification/SystemNotification.tsx';
import { chatViewSelectorItemSet } from './Sidebar/ChatViewSelectorItemSet.tsx';
import {
  CustomAttachmentActions,
  customReactionOptions,
  customReactionOptionsUpvote,
  CustomSystemMessage,
  getAttachmentActionsVariant,
  getMessageUiComponent,
  getMessageUiVariant,
  getReactionsVariant,
  getSystemMessageVariant,
  SegmentedReactionsList,
} from './CustomMessageUi';
import { ConfigurableMessageActions } from './CustomMessageActions';
import { SidebarToggle } from './Sidebar/SidebarToggle.tsx';
import { CommandModeAttachmentSelector } from './CommandModeAttachmentSelector.tsx';

const PUBLIC_VITE_EXAMPLE_API_KEY = 'xzwhhgtazy6h';

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
  limit: 10,
};

const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

// @ts-expect-error ai_generated isn't on LocalMessage's public type yet
const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

const newReactionOptions: ReactionOptions = {
  ...defaultReactionOptions,
  extended: mapEmojiMartData(data),
};

const useUser = () => {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);

  const userId = useMemo(
    () =>
      searchParams.get('user_id') ||
      import.meta.env.VITE_USER_ID ||
      localStorage.getItem('user_id') ||
      humanId({ separator: '_', capitalize: false }),
    [searchParams],
  );

  const userImage = useMemo(
    () => searchParams.get('user_image') || undefined,
    [searchParams],
  );
  const userName = useMemo(
    () => searchParams.get('user_name') || undefined,
    [searchParams],
  );

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');

    if (userId && storedUserId === userId) return;

    localStorage.setItem('user_id', userId);
  }, [userId]);

  const environment =
    apiKey === PUBLIC_VITE_EXAMPLE_API_KEY
      ? 'public-shared-chat-redesign'
      : 'shared-chat-redesign';

  const tokenProvider = useCallback(() => {
    if (token && userId === parseUserIdFromToken(token)) {
      return Promise.resolve(token);
    }
    const url = new URL('https://pronto.getstream.io/api/auth/create-token');
    url.searchParams.set('environment', environment);
    url.searchParams.set('user_id', userId);
    return fetch(url.toString())
      .then((response) => response.json())
      .then((data) => data.token as string);
  }, [environment, userId]);

  return { tokenProvider, userId, userImage, userName };
};

const CustomMessageReactions = (props: React.ComponentProps<typeof MessageReactions>) => {
  const { flipHorizontalPosition, verticalPosition, visualStyle } =
    useAppSettingsSelector((state) => state.reactions);

  return (
    <MessageReactions
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

  return (
    <EmojiPicker
      {...props}
      pickerProps={{
        ...props.pickerProps,
        theme: mode,
      }}
    />
  );
};

const ConfigurableNotificationList = (props: NotificationListProps) => {
  const { verticalAlignment } = useAppSettingsSelector((state) => state.notifications);

  return <NotificationList {...props} verticalAlignment={verticalAlignment} />;
};

const language = new URLSearchParams(window.location.search).get('language');
const i18nInstance = language
  ? new Streami18n({
      language: language as NonNullable<
        ConstructorParameters<typeof Streami18n>[0]
      >['language'],
    })
  : undefined;

const messageUiVariant = getMessageUiVariant();
const MessageUiOverride = messageUiVariant
  ? getMessageUiComponent(messageUiVariant)
  : null;
const systemMessageVariant = getSystemMessageVariant();
const reactionsVariant = getReactionsVariant();
const attachmentActionsVariant = getAttachmentActionsVariant();
const globalDialogManager = 'globalDialogManager';

const CustomAttachmentWithActions = (props: AttachmentProps) => (
  <Attachment {...props} AttachmentActions={CustomAttachmentActions} />
);

const App = () => {
  const { tokenProvider, userId, userImage, userName } = useUser();
  const chatView = useAppSettingsSelector((state) => state.chatView);
  const { mode: themeMode } = useAppSettingsSelector((state) => state.theme);
  const initialSearchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const initialChannelId = useMemo(() => getSelectedChannelIdFromUrl(), []);
  const initialChatView = useMemo(() => getSelectedChatViewFromUrl(), []);
  const initialThreadId = useMemo(
    () => initialSearchParams.get('thread'),
    [initialSearchParams],
  );
  const initialPanelLayout = useMemo(
    () => appSettingsStore.getLatestValue().panelLayout,
    [],
  );
  const initialSidebarOpen = useMemo(() => {
    if (typeof window === 'undefined') return !initialPanelLayout.leftPanel.collapsed;

    const isMobile = window.innerWidth < DESKTOP_LAYOUT_BREAKPOINT;

    if (!isMobile) return !initialPanelLayout.leftPanel.collapsed;

    const hasSelectedChannel = Boolean(initialChannelId);
    const hasSelectedThread = Boolean(initialThreadId);
    const channelsView = initialChatView !== 'threads';

    // Keep sidebar open on mobile when a channel is preselected via URL.
    // It will auto-collapse later once the selected channel is actually resolved.
    if (channelsView && hasSelectedChannel) {
      return true;
    }

    if ((!channelsView && hasSelectedThread) || hasSelectedThread) {
      return false;
    }

    return true;
  }, [
    initialChannelId,
    initialChatView,
    initialPanelLayout.leftPanel.collapsed,
    initialThreadId,
  ]);
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
        // public example channels
        {
          $and: [
            {
              cid: {
                $in: ['random', 'general', 'music', 'jokes'].map(
                  (channelId) => `messaging:${channelId}`,
                ),
              },
            },
            {
              members: { $in: [userId] },
            },
          ],
        },
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

  if (!chatClient) {
    return (
      <LoadingScreen
        initialAppLayoutStyle={initialAppLayoutStyle}
        initialChannelSelected={Boolean(initialChannelId)}
        initialSidebarOpen={initialSidebarOpen}
      />
    );
  }

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
        NotificationList: ConfigurableNotificationList,
        MessageReactions: CustomMessageReactions,
        reactionOptions: newReactionOptions,
        Search: CustomChannelSearch,
        HeaderEndContent: SidebarToggle,
        HeaderStartContent: SidebarToggle,
        MessageActions: ConfigurableMessageActions,
        AttachmentSelector: CommandModeAttachmentSelector,
        ...messageUiOverrides,
      }}
    >
      <SidebarProvider initialOpen={initialSidebarOpen}>
        <Chat
          client={chatClient}
          i18nInstance={i18nInstance}
          isMessageAIGenerated={isMessageAIGenerated}
          searchController={searchController}
          theme={chatTheme}
        >
          <ChatSkipNavigation />
          <div
            className='app-chat-layout'
            data-variant={messageUiVariant ?? undefined}
            ref={appLayoutRef}
            style={initialAppLayoutStyle}
          >
            <SystemNotification />
            <div className='app-chat-layout__body'>
              <PanelLayoutStyleSync layoutRef={appLayoutRef} />
              <ChatViewSelectorWidthSync
                iconOnly={chatView.iconOnly}
                layoutRef={appLayoutRef}
              />
              <ChatView>
                <DialogManagerProvider id={globalDialogManager}>
                  <ChatStateSync initialChatView={initialChatView} />
                  <SidebarLayoutSync />
                  <ChannelsPanels
                    filters={filters}
                    iconOnly={chatView.iconOnly}
                    initialChannelId={initialChannelId ?? undefined}
                    itemSet={chatViewSelectorItemSet}
                    options={options}
                    sort={sort}
                  />
                  <ThreadsPanels
                    iconOnly={chatView.iconOnly}
                    itemSet={chatViewSelectorItemSet}
                  />
                </DialogManagerProvider>
              </ChatView>
            </div>
          </div>
        </Chat>
      </SidebarProvider>
    </WithComponents>
  );
};

export default App;
