import type { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageComposer, MessageList } from 'stream-chat-react';
import { WithPollWithText } from './WithPollWithText';

export const PollChannel = ({ channel }: { channel: StreamChannel }) => (
  <WithPollWithText>
    <Channel channel={channel}>
      <MessageList />
      <MessageComposer />
    </Channel>
  </WithPollWithText>
);
