import type { Channel as StreamChannel } from 'stream-chat';
import {
  AIStateIndicator,
  Channel,
  ChannelHeader,
  MessageList,
  TypingIndicator,
  VirtualizedMessageList,
  WithComponents,
  WithDragAndDropUpload,
} from 'stream-chat-react';

import { ReturnToSkipNavigation } from '../../AccessibilityNavigation/ReturnToSkipNavigation.tsx';
import { CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID } from '../../AccessibilityNavigation/skipNavigationTargets';
import { ChannelPreviewOverlay } from '../../ChannelPreviewOverlay/ChannelPreviewOverlay.tsx';
import { ConfigurableMessageComposer } from '../../ConfigurableMessageComposer';
import { HeaderStartWithSidebarToggle } from '../../Sidebar/HeaderContent.tsx';
import { ConfiguredAvatarWithChannelDetail } from '../../ChannelDetail';
import { useVirtualizedMessageList } from '../hooks';
import { useMemberDetailClickHandlers } from '../MemberDetail';

// The channel in the channels view's main slot, with the sidebar toggle in its header.
export const MainChannelPanel = ({ channel }: { channel: StreamChannel }) => {
  const virtualized = useVirtualizedMessageList();
  const memberDetailClickHandlers = useMemberDetailClickHandlers(channel);

  return (
    <WithComponents overrides={{ TypingIndicator }}>
      <Channel channel={channel}>
        <WithDragAndDropUpload>
          <ChannelHeader
            Avatar={ConfiguredAvatarWithChannelDetail}
            StartContent={HeaderStartWithSidebarToggle}
          />
          <div className='app-chat-view__channel-body'>
            {virtualized ? (
              <VirtualizedMessageList groupByUser returnAllReadData />
            ) : (
              <MessageList {...memberDetailClickHandlers} returnAllReadData />
            )}
            <ReturnToSkipNavigation />
            <AIStateIndicator />
            <ConfigurableMessageComposer
              additionalTextareaProps={{
                id: CHANNEL_MESSAGE_COMPOSER_TEXTAREA_TARGET_ID,
              }}
              maxRows={10}
            />
            <ChannelPreviewOverlay />
          </div>
        </WithDragAndDropUpload>
      </Channel>
    </WithComponents>
  );
};
