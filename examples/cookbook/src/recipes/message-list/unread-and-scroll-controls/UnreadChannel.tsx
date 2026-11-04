import type { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageComposer, MessageList } from 'stream-chat-react';
import { WithUnreadControls } from './UnreadControls';

// The separator already says where the new messages start, so the list adds no date separator
// above them.
export const UnreadChannel = ({ channel }: { channel: StreamChannel }) => (
  <WithUnreadControls>
    <Channel channel={channel}>
      <MessageList hideNewMessageSeparator />
      <MessageComposer />
    </Channel>
  </WithUnreadControls>
);
