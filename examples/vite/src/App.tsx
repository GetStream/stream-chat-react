import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ChannelFilters,
  ChannelSort,
  LocalMessage,
  TextComposerMiddleware,
} from 'stream-chat';
import {
  ChannelPaginator,
  ChannelPaginatorsOrchestrator,
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
import {
  CHANNEL_THREAD_SLOT,
  DESKTOP_LAYOUT_BREAKPOINT,
  MAIN_CHANNEL_SLOT,
  MAIN_THREAD_SLOT,
  OPTIONAL_THREAD_SLOT,
} from './ChatLayout/constants.ts';
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
import {
  resolveSingleChannel,
  SingleChannelModal,
} from './SingleChannel/SingleChannelApp.tsx';
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

// Per-view layout descriptors (D8): each view declares its own slot topology. Module-scoped
// so the reference is stable (it feeds the ChatView layout controller). The channels view
// holds the open channel plus a reply-thread slot (the in-channel Thread panel); the threads
// view holds a primary + an optional (ctrl/⌘-click) thread slot.
const chatViewLayouts = [
  { id: 'channels' as const, slots: [MAIN_CHANNEL_SLOT, CHANNEL_THREAD_SLOT] },
  { id: 'threads' as const, slots: [MAIN_THREAD_SLOT, OPTIONAL_THREAD_SLOT] },
];

const CustomAttachmentWithActions = (props: AttachmentProps) => (
  <Attachment {...props} AttachmentActions={CustomAttachmentActions} />
);

const App = () => {
  const { tokenProvider, userId, userImage, userName } = useUser();
  const chatView = useAppSettingsSelector((state) => state.chatView);
  // Project to a stable-shape object rather than returning `state.layout` directly. `layout`
  // starts as `{}`, and useStateStore only diffs the keys present in its *cached* selection — so
  // a selection that starts empty never notices `channelCid` appearing later, and the modal would
  // never mount on a layout-only change. Always exposing the `channelCid` key fixes that.
  const { channelCid: singleChannelCid } = useAppSettingsSelector((state) => ({
    channelCid: state.layout.channelCid,
  }));
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

    return !((!channelsView && hasSelectedThread) || hasSelectedThread);
  }, [
    initialChannelId,
    initialChatView,
    initialPanelLayout.leftPanel.collapsed,
    initialThreadId,
  ]);
  const appLayoutRef = useRef<HTMLDivElement | null>(null);
  // Anchor for the floating single-channel modal. A small fixed point (state, not ref, so the
  // modal re-renders once it attaches) at the top-left corner — the DraggableDialog anchors
  // `right-start` to it, so the modal opens at 8px/8px before it's dragged.
  const [singleChannelAnchor, setSingleChannelAnchor] = useState<HTMLElement | null>(
    null,
  );

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

  // Four channel lists driven by one orchestrator:
  //  - `channels:default` (main): the app `filters`, minus archived and muted channels.
  //  - `channels:archived`: the user's archived channels.
  //  - `channels:muted`: the user's muted channels.
  //  - `channels:opened` (fallback): empty filter, seeded empty so it never auto-queries — holds
  //    channels opened from search that don't match any of the above.
  // The priority ownership resolver decides where a channel that matches several lists lands
  // (archived > muted > default > opened), so e.g. an archived channel stays out of the main list.
  // `orchestrator.ingestChannel` (search/DM open, and the mute handler below) re-evaluates a
  // channel against every list and routes it accordingly.
  const channelPaginatorsOrchestrator = useMemo(() => {
    if (!chatClient) return undefined;
    const main = new ChannelPaginator({
      client: chatClient,
      filters: { ...filters, archived: false, muted: false },
      id: 'channels:default',
      sort,
    });
    const archived = new ChannelPaginator({
      client: chatClient,
      filters: { ...filters, archived: true },
      id: 'channels:archived',
      sort,
    });
    const muted = new ChannelPaginator({
      client: chatClient,
      filters: { ...filters, muted: true },
      id: 'channels:muted',
      sort,
    });
    const fallback = new ChannelPaginator({
      client: chatClient,
      filters: {},
      id: 'channels:opened',
    });
    // Seed an empty loaded page so the catch-all list doesn't auto-query on mount.
    fallback.setItems({ isLastPage: true, valueOrFactory: [] });

    // The orchestrator has no built-in mute handler, so muting/unmuting wouldn't move a channel
    // between lists on its own. Enrich the default handlers: when the user's channel mutes change,
    // re-route every loaded channel (ingestChannel re-evaluates ownership per channel, so a newly
    // muted channel leaves the main list for the muted one and an unmuted channel returns).
    const eventHandlers = ChannelPaginatorsOrchestrator.getDefaultHandlers();
    eventHandlers['notification.channel_mutes_updated'] = [
      {
        id: 'example:channel-mutes-updated',
        handle: ({ ctx: { orchestrator } }) => {
          const seen = new Set<string>();
          orchestrator.paginators.forEach((paginator) => {
            (paginator.items ?? []).forEach((channel) => {
              if (seen.has(channel.cid)) return;
              seen.add(channel.cid);
              orchestrator.ingestChannel(channel);
            });
          });
        },
      },
    ];

    return new ChannelPaginatorsOrchestrator({
      client: chatClient,
      eventHandlers,
      ownershipResolver: [
        'channels:archived',
        'channels:muted',
        'channels:default',
        'channels:opened',
      ],
      paginators: [main, archived, muted, fallback],
    });
  }, [chatClient, filters]);

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
        '--app-secondary-panel-width': `${initialPanelLayout.threadPanel.width}px`,
      }) as CSSProperties,
    [initialPanelLayout.leftPanel.width, initialPanelLayout.threadPanel.width],
  );

  // Memoized so the ChatView `views` map keeps a stable reference across renders.
  const chatViews = useMemo(
    () => ({
      channels: (
        <ChannelsPanels
          iconOnly={chatView.iconOnly}
          initialChannelId={initialChannelId ?? undefined}
          itemSet={chatViewSelectorItemSet}
        />
      ),
      threads: (
        <ThreadsPanels iconOnly={chatView.iconOnly} itemSet={chatViewSelectorItemSet} />
      ),
    }),
    [chatView.iconOnly, initialChannelId],
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
        ...messageUiOverrides,
      }}
    >
      <SidebarProvider initialOpen={initialSidebarOpen}>
        <Chat
          channelPaginatorsOrchestrator={channelPaginatorsOrchestrator}
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
              <ChatView
                dialogManagerId={globalDialogManager}
                layouts={chatViewLayouts}
                maxSlots={2}
                minSlots={2}
                views={chatViews}
              >
                <ChatStateSync initialChatView={initialChatView} />
                <SidebarLayoutSync />
              </ChatView>
            </div>
          </div>
          {/* The single-channel scenario floats over the full app in a draggable modal (the full
              app stays mounted, so its dialog managers never remount). Open whenever a channel is
              selected (`layout.channelCid`); the title switches channels, the close button clears
              it. The anchor fixes the initial position (20,20). It's rendered unconditionally so
              its ref is populated before the modal ever mounts — otherwise the first open would
              pass `referenceElement={null}` (the ref callback fires after that render), and the
              DialogAnchor wouldn't position/show the dialog until some later re-render. */}
          <span
            aria-hidden
            ref={setSingleChannelAnchor}
            style={{
              height: 0,
              insetBlockStart: '20px',
              insetInlineStart: '20px',
              pointerEvents: 'none',
              position: 'fixed',
              width: 0,
            }}
          />
          {singleChannelCid && (
            <SingleChannelModal
              channel={resolveSingleChannel({
                channelKey: singleChannelCid,
                client: chatClient,
                orchestrator: channelPaginatorsOrchestrator,
              })}
              referenceElement={singleChannelAnchor}
            />
          )}
        </Chat>
      </SidebarProvider>
    </WithComponents>
  );
};

export default App;
