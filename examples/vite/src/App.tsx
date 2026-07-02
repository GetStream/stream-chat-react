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

const PUBLIC_VITE_EXAMPLE_API_KEY = 'xzwhhgtazy6h';

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

// A few extra reactions, built from emoji-mart-shaped data via `mapEmojiMartData`.
const extendedReactionData = {
  emojis: {
    clap: { name: 'Clapping Hands', skins: [{ native: '👏' }] },
    eyes: { name: 'Eyes', skins: [{ native: '👀' }] },
    hundred: { name: 'Hundred Points', skins: [{ native: '💯' }] },
    pray: { name: 'Folded Hands', skins: [{ native: '🙏' }] },
    rocket: { name: 'Rocket', skins: [{ native: '🚀' }] },
    tada: { name: 'Party Popper', skins: [{ native: '🎉' }] },
  },
};

const newReactionOptions: ReactionOptions = {
  ...defaultReactionOptions,
  extended: mapEmojiMartData(extendedReactionData),
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

// Demonstrates integrator-owned persistence of the picker's skin tone and
// frequently-used emoji via localStorage. The SDK itself never touches storage —
// it exposes these as controlled props so apps own where the state lives.
const EMOJI_SKIN_TONE_KEY = 'vite-example/emoji-skin-tone';
const EMOJI_FREQUENTLY_USED_KEY = 'vite-example/emoji-frequently-used';

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
};

const EmojiPickerWithCustomOptions = (
  props: React.ComponentProps<typeof EmojiPicker>,
) => {
  const { mode } = useAppSettingsSelector((state) => state.theme);
  const [skinTone, setSkinTone] = useState(() => readStored(EMOJI_SKIN_TONE_KEY, 0));
  const [frequentlyUsedEmoji, setFrequentlyUsedEmoji] = useState(() =>
    readStored<string[]>(EMOJI_FREQUENTLY_USED_KEY, []),
  );

  return (
    <EmojiPicker
      {...props}
      frequentlyUsedEmoji={frequentlyUsedEmoji}
      onFrequentlyUsedChange={(ids) => {
        setFrequentlyUsedEmoji(ids);
        writeStored(EMOJI_FREQUENTLY_USED_KEY, ids);
      }}
      onSkinToneChange={(tone) => {
        setSkinTone(tone);
        writeStored(EMOJI_SKIN_TONE_KEY, tone);
      }}
      pickerProps={{
        ...props.pickerProps,
        theme: mode,
      }}
      skinTone={skinTone}
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
  const options = useMemo<ChannelOptions>(
    () => ({
      // filter_values: {
      //   user_id: userId,
      // },
      // predefined_filter: 'livestreams_channels',
      presence: true,
      state: true,
      limit: 10,
    }),
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
        middleware: [createTextComposerEmojiMiddleware() as TextComposerMiddleware],
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
