import clsx from 'clsx';
import type {
  Channel as StreamChannel,
  Thread as ThreadType,
  UserResponse,
} from 'stream-chat';
import { type MouseEvent, type PropsWithChildren, useEffect, useRef } from 'react';
import {
  AIStateIndicator,
  Button,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelListItem,
  ChannelSearchResultItem,
  ChatView,
  type ChatViewSelectorEntry,
  EmptyStateIndicator,
  IconXmark,
  MessageComposer,
  MessageList,
  MessageSearchResultItem,
  SearchSourceResultList,
  type SearchSourceResultListProps,
  Thread,
  ThreadList,
  ThreadProvider,
  ThreadSlot,
  TypingIndicator,
  useActiveThread,
  useChatContext,
  useChatViewNavigation,
  UserSearchResultItem,
  useSlotChannel,
  useSlotThread,
  VirtualizedMessageList,
  WithComponents,
  WithDragAndDropUpload,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings/state';
import { ConfiguredAvatarWithChannelDetail } from './ConfiguredChannelDetail.tsx';
import {
  CHANNEL_THREAD_SLOT,
  DESKTOP_LAYOUT_BREAKPOINT,
  MAIN_CHANNEL_SLOT,
  MAIN_THREAD_SLOT,
  OPTIONAL_THREAD_SLOT,
} from './constants.ts';
import { SidebarResizeHandle, ThreadResizeHandle } from './Resize.tsx';
import { ReturnToSkipNavigation } from '../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { ChannelPreviewOverlay } from '../ChannelPreviewOverlay/ChannelPreviewOverlay.tsx';
import { useSidebar } from './SidebarContext.tsx';
import { SwitchableChannelNavigation } from './SwitchableChannelNavigation.tsx';
import { ThreadStateSync } from './Sync.tsx';

export const CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID =
  'app-channel-message-composer-textarea';
export const CHANNEL_LIST_TARGET_ID = 'app-channel-list';
export const CHANNELS_SELECTOR_BUTTON_TARGET_QUERY =
  '[id^="str-chat__chat-view-"][id$="-tab-channels"]';

// Whether the app-settings "message list" toggle is set to the virtualized list. Read the same
// way everywhere so every channel and thread honors the setting (not just the primary channel).
const useVirtualizedMessageList = () =>
  useAppSettingsSelector((s) => s.messageList).type === 'virtualized';

// Shared sidebar overlay: the view selector (nav rail) + the view-specific list. Extracted
// so the selector isn't duplicated across the channels/threads panels. (It still renders
// per active view — the layout CSS scopes the collapsible overlay to each view's layout, so
// a single always-mounted rail would need a separate CSS refactor.)
const ChatSidebar = ({
  children,
  iconOnly,
  itemSet,
}: PropsWithChildren<{ iconOnly?: boolean; itemSet?: ChatViewSelectorEntry[] }>) => (
  <div className='app-chat-sidebar-overlay'>
    <ChatView.Selector iconOnly={iconOnly} itemSet={itemSet} />
    {children}
  </div>
);

// Channel list item whose click opens the channel via ChatView navigation. A plain click
// opens it in the primary slot (default resolution); ctrl/⌘-click opens it beside the
// current channel, in the secondary slot where the reply thread normally sits.
const CustomChannelListItem = ({ item }: { item: unknown }) => {
  const channel = item as StreamChannel;
  const { open } = useChatViewNavigation();
  const openChannel = (event: MouseEvent) => {
    const binding = {
      key: channel.cid ?? undefined,
      kind: 'channel' as const,
      source: channel,
    };
    // ctrl/⌘-click opens the channel beside the current one (secondary slot); a plain click
    // opens it in place. `additive` lets the navigation layer pick the secondary slot rather
    // than hard-coding its name here.
    open(binding, { additive: event.ctrlKey || event.metaKey });
  };
  return <ChannelListItem channel={channel} onSelect={openChannel} />;
};

// Search result items wired for ⌘/Ctrl-click here in the app (the SDK items default to a plain
// open; the "open beside" UX decision belongs to the app). Plain click opens in place;
// ctrl/⌘-click opens the result beside the current channel (additive -> secondary slot).
const SearchChannelResult = ({ item }: { item: StreamChannel }) => {
  const { open } = useChatViewNavigation();
  return (
    <ChannelSearchResultItem
      item={item}
      onSelect={(event) =>
        open(
          { key: item.cid ?? undefined, kind: 'channel', source: item },
          { additive: event.ctrlKey || event.metaKey },
        )
      }
    />
  );
};

const SearchUserResult = ({ item }: { item: UserResponse }) => {
  const { open } = useChatViewNavigation();
  const { client } = useChatContext();
  return (
    <UserSearchResultItem
      item={item}
      onSelect={(event) => {
        const channel = client.channel('messaging', {
          members: [client.userID as string, item.id],
        });
        void channel.watch();
        open(
          { key: channel.cid ?? undefined, kind: 'channel', source: channel },
          { additive: event.ctrlKey || event.metaKey },
        );
      }}
    />
  );
};

// Injects the ⌘/Ctrl-aware channel/user result items (messages keep the default). Provided to
// the channels view via ComponentContext (overrides the SDK's SearchSourceResultList).
const SplitAwareSearchResultList = (props: SearchSourceResultListProps) => (
  <SearchSourceResultList
    {...props}
    SearchResultItems={{
      channels: SearchChannelResult,
      messages: MessageSearchResultItem,
      users: SearchUserResult,
    }}
  />
);

// The in-channel reply thread is opened into the channels view's secondary slot (the same
// slot a 2nd channel can occupy) — bound by the message "reply in thread" / replies-count
// actions via `open`. It renders only when a thread is bound; `ThreadProvider` feeds it to
// <Thread>, and `useActiveThread` activates/deactivates it with window focus.
const ChannelThreadPanel = ({ thread }: { thread?: ThreadType }) => {
  const isOpen = !!thread;
  const virtualized = useVirtualizedMessageList();
  useActiveThread({ activeThread: thread });

  const panelClassName = clsx(
    'str-chat__dropzone-root--thread app-chat-secondary-panel',
    { 'app-chat-secondary-panel--open': isOpen },
  );

  return (
    <>
      <ThreadResizeHandle isOpen={isOpen} />
      {thread ? (
        // ThreadProvider wraps the dropzone so WithDragAndDropUpload's `useChannel` resolves
        // the thread's own channel — the thread panel no longer depends on an ambient
        // <Channel>, so it can live in its own slot beside the primary channel.
        <ThreadProvider thread={thread}>
          <WithDragAndDropUpload className={panelClassName}>
            <ReturnToSkipNavigation />
            <Thread
              additionalMessageComposerProps={{
                audioRecordingEnabled: true,
                asyncMessagesMultiSendEnabled: true,
              }}
              virtualized={virtualized}
            />
          </WithDragAndDropUpload>
        </ThreadProvider>
      ) : (
        // Closed state: just the collapsed-width shell (no dropzone, so no channel needed).
        <div className={panelClassName} />
      )}
    </>
  );
};

// Close button for the secondary channel, injected into its ChannelHeader via the
// `HeaderStartContent` component slot (ChannelHeader has no built-in close affordance the way
// the reply thread's ThreadHeader does). Releases the secondary slot — i.e. closes the split.
const SecondaryChannelCloseButton = () => {
  const { close } = useChatViewNavigation();

  return (
    <Button
      appearance='ghost'
      aria-label='Close split'
      circular
      onClick={() => close(CHANNEL_THREAD_SLOT)}
      size='md'
      variant='secondary'
    >
      <IconXmark />
    </Button>
  );
};

// The secondary channels-view slot can hold a 2nd channel (ctrl/⌘-click a channel in the
// list) opened side-by-side, in the same spot the reply thread uses. It renders a full
// channel in that column; the close affordance is added to its header via HeaderStartContent.
const SecondChannelPanel = ({ channel }: { channel: StreamChannel }) => {
  const virtualized = useVirtualizedMessageList();

  return (
    <>
      <ThreadResizeHandle isOpen />
      {/* The secondary column wrapper carries `.app-chat-secondary-panel` (the same column the
          reply thread uses) so the 2nd channel renders side-by-side with the primary channel.
          Its own <Channel> lives inside — a sibling of the primary channel, not nested in it —
          with the dropzone inside the <Channel> so WithDragAndDropUpload's `useChannel`
          resolves this channel. HeaderStartContent is overridden (scoped to this channel only)
          to drop a close button into the channel header. */}
      <div className='app-chat-secondary-panel app-chat-secondary-panel--open'>
        <Channel channel={channel}>
          <WithComponents overrides={{ HeaderStartContent: SecondaryChannelCloseButton }}>
            {/* `.str-chat__channel` is the content column itself now, so the content
                (header + body) goes straight inside the dropzone. */}
            <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
              <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
              <div className='app-chat-view__channel-body'>
                {virtualized ? (
                  <VirtualizedMessageList returnAllReadData shouldGroupByUser />
                ) : (
                  <MessageList returnAllReadData />
                )}
                <MessageComposer asyncMessagesMultiSendEnabled audioRecordingEnabled />
              </div>
            </WithDragAndDropUpload>
          </WithComponents>
        </Channel>
      </div>
    </>
  );
};

const ResponsiveChannelPanels = ({ mainChannel }: { mainChannel?: StreamChannel }) => {
  // The channel and the thread each occupy their OWN slot and render as siblings here: the
  // primary channel wraps only its own message panel, and the secondary slot — a reply
  // thread or a 2nd channel — sits beside it rather than nested inside the channel. A bound
  // Thread carries its own channel, so it no longer depends on an ambient <Channel>.
  const sideChannel = useSlotChannel({ slot: CHANNEL_THREAD_SLOT });
  const replyThread = useSlotThread({ slot: CHANNEL_THREAD_SLOT });
  const isSideOpen = !!sideChannel || !!replyThread;
  const virtualized = useVirtualizedMessageList();

  return (
    <div
      className={clsx('app-chat-view__channel-content', {
        'app-chat-view__channel-content--secondary-open': isSideOpen,
      })}
    >
      {mainChannel && (
        // The main column wrapper carries `.app-chat-view__channel-main` (the existing layout
        // rules size it); the primary <Channel> lives inside it — a sibling of the secondary
        // panel below, not its ancestor.
        <div className='app-chat-view__channel-main'>
          <Channel channel={mainChannel}>
            <WithDragAndDropUpload>
              <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
              <div className='app-chat-view__channel-body'>
                {virtualized ? (
                  <VirtualizedMessageList returnAllReadData shouldGroupByUser />
                ) : (
                  <MessageList returnAllReadData />
                )}
                <ReturnToSkipNavigation />
                <AIStateIndicator />
                <MessageComposer
                  additionalTextareaProps={{
                    id: CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
                  }}
                  asyncMessagesMultiSendEnabled
                  audioRecordingEnabled
                  maxRows={10}
                />
                <ChannelPreviewOverlay />
              </div>
            </WithDragAndDropUpload>
          </Channel>
        </div>
      )}
      {sideChannel ? (
        <SecondChannelPanel channel={sideChannel} />
      ) : (
        <ChannelThreadPanel thread={replyThread} />
      )}
    </div>
  );
};

export const ChannelsPanels = ({
  iconOnly,
  itemSet,
}: {
  iconOnly?: boolean;
  initialChannelId?: string;
  itemSet?: ChatViewSelectorEntry[];
}) => {
  // The primary channel occupies the main panel; a 2nd channel (ctrl/⌘-click) or the reply
  // thread shares the secondary slot, rendered by ResponsiveChannelPanels.
  const mainChannel = useSlotChannel({ slot: MAIN_CHANNEL_SLOT });
  const mainChannelId = mainChannel?.id;
  const { closeSidebar, sidebarOpen } = useSidebar();
  const channelsLayoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mainChannelId || typeof window === 'undefined') return;
    if (window.innerWidth >= DESKTOP_LAYOUT_BREAKPOINT) return;
    closeSidebar();
  }, [mainChannelId, closeSidebar]);

  useEffect(() => {
    const channelListElement = channelsLayoutRef.current?.querySelector<HTMLElement>(
      '.app-chat-sidebar-overlay > .str-chat__channel-list',
    );
    if (!channelListElement) return;

    channelListElement.id = CHANNEL_LIST_TARGET_ID;
  }, [mainChannelId, sidebarOpen]);

  return (
    <div
      className={clsx('app-chat-view__channels-layout', {
        'app-chat-view__channels-layout--channel-selected': !!mainChannel,
        'app-chat-view__channels-layout--sidebar-collapsed': !sidebarOpen,
      })}
      ref={channelsLayoutRef}
    >
      <ChatSidebar iconOnly={iconOnly} itemSet={itemSet}>
        <WithComponents
          overrides={{
            Avatar: ChannelAvatar,
            ListItem: CustomChannelListItem,
            SearchSourceResultList: SplitAwareSearchResultList,
          }}
        >
          <SwitchableChannelNavigation />
        </WithComponents>
      </ChatSidebar>
      <SidebarResizeHandle layoutRef={channelsLayoutRef} />
      <WithComponents overrides={{ TypingIndicator }}>
        <ResponsiveChannelPanels mainChannel={mainChannel} />
      </WithComponents>
    </div>
  );
};

// Renders the primary open thread, bound to the main thread slot. `ThreadSlot` supplies the
// ThreadProvider + slot context (so the header's close button knows which slot it releases),
// and `useActiveThread` keeps the thread activated/deactivated with window focus.
const ThreadPanel = ({ thread }: { thread: ThreadType }) => {
  const virtualized = useVirtualizedMessageList();
  useActiveThread({ activeThread: thread });

  return (
    <ThreadSlot hideIfEmpty={false} slot={MAIN_THREAD_SLOT}>
      <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
        <WithComponents overrides={{ TypingIndicator }}>
          <ReturnToSkipNavigation />
          <Thread
            additionalMessageComposerProps={{
              audioRecordingEnabled: true,
              asyncMessagesMultiSendEnabled: true,
            }}
            virtualized={virtualized}
          />
        </WithComponents>
      </WithDragAndDropUpload>
    </ThreadSlot>
  );
};

// The threads view's secondary slot holds a 2nd thread (ctrl/⌘-click a thread in the list)
// opened side-by-side with the primary thread. It occupies the resizable secondary column.
// `ThreadSlot` binds it to OPTIONAL_THREAD_SLOT, which is why its ThreadHeader shows the
// built-in close button (end content) — the same header the channels-view reply thread uses.
const SecondaryThreadPanel = ({ thread }: { thread: ThreadType }) => {
  const virtualized = useVirtualizedMessageList();
  useActiveThread({ activeThread: thread });

  return (
    <ThreadSlot hideIfEmpty={false} slot={OPTIONAL_THREAD_SLOT}>
      <div className='app-chat-secondary-panel app-chat-secondary-panel--open'>
        <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
          <WithComponents overrides={{ TypingIndicator }}>
            <ReturnToSkipNavigation />
            <Thread
              additionalMessageComposerProps={{
                audioRecordingEnabled: true,
                asyncMessagesMultiSendEnabled: true,
              }}
              virtualized={virtualized}
            />
          </WithComponents>
        </WithDragAndDropUpload>
      </div>
    </ThreadSlot>
  );
};

export const ThreadsPanels = ({
  iconOnly,
  itemSet,
}: {
  iconOnly?: boolean;
  itemSet?: ChatViewSelectorEntry[];
}) => {
  const { sidebarOpen } = useSidebar();
  // The primary thread fills the main column; an optional 2nd thread (ctrl/⌘-click) occupies
  // the resizable secondary column beside it — the same slot machinery the channels view uses.
  const mainThread = useSlotThread({ slot: MAIN_THREAD_SLOT });
  const optionalThread = useSlotThread({ slot: OPTIONAL_THREAD_SLOT });
  const hasThread = !!mainThread || !!optionalThread;
  const isSecondaryOpen = !!optionalThread;
  const threadsLayoutRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <ThreadStateSync />
      <div
        className={clsx('app-chat-view__threads-layout', {
          'app-chat-view__threads-layout--thread-selected': hasThread,
          'app-chat-view__threads-layout--sidebar-collapsed': !sidebarOpen,
        })}
        ref={threadsLayoutRef}
      >
        <ChatSidebar iconOnly={iconOnly} itemSet={itemSet}>
          <ThreadList />
        </ChatSidebar>
        <SidebarResizeHandle layoutRef={threadsLayoutRef} />
        <div
          className={clsx('app-chat-view__threads-main', {
            'app-chat-view__threads-main--secondary-open': isSecondaryOpen,
          })}
        >
          {!hasThread ? (
            <div className='str-chat__thread-container str-chat__thread'>
              <EmptyStateIndicator listType='message' />
            </div>
          ) : (
            <>
              {mainThread && <ThreadPanel thread={mainThread} />}
              <ThreadResizeHandle isOpen={isSecondaryOpen} />
              {optionalThread && <SecondaryThreadPanel thread={optionalThread} />}
            </>
          )}
        </div>
      </div>
    </>
  );
};
