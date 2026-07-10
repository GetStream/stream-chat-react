import clsx from 'clsx';
import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { useEffect, useRef } from 'react';
import {
  AIStateIndicator,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelList,
  ChatView,
  type ChatViewSelectorEntry,
  MessageComposerUI as DefaultMessageComposerUI,
  MessageComposer,
  MessageList,
  Thread,
  ThreadList,
  TypingIndicator,
  useChannelStateContext,
  useChatContext,
  useThreadsViewContext,
  VirtualizedMessageList,
  Window,
  WithComponents,
  WithDragAndDropUpload,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings/state';
import { ConfiguredAvatarWithChannelDetail } from './ConfiguredChannelDetail.tsx';
import { DESKTOP_LAYOUT_BREAKPOINT } from './constants.ts';
import { SidebarResizeHandle, ThreadResizeHandle } from './Resize.tsx';
import { ReturnToSkipNavigation } from '../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { ChannelPreviewOverlay } from '../ChannelPreviewOverlay/ChannelPreviewOverlay.tsx';
import { useSidebar } from './SidebarContext.tsx';
import { ThreadStateSync } from './Sync.tsx';

export const CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID =
  'app-channel-message-composer-textarea';
export const THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID =
  'app-thread-message-composer-textarea';
export const CHANNEL_LIST_TARGET_ID = 'app-channel-list';
export const THREAD_LIST_TARGET_ID = 'app-thread-list';
export const CHANNELS_SELECTOR_BUTTON_TARGET_QUERY =
  '[id^="str-chat__chat-view-"][id$="-tab-channels"]';

// Tag the list's `[role="listbox"]` with a stable id so the skip-navigation links can target it. The
// listbox unmounts/remounts (search mode, view switches, reloads) and its view may start inactive, so
// observe `document.body` and re-tag whenever it (re)appears. The selector is globally unambiguous —
// only one view's sidebar is mounted at a time.
const useTagSkipNavigationListbox = (listboxSelector: string, targetId: string) => {
  useEffect(() => {
    const tagListbox = () => {
      const listbox = document.querySelector<HTMLElement>(listboxSelector);
      if (listbox && listbox.id !== targetId) {
        listbox.id = targetId;
      }
    };

    tagListbox();
    const observer = new MutationObserver(tagListbox);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [listboxSelector, targetId]);
};

const ChannelThreadPanel = () => {
  const { thread } = useChannelStateContext('ChannelThreadPanel');
  const isOpen = !!thread;

  return (
    <>
      <ThreadResizeHandle isOpen={isOpen} />
      <WithDragAndDropUpload
        className={clsx('str-chat__dropzone-root--thread app-chat-thread-panel', {
          'app-chat-thread-panel--open': isOpen,
        })}
      >
        <ReturnToSkipNavigation />
        <Thread
          additionalMessageComposerProps={{
            audioRecordingEnabled: true,
            asyncMessagesMultiSendEnabled: true,
          }}
          virtualized
        />
      </WithDragAndDropUpload>
    </>
  );
};

const ResponsiveChannelPanels = () => {
  const { thread } = useChannelStateContext('ResponsiveChannelPanels');
  const isThreadOpen = !!thread;
  const { type: messageListType } = useAppSettingsSelector((s) => s.messageList);

  return (
    <div
      className={clsx('app-chat-view__channel-content', {
        'app-chat-view__channel-content--thread-open': isThreadOpen,
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
              focus
            />
            <ChannelPreviewOverlay />
          </div>
        </Window>
      </WithDragAndDropUpload>
      <ChannelThreadPanel />
    </div>
  );
};

export const ChannelsPanels = ({
  filters,
  iconOnly,
  initialChannelId,
  itemSet,
  options,
  sort,
}: {
  filters: ChannelFilters;
  iconOnly?: boolean;
  initialChannelId?: string;
  itemSet?: ChatViewSelectorEntry[];
  options: ChannelOptions;
  sort: ChannelSort;
}) => {
  const { channel } = useChatContext('ChannelsPanels');
  const { closeSidebar, sidebarOpen } = useSidebar();
  const channelsLayoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!channel?.id || typeof window === 'undefined') return;
    if (window.innerWidth >= DESKTOP_LAYOUT_BREAKPOINT) return;
    closeSidebar();
  }, [channel?.id, closeSidebar]);

  useTagSkipNavigationListbox(
    '.app-chat-sidebar-overlay .str-chat__channel-list-inner__main',
    CHANNEL_LIST_TARGET_ID,
  );

  return (
    <ChatView.Channels>
      <div
        className={clsx('app-chat-view__channels-layout', {
          'app-chat-view__channels-layout--channel-selected': !!channel?.id,
          'app-chat-view__channels-layout--sidebar-collapsed': !sidebarOpen,
        })}
        ref={channelsLayoutRef}
      >
        <div className='app-chat-sidebar-overlay'>
          <ChatView.Selector iconOnly={iconOnly} itemSet={itemSet} />
          <WithComponents
            overrides={{
              Avatar: ChannelAvatar,
            }}
          >
            <ChannelList
              customActiveChannel={initialChannelId}
              filters={filters}
              onRemovedFromChannel={() => undefined}
              options={options}
              showChannelSearch
              sort={sort}
            />
          </WithComponents>
        </div>
        <SidebarResizeHandle layoutRef={channelsLayoutRef} />
        <WithComponents overrides={{ TypingIndicator }}>
          <Channel>
            <ResponsiveChannelPanels />
          </Channel>
        </WithComponents>
      </div>
    </ChatView.Channels>
  );
};

// Renders the "Back to quick navigation" return link above the thread's composer (the SDK renders
// the thread composer internally, so we inject via the MessageComposerUI slot) — matching the
// channel view, where the link sits right above <MessageComposer />.
const ThreadMessageComposerUI = () => (
  <>
    <ReturnToSkipNavigation />
    <DefaultMessageComposerUI />
  </>
);

export const ThreadsPanels = ({
  iconOnly,
  itemSet,
}: {
  iconOnly?: boolean;
  itemSet?: ChatViewSelectorEntry[];
}) => {
  const { sidebarOpen } = useSidebar();
  const { activeThread } = useThreadsViewContext();
  const threadsLayoutRef = useRef<HTMLDivElement | null>(null);

  useTagSkipNavigationListbox(
    '.app-chat-sidebar-overlay .str-chat__thread-list',
    THREAD_LIST_TARGET_ID,
  );

  return (
    <ChatView.Threads>
      <ThreadStateSync />
      <div
        className={clsx('app-chat-view__threads-layout', {
          'app-chat-view__threads-layout--thread-selected': !!activeThread?.id,
          'app-chat-view__threads-layout--sidebar-collapsed': !sidebarOpen,
        })}
        ref={threadsLayoutRef}
      >
        <div className='app-chat-sidebar-overlay'>
          <ChatView.Selector iconOnly={iconOnly} itemSet={itemSet} />
          <ThreadList />
        </div>
        <SidebarResizeHandle layoutRef={threadsLayoutRef} />
        <div className='app-chat-view__threads-main'>
          <ChatView.ThreadAdapter>
            <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
              <WithComponents
                overrides={{
                  MessageComposerUI: ThreadMessageComposerUI,
                  TypingIndicator,
                }}
              >
                <Thread
                  additionalMessageComposerProps={{
                    additionalTextareaProps: {
                      id: THREAD_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
                    },
                    audioRecordingEnabled: true,
                    asyncMessagesMultiSendEnabled: true,
                    // Auto-focus the thread composer on mount, matching the channels-view composer.
                    focus: true,
                  }}
                  virtualized
                />
              </WithComponents>
            </WithDragAndDropUpload>
          </ChatView.ThreadAdapter>
        </div>
      </div>
    </ChatView.Threads>
  );
};
