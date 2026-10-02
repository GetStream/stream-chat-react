import { useEffect, useState } from 'react';
import type { ChannelFilters, ClientUser, SortParamRequest } from 'stream-chat';
import { ChannelPaginator } from 'stream-chat';
import {
  Channel,
  ChannelAvatar,
  ChannelHeader,
  type ChannelListItemUIProps,
  ChannelNavigation,
  Chat,
  getChannel,
  MessageComposer,
  MessageList,
  SummarizedMessagePreview,
  Thread,
  ThreadHeader,
  useCreateChatClient,
  useMessageContext,
  WithComponents,
} from 'stream-chat-react';
import {
  ChatView,
  type ChatViewSlotRenderers,
  type DeriveWorkspaceNavigation,
  Slot,
  useChatViewNavigation,
} from 'stream-chat-react/slot-layout';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../2-client-setup/credentials';
import { setUpCommandMiddlewares } from '../2-client-setup/commandMiddlewares';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const sort: SortParamRequest[] = [{ direction: -1, field: 'last_message_at' }];
const filters: ChannelFilters = {
  type: 'messaging',
  members: { $in: [userId] },
};

const ellipsis = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const CustomChannelListItem = ({
  active,
  channel,
  displayImage,
  displayTitle,
  previewedMessage,
}: ChannelListItemUIProps) => {
  // Selection is one navigation model: open the channel into a layout slot.
  const { open } = useChatViewNavigation();

  return (
    <button
      aria-pressed={active}
      // A plain click replaces the open channel; ⌘/ctrl-click opens it beside, in the other slot.
      onClick={(event) =>
        open(
          { key: channel.cid ?? undefined, kind: 'channel', source: channel },
          { additive: event.metaKey || event.ctrlKey },
        )
      }
      style={{
        width: '100%',
        padding: '12px',
        display: 'flex',
        gap: '12px',
        border: 'none',
        background: active ? '#d3f2ef' : 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '20px',
      }}
      type='button'
    >
      <ChannelAvatar
        imageUrl={displayImage ?? channel.data?.custom?.image}
        size='xl'
        userName={displayTitle ?? channel.data?.custom?.name ?? 'Channel'}
      />
      {/* `minWidth: 0` lets the text column shrink below its content, so a long title or preview
          is cut off with an ellipsis instead of squeezing the avatar out of the row. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={ellipsis}>
          {displayTitle ?? channel.data?.custom?.name ?? 'Unnamed Channel'}
        </div>
        {previewedMessage ? (
          <div style={{ ...ellipsis, fontSize: '14px', opacity: 0.75 }}>
            <SummarizedMessagePreview latestMessage={previewedMessage} />
          </div>
        ) : null}
      </div>
    </button>
  );
};

const CustomMessage = () => {
  const { message } = useMessageContext();
  const isOwnMessage = message.user?.id === userId;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        padding: '4px 8px',
      }}
    >
      <div
        style={{
          background: isOwnMessage ? '#d3f2ef' : '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          maxWidth: 'min(80%, 640px)',
          padding: '12px 16px',
        }}
      >
        <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700 }}>
          {message.user?.name}
        </div>
        <div style={{ color: '#334155' }}>{message.text}</div>
      </div>
    </div>
  );
};

// One view ("channels") with two generic slots side by side. Each `<Slot>` renders whatever is
// open in it - a channel or a thread - through `slotRenderers`. Module-scoped so the references are
// stable (they feed the ChatView layout controller).
const chatViewLayouts = [{ id: 'channels' as const, slots: ['left', 'right'] }];

const slotRenderers: ChatViewSlotRenderers = {
  channel: ({ source }) => (
    <Channel channel={source}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
  ),
  thread: ({ source }) => (
    <Thread thread={source}>
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
    </Thread>
  ),
};

// A plain click on a channel replaces the open one; ⌘/ctrl-click opens it beside, in the other slot.
const deriveWorkspaceNavigation: DeriveWorkspaceNavigation = (base) => ({
  openChannel: (channel, options) =>
    base.openChannel(channel, {
      ...options,
      additive:
        options?.additive ?? !!(options?.event?.metaKey || options?.event?.ctrlKey),
    }),
});

const ChannelsWorkspace = () => (
  <>
    <ChannelNavigation />
    {/* The slots' own container, so `layout.css` can react to the width they share. */}
    <div className='channel-slots'>
      <Slot slot='left' />
      <Slot slot='right' />
    </div>
  </>
);

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  });

  // Commands such as /giphy need their middlewares in every composer (see
  // `setUpCommandMiddlewares`). A setup function applies to composers created after it is set, so
  // it is registered before the effects below create any.
  useEffect(() => {
    if (!client) return;
    client.config.setSetupFunction('messageComposer', ({ composer }) =>
      setUpCommandMiddlewares(composer),
    );
  }, [client]);

  // Channel-list query config (filters/sort) lives on a `ChannelPaginator`. The list is registered
  // on `client.channelManager` — the orchestrator instantiated together with the client, which
  // keeps every registered list in sync with WS events. `<ChannelNavigation>` renders one list per
  // registered paginator.
  useEffect(() => {
    if (!client) return;
    const paginator = new ChannelPaginator({
      client,
      filters,
      id: 'channels:default',
      sort,
    });
    client.channelManager.insertPaginator({ paginator });
    return () => {
      client.channelManager.removePaginator(paginator);
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;

    const initChannel = async () => {
      const channel = client.channelManager.ensure({
        data: {
          members: [userId],
          // custom channel fields live under `custom` since v10
          custom: {
            image: 'https://getstream.io/random_png/?name=react-v14',
            name: 'Talk about React',
          },
        },
        id: 'react-tutorial',
        type: 'messaging',
      });

      // `Channel` binds a channel to its subtree; it does not query one, so initializing is the
      // caller's job. The cached instance may already be loaded, so query only when it is not --
      // and when a query is needed, `getChannel` de-duplicates calls that overlap in time.
      if (!channel.initialized) {
        await getChannel({ channel, client });
      }
      setIsReady(true);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize tutorial channel', error);
    });
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;
  if (!isReady) return <div>Loading tutorial channel...</div>;

  return (
    <WithComponents
      overrides={{
        ChannelListItemUI: CustomChannelListItem,
        MessageUI: CustomMessage,
      }}
    >
      <Chat client={client} theme='custom-theme'>
        <ChatView
          deriveWorkspaceNavigation={deriveWorkspaceNavigation}
          layouts={chatViewLayouts}
          slotRenderers={slotRenderers}
          views={{ channels: <ChannelsWorkspace /> }}
        />
      </Chat>
    </WithComponents>
  );
};

export default App;
