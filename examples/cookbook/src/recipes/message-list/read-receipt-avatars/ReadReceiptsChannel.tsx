import type { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageComposer, MessageList } from 'stream-chat-react';
import { WithReadReceiptAvatars } from './ReadReceiptAvatars';

export const ReadReceiptsChannel = ({ channel }: { channel: StreamChannel }) => (
  <WithReadReceiptAvatars>
    <Channel channel={channel}>
      <MessageList />
      <MessageComposer />
    </Channel>
  </WithReadReceiptAvatars>
);
