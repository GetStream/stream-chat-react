import clsx from 'clsx';
import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { useRef } from 'react';
import {
  AIStateIndicator,
  Channel,
  ChannelAvatar,
  ChannelHeader,
  ChannelList,
  ChatView,
  MessageComposer,
  MessageList,
  Thread,
  ThreadList,
  TypingIndicator,
  Window,
  WithComponents,
  WithDragAndDropUpload,
  useChannelStateContext,
  useChatContext,
  type ChatViewSelectorEntry,
  useThreadsViewContext,
} from 'stream-chat-react';

import { SidebarResizeHandle, ThreadResizeHandle } from './Resize.tsx';
import { useSidebar } from './SidebarContext.tsx';
import { ThreadStateSync } from './Sync.tsx';

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
        <Thread virtualized />
      </WithDragAndDropUpload>
    </>
  );
};

const ResponsiveChannelPanels = () => {
  const { thread } = useChannelStateContext('ResponsiveChannelPanels');
  const isThreadOpen = !!thread;

  return (
    <div
      className={clsx('app-chat-view__channel-content', {
        'app-chat-view__channel-content--thread-open': isThreadOpen,
      })}
    >
      <WithDragAndDropUpload className='app-chat-view__channel-main'>
        <Window>
          <ChannelHeader Avatar={ChannelAvatar} />
          <MessageList returnAllReadData />
          <AIStateIndicator />
          <MessageComposer
            focus
            audioRecordingEnabled
            maxRows={10}
            asyncMessagesMultiSendEnabled
          />
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
  const { sidebarOpen } = useSidebar();
  const channelsLayoutRef = useRef<HTMLDivElement | null>(null);

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
              // @ts-expect-error TODO: adjust the sizing
              Avatar: ChannelAvatar,
            }}
          >
            <ChannelList
              customActiveChannel={initialChannelId}
              filters={filters}
              options={options}
              sort={sort}
              showChannelSearch
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
              <WithComponents overrides={{ TypingIndicator }}>
                <Thread virtualized />
              </WithComponents>
            </WithDragAndDropUpload>
          </ChatView.ThreadAdapter>
        </div>
      </div>
    </ChatView.Threads>
  );
};
