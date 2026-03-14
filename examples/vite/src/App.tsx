import { type CSSProperties, useCallback, useEffect, useMemo } from 'react';
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
  Chat,
  ChatView,
  ReactionsList,
  WithComponents,
  defaultReactionOptions,
  type ReactionOptions,
  mapEmojiMartData,
  useCreateChatClient,
} from 'stream-chat-react';
import { createTextComposerEmojiMiddleware, EmojiPicker } from 'stream-chat-react/emojis';
import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data/sets/14/native.json';
import { humanId } from 'human-id';

import { useAppSettingsState } from './AppSettings/state.ts';
import { DESKTOP_LAYOUT_BREAKPOINT } from './ChatLayout/constants.ts';
import { ChannelsPanels, ThreadsPanels } from './ChatLayout/Panels.tsx';
import { SidebarLayoutSync } from './ChatLayout/Resize.tsx';
import {
  ChatStateSync,
  getSelectedChannelIdFromUrl,
  getSelectedChatViewFromUrl,
} from './ChatLayout/Sync.tsx';
import { chatViewSelectorItemSet } from './Sidebar/ChatViewSelectorItemSet.tsx';

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

  return { tokenProvider, userId };
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

const EmojiPickerWithCustomOptions = (
  props: React.ComponentProps<typeof EmojiPicker>,
) => {
  const {
    theme: { mode },
  } = useAppSettingsState();

  return <EmojiPicker {...props} pickerProps={{ theme: mode }} />;
};

const App = () => {
  const { tokenProvider, userId } = useUser();
  const { chatView, panelLayout, theme } = useAppSettingsState();
  const initialChannelId = useMemo(() => getSelectedChannelIdFromUrl(), []);
  const initialChatView = useMemo(() => getSelectedChatViewFromUrl(), []);

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: { id: userId },
  });
  const useResponsiveInitialNav =
    typeof window === 'undefined' || window.innerWidth < DESKTOP_LAYOUT_BREAKPOINT;

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

  const chatTheme = theme.mode === 'dark' ? 'str-chat__theme-dark' : 'messaging light';
  const appLayoutStyle = {
    '--app-left-panel-width': `${panelLayout.leftPanel.width}px`,
    '--app-thread-panel-width': `${panelLayout.threadPanel.width}px`,
  } as CSSProperties;

  if (!chatClient) return <>Loading...</>;

  return (
    <WithComponents
      overrides={{
        emojiSearchIndex: SearchIndex,
        EmojiPicker: EmojiPickerWithCustomOptions,
        ReactionsList: CustomMessageReactions,
        reactionOptions: newReactionOptions,
      }}
    >
      <Chat
        searchController={searchController}
        client={chatClient}
        initialNavOpen={!panelLayout.leftPanel.collapsed}
        initialNavOpenResponsive={useResponsiveInitialNav}
        isMessageAIGenerated={isMessageAIGenerated}
        theme={chatTheme}
      >
        <div className='app-chat-layout' style={appLayoutStyle}>
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
