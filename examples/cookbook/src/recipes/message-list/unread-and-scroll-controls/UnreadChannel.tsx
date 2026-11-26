import type { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageComposer, MessageList } from 'stream-chat-react';
import { WithUnreadControls } from './UnreadControls';

export const UnreadChannel = ({ channel }: { channel: StreamChannel }) => (
  <WithUnreadControls>
    <Channel channel={channel}>
      <MessageList />
      <MessageComposer />
    </Channel>
  </WithUnreadControls>
);
