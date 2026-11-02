import { ChannelHeader, useChatContext } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { ChannelChip } from './ChannelChip';
import './recent-strip.css';

// "Using display helpers": a "Recent" strip of ChannelChips under the channel header. The channel
// list loads these same channel instances, so the chips fill in once it has queried them.
const recentChannelIds = ['docs-v15-cb-trip', 'docs-v15-cb-books', 'docs-v15-cb-garden'];

const HeaderWithRecentChannels = () => {
  const { client } = useChatContext();

  return (
    <div className='cookbook-recent-channels-demo'>
      <ChannelHeader />
      <div className='cookbook-recent-channels'>
        {recentChannelIds.map((id) => (
          <ChannelChip channel={client.channel('messaging', id)} key={id} />
        ))}
      </div>
    </div>
  );
};

const recipe: RecipeConfig = { ChannelHeader: HeaderWithRecentChannels };

export default recipe;
