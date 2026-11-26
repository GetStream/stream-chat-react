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
import { ConfiguredAvatarWithChannelDetail } from '../../ChannelDetail';
import { useVirtualizedMessageList } from '../hooks';
import { useMemberDetailClickHandlers } from '../MemberDetail';

// A 2nd channel in the channels view's secondary slot, opened with a ⌘/ctrl-click in the channel
// list: as the slot's base when it is free, or as a layer over what it holds. The SDK header
// supplies the back and close controls of a channel beside the primary one, so the sidebar toggle
// is left out.
export const SecondChannelPanel = ({ channel }: { channel: StreamChannel }) => {
  const virtualized = useVirtualizedMessageList();
  const memberDetailClickHandlers = useMemberDetailClickHandlers(channel);

  return (
    <WithComponents overrides={{ TypingIndicator }}>
      <Channel channel={channel}>
        <WithDragAndDropUpload className='str-chat__dropzone-root--thread'>
          <ChannelHeader Avatar={ConfiguredAvatarWithChannelDetail} />
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
              focus
            />
            <ChannelPreviewOverlay />
          </div>
        </WithDragAndDropUpload>
      </Channel>
    </WithComponents>
  );
};
