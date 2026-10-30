import { ChannelHeader } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { ChannelMembers } from './ChannelMembers';
import { SimulatePresence } from './SimulatePresence';

// The members list renders inside the channel, right under the header. The wrapper element only
// gives the screenshot one element to crop to.
const HeaderWithMembers = () => (
  <div className='cookbook-channel-header-with-members'>
    <ChannelHeader />
    <ChannelMembers />
  </div>
);

// SimulatePresence only serves the screenshot: it brings some members online first.
const recipe: RecipeConfig = {
  ChannelHeader: HeaderWithMembers,
  Wrapper: SimulatePresence,
};

export default recipe;
