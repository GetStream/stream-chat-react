import type { RecipeConfig } from '../../../base/recipe';
import { NavRailWithDrafts } from './DraftsButton';
import { OpenDraftsFromUrl } from './OpenDraftsFromUrl';

// A Drafts button in the navigation rail that opens the user's drafts in the side panel.
// OpenDraftsFromUrl only serves the screenshots.
const recipe: RecipeConfig = {
  chatProps: (client) => {
    // Drafts are off by default. On, every composer saves, restores and clears its draft.
    client.config.set({ messageComposer: { drafts: { enabled: true } } });
    return {};
  },
  chatViewChildren: (
    <>
      <NavRailWithDrafts />
      <OpenDraftsFromUrl />
    </>
  ),
};

export default recipe;
