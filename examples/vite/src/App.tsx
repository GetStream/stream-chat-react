import { type CSSProperties, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
  MessageComposer,
  TextComposerMiddleware,
} from 'stream-chat';
import {
  ChannelSearchSource,
  createActiveCommandGuardMiddleware,
  createAttachmentsCompositionMiddleware,
  createCommandInjectionMiddleware,
  createCommandStringExtractionMiddleware,
  createDraftCommandInjectionMiddleware,
  createSendWithPendingUploadsAttachmentsMiddleware,
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
import { InlineEditableMessage } from './InlineEditMessage';
import { SidebarToggle } from './Sidebar/SidebarToggle.tsx';
import { CommandModeAttachmentSelector } from './CommandModeAttachmentSelector.tsx';
import { StreamDebugHandles } from './Debug';
import { installUploadHarness } from './SendWhilePendingUploads';

const PUBLIC_VITE_EXAMPLE_API_KEY = 'xzwhhgtazy6h';

init({ data });

const parseUserIdFromToken = (token: string): string | undefined => {
  try {
    const [, payload] = token.split('.');

    if (!payload) return undefined;

    return JSON.parse(atob(payload))?.user_id;
  } catch {
    return undefined;
  }
};

const apiKey =
  new URLSearchParams(window.location.search).get('api_key') ||
  import.meta.env.VITE_STREAM_API_KEY;
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
      (token ? parseUserIdFromToken(token) : undefined) ||
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

/**
 * Swaps the composition middleware that decides whether a message may be composed while its
 * attachments are still uploading. Installing it is the whole switch: `MessageComposer` reads
 * `allowsPendingUploads` off the installed middleware for sendability, and `Channel`'s send path
 * reads the same flag to serialise sends and await the uploads.
 *
 * Both middleware share an id, so `replace` keeps the position in the chain either way.
 */
const applyPendingUploadsMiddleware = (composer: MessageComposer, enabled: boolean) => {
  composer.compositionMiddlewareExecutor.replace([
    enabled
      ? createSendWithPendingUploadsAttachmentsMiddleware(composer)
      : createAttachmentsCompositionMiddleware(composer),
  ]);
};

const App = () => {
  const { tokenProvider, userId, userImage, userName } = useUser();
  const chatView = useAppSettingsSelector((state) => state.chatView);
  const { failUploads, sendMessagesWithPendingUploads, slowUploads } =
    useAppSettingsSelector((state) => state.composer);
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
      applyPendingUploadsMiddleware(composer, sendMessagesWithPendingUploads);

      // Dev-only: stretch uploads so the in-flight and confirmation-pending windows are
      // observable, and/or make them fail so the failed-message and retry paths are reachable.
      // Independent of sendMessagesWithPendingUploads — both are just as useful for watching the
      // default blocked behaviour.
      //
      // Settings are read on every upload rather than captured here, so changing them in
      // Settings → Composer takes effect without re-running setup — which matters because a
      // custom doUploadRequest cannot be un-set once installed.
      if (slowUploads || failUploads !== 'off') {
        installUploadHarness(composer, () => {
          const {
            failUploads: failureMode,
            slowUploadMs,
            slowUploads: slowArmed,
          } = appSettingsStore.getLatestValue().composer;

          return { delayMs: slowArmed ? slowUploadMs : 0, failureMode };
        });
      }

      // todo: find a way to register multiple setup functions so that the SDK can have own setup independent from the integrator setup
      composer.compositionMiddlewareExecutor.insert({
        middleware: [createCommandInjectionMiddleware(composer)],
        position: { after: 'stream-io/message-composer-middleware/attachments' },
        unique: true,
      });

      // `unique: true` on the inserts below matters now that this setup function re-runs
      // whenever the Composer setting changes — without it each toggle would append another
      // copy of the same middleware.
      composer.draftCompositionMiddlewareExecutor.insert({
        middleware: [createDraftCommandInjectionMiddleware(composer)],
        position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
        unique: true,
      });

      composer.textComposer.middlewareExecutor.insert({
        middleware: [createActiveCommandGuardMiddleware() as TextComposerMiddleware],
        position: { before: 'stream-io/text-composer/commands-middleware' },
        unique: true,
      });

      composer.textComposer.middlewareExecutor.insert({
        middleware: [createCommandStringExtractionMiddleware() as TextComposerMiddleware],
        position: { after: 'stream-io/text-composer/commands-middleware' },
        unique: true,
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

    // The setup function only runs when a composer is created, so composers the user already
    // has open have to be updated too - otherwise the switch would need a reload to be seen.
    Object.values(chatClient.activeChannels).forEach((channel) => {
      applyPendingUploadsMiddleware(
        channel.messageComposer,
        sendMessagesWithPendingUploads,
      );
    });
    chatClient.threads.state
      .getLatestValue()
      .threads.forEach((thread) =>
        applyPendingUploadsMiddleware(
          thread.messageComposer,
          sendMessagesWithPendingUploads,
        ),
      );
  }, [chatClient, failUploads, sendMessagesWithPendingUploads, slowUploads]);

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
        Message: InlineEditableMessage,
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
          {/* Publishes window.streamDebug — see src/Debug/StreamDebugHandles.tsx */}
          <StreamDebugHandles />
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
