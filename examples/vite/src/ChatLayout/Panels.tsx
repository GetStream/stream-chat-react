import clsx from 'clsx';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  Channel as StreamChannel,
  Thread as ThreadType,
} from 'stream-chat';
import { type MouseEvent, type PropsWithChildren, useEffect, useRef } from 'react';
import {
  AIStateIndicator,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelListItem,
  ChannelNavigation,
  ChatView,
  type ChatViewSelectorEntry,
  EmptyStateIndicator,
  MessageComposer,
  MessageList,
  Thread,
  ThreadList,
  ThreadProvider,
  TypingIndicator,
  useActiveThread,
  useChatViewNavigation,
  useSlotChannel,
  useSlotThread,
  useSlotThreads,
  VirtualizedMessageList,
  Window,
  WithComponents,
  WithDragAndDropUpload,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings/state';
import { ConfiguredAvatarWithChannelDetail } from './ConfiguredChannelDetail.tsx';
import {
  CHANNEL_THREAD_SLOT,
  DESKTOP_LAYOUT_BREAKPOINT,
  MAIN_CHANNEL_SLOT,
} from './constants.ts';
import { SidebarResizeHandle, ThreadResizeHandle } from './Resize.tsx';
import { ReturnToSkipNavigation } from '../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { ChannelPreviewOverlay } from '../ChannelPreviewOverlay/ChannelPreviewOverlay.tsx';
import { useSidebar } from './SidebarContext.tsx';
import { ThreadStateSync } from './Sync.tsx';

export const CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID =
  'app-channel-message-composer-textarea';
export const CHANNEL_LIST_TARGET_ID = 'app-channel-list';
export const CHANNELS_SELECTOR_BUTTON_TARGET_QUERY =
  '[id^="str-chat__chat-view-"][id$="-tab-channels"]';

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
    open(
      binding,
      event.ctrlKey || event.metaKey ? { slot: CHANNEL_THREAD_SLOT } : undefined,
    );
  };
  return <ChannelListItem channel={channel} onSelect={openChannel} />;
};

// The in-channel reply thread is opened into the channels view's dedicated thread slot
// (bound by the message "reply in thread" / replies-count actions via `open`). It renders
// only when a thread is bound; `ThreadProvider` feeds it to <Thread>, and `useActiveThread`
// activates/deactivates it with window focus.
const ChannelThreadPanel = ({ thread }: { thread?: ThreadType }) => {
  const isOpen = !!thread;
  useActiveThread({ activeThread: thread });

  return (
    <>
      <ThreadResizeHandle isOpen={isOpen} />
      <WithDragAndDropUpload
        className={clsx('str-chat__dropzone-root--thread app-chat-thread-panel', {
          'app-chat-thread-panel--open': isOpen,
        })}
      >
        <ReturnToSkipNavigation />
        {thread && (
          <ThreadProvider thread={thread}>
            <Thread
              additionalMessageComposerProps={{
                audioRecordingEnabled: true,
                asyncMessagesMultiSendEnabled: true,
              }}
              virtualized
            />
          </ThreadProvider>
        )}
      </WithDragAndDropUpload>
    </>
  );
};

// The secondary channels-view slot can hold a 2nd channel (ctrl/⌘-click a channel in the
// list) opened side-by-side, in the same spot the reply thread uses. It renders a full
// channel in that column, with a button to close it (release the slot).
const SecondChannelPanel = ({ channel }: { channel: StreamChannel }) => {
  const { close } = useChatViewNavigation();

  return (
    <>
      <ThreadResizeHandle isOpen />
      <WithDragAndDropUpload className='str-chat__dropzone-root--thread app-chat-thread-panel app-chat-thread-panel--open'>
        <Channel channel={channel}>
          <Window>
            <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
            <div className='app-chat-view__channel-body'>
              <button
                className='str-chat__button str-chat__button--secondary'
                onClick={() => close(CHANNEL_THREAD_SLOT)}
                style={{ alignSelf: 'flex-end', margin: 'var(--str-chat__spacing-xs)' }}
                type='button'
              >
                Close split
              </button>
              <MessageList returnAllReadData />
              <MessageComposer asyncMessagesMultiSendEnabled audioRecordingEnabled />
            </div>
          </Window>
        </Channel>
      </WithDragAndDropUpload>
    </>
  );
};

const ResponsiveChannelPanels = () => {
  // The secondary slot holds either a 2nd channel (ctrl/⌘-click) or the reply thread.
  const sideChannel = useSlotChannel({ slot: CHANNEL_THREAD_SLOT });
  const replyThread = useSlotThread({ slot: CHANNEL_THREAD_SLOT });
  const isSideOpen = !!sideChannel || !!replyThread;
  const { type: messageListType } = useAppSettingsSelector((s) => s.messageList);

  return (
    <div
      className={clsx('app-chat-view__channel-content', {
        'app-chat-view__channel-content--thread-open': isSideOpen,
      })}
    >
      <WithDragAndDropUpload className='app-chat-view__channel-main'>
        <Window>
          <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
          <div className='app-chat-view__channel-body'>
            {messageListType === 'virtualized' ? (
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
        </Window>
      </WithDragAndDropUpload>
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
  filters: ChannelFilters;
  iconOnly?: boolean;
  initialChannelId?: string;
  itemSet?: ChatViewSelectorEntry[];
  options: ChannelOptions;
  sort: ChannelSort;
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
          }}
        >
          <ChannelNavigation />
        </WithComponents>
      </ChatSidebar>
      <SidebarResizeHandle layoutRef={channelsLayoutRef} />
      <WithComponents overrides={{ TypingIndicator }}>
        {mainChannel && (
          <Channel channel={mainChannel}>
            <ResponsiveChannelPanels />
          </Channel>
        )}
      </WithComponents>
    </div>
  );
};

// Renders a single thread bound to a thread slot. Replaces the removed
// ChatView.ThreadAdapter — the thread comes from the slot (via ThreadProvider) and
// `useActiveThread` keeps it activated/deactivated with window focus.
const ThreadPanel = ({ thread }: { thread: ThreadType }) => {
  useActiveThread({ activeThread: thread });

  return (
    <ThreadProvider thread={thread}>
      <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
        <WithComponents overrides={{ TypingIndicator }}>
          <ReturnToSkipNavigation />
          <Thread
            additionalMessageComposerProps={{
              audioRecordingEnabled: true,
              asyncMessagesMultiSendEnabled: true,
            }}
            virtualized
          />
        </WithComponents>
      </WithDragAndDropUpload>
    </ThreadProvider>
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
  // Threads open in thread slots (one navigation model) — render each.
  const threadSlots = useSlotThreads();
  const threadsLayoutRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <ThreadStateSync />
      <div
        className={clsx('app-chat-view__threads-layout', {
          'app-chat-view__threads-layout--thread-selected': threadSlots.length > 0,
          'app-chat-view__threads-layout--sidebar-collapsed': !sidebarOpen,
        })}
        ref={threadsLayoutRef}
      >
        <ChatSidebar iconOnly={iconOnly} itemSet={itemSet}>
          <ThreadList />
        </ChatSidebar>
        <SidebarResizeHandle layoutRef={threadsLayoutRef} />
        <div className='app-chat-view__threads-main'>
          {threadSlots.length === 0 ? (
            <div className='str-chat__thread-container str-chat__thread'>
              <EmptyStateIndicator listType='message' />
            </div>
          ) : (
            threadSlots.map(({ slot, thread }) => (
              <ThreadPanel key={slot} thread={thread} />
            ))
          )}
        </div>
      </div>
    </>
  );
};
