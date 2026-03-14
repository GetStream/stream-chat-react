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
  MessageInput,
  MessageList,
  Thread,
  ThreadList,
  TypingIndicator,
  Window,
  WithComponents,
  WithDragAndDropUpload,
  useChatContext,
} from 'stream-chat-react';
import { Search } from 'stream-chat-react/experimental';

import { SidebarResizeHandle, ThreadResizeHandle } from './Resize.tsx';
import { ThreadStateSync } from './Sync.tsx';

export const ChannelsPanels = ({
  filters,
  initialChannelId,
  options,
  sort,
}: {
  filters: ChannelFilters;
  initialChannelId?: string;
  options: ChannelOptions;
  sort: ChannelSort;
}) => {
  const { navOpen = true } = useChatContext('ChannelsPanels');
  const channelsLayoutRef = useRef<HTMLDivElement | null>(null);

  return (
    <ChatView.Channels>
      <div
        className={clsx('app-chat-view__channels-layout', {
          'app-chat-view__channels-layout--sidebar-collapsed': navOpen === false,
        })}
        ref={channelsLayoutRef}
      >
        <ChannelList
          ChannelSearch={Search}
          Avatar={ChannelAvatar}
          customActiveChannel={initialChannelId}
          filters={filters}
          options={options}
          sort={sort}
          showChannelSearch
        />
        <SidebarResizeHandle layoutRef={channelsLayoutRef} />
        <WithComponents overrides={{ TypingIndicator }}>
          <Channel>
            <WithDragAndDropUpload>
              <Window>
                <ChannelHeader Avatar={ChannelAvatar} />
                <MessageList returnAllReadData />
                <AIStateIndicator />
                <MessageInput
                  focus
                  audioRecordingEnabled
                  maxRows={10}
                  asyncMessagesMultiSendEnabled
                />
              </Window>
            </WithDragAndDropUpload>
            <ThreadResizeHandle />
            <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
              <Thread virtualized />
            </WithDragAndDropUpload>
          </Channel>
        </WithComponents>
      </div>
    </ChatView.Channels>
  );
};

export const ThreadsPanels = () => {
  const { navOpen = true } = useChatContext('ThreadsPanels');
  const threadsLayoutRef = useRef<HTMLDivElement | null>(null);

  return (
    <ChatView.Threads>
      <ThreadStateSync />
      <div
        className={clsx('app-chat-view__threads-layout', {
          'app-chat-view__threads-layout--sidebar-collapsed': navOpen === false,
        })}
        ref={threadsLayoutRef}
      >
        <ThreadList />
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
