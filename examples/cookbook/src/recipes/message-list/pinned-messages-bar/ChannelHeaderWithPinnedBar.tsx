import { ChannelHeader } from 'stream-chat-react';
import { PinnedMessagesBar } from './PinnedMessagesBar';

// Rendered where the channel header goes, inside the channel, so the bar sits right under it.
export const ChannelHeaderWithPinnedBar = () => (
  <>
    <ChannelHeader />
    <PinnedMessagesBar />
  </>
);
