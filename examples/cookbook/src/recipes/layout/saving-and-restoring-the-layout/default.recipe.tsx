import type { RecipeConfig } from '../../../base/recipe';
import { LayoutPersistence } from './LayoutPersistenceWithUrl';
import { seedSavedLayout } from './seedSavedLayout';
import { ChannelsView, layouts, ThreadsView } from './views';

seedSavedLayout();

// The final version: saved in localStorage, with the open channel's cid in the URL. The recipe
// reads `?channel=<cid>` itself, so the base app's `?channel=<id>` opener is off.
const recipe: RecipeConfig = {
  chatViewChildren: <LayoutPersistence />,
  chatViewProps: {
    layouts,
    views: { channels: <ChannelsView />, threads: <ThreadsView /> },
  },
  openFromUrl: false,
};

export default recipe;
