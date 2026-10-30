import type { RecipeConfig } from '../../../base/recipe';
import { LayoutPersistence } from './LayoutPersistence';
import { seedSavedLayout } from './seedSavedLayout';
import { ChannelsView, layouts, ThreadsView } from './views';

seedSavedLayout();

// The first version: the layout is saved in localStorage only.
const recipe: RecipeConfig = {
  chatViewChildren: <LayoutPersistence />,
  chatViewProps: {
    layouts,
    views: { channels: <ChannelsView />, threads: <ThreadsView /> },
  },
  openFromUrl: false,
};

export default recipe;
