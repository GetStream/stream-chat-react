import {
  ChannelHeader,
  ChannelNavigation,
  MessageComposer,
  MessageList,
} from 'stream-chat-react';
import { ChannelSlot } from 'stream-chat-react/slot-layout';
import type { RecipeConfig } from '../../../base/recipe';
import { ThreadPanel } from './ThreadPanel';

// The base app's channels view, with ThreadPanel in the thread's place.
const ChannelsView = () => (
  <>
    <ChannelNavigation />
    <ChannelSlot slot='channel'>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </ChannelSlot>
    <ThreadPanel />
  </>
);

const recipe: RecipeConfig = { chatViewProps: { views: { channels: <ChannelsView /> } } };

export default recipe;
