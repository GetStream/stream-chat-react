import type { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageComposer, MessageList } from 'stream-chat-react';
import { WithGifPicker } from './WithGifPicker';

export const GifChannel = ({ channel }: { channel: StreamChannel }) => (
  <WithGifPicker>
    <Channel channel={channel}>
      <MessageList />
      <MessageComposer />
    </Channel>
  </WithGifPicker>
);
