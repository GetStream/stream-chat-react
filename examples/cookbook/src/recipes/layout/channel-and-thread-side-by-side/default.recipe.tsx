import type { RecipeConfig } from '../../../base/recipe';
import { ChannelsView, layouts, ThreadsView, viewActionSlotResolvers } from './views';

const recipe: RecipeConfig = {
  chatViewProps: {
    layouts,
    viewActionSlotResolvers,
    views: { channels: <ChannelsView />, threads: <ThreadsView /> },
  },
};

export default recipe;
