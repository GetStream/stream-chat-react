import { MessageList } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { ShowGiphyPreviewLocally } from './ShowGiphyPreviewLocally';
import { WithGiphyPreview } from './WithGiphyPreview';

// The preview helper only serves the screenshots. It needs the channel, so it renders inside
// `Channel`, next to the list.
const MessageListWithGiphyPreview = () => (
  <>
    <ShowGiphyPreviewLocally />
    <MessageList />
  </>
);

const recipe: RecipeConfig = {
  MessageList: MessageListWithGiphyPreview,
  Wrapper: WithGiphyPreview,
};

export default recipe;
