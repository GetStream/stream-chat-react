import type { PropsWithChildren } from 'react';
import { ChannelSearchSource, MessageSearchSource, UserSearchSource } from 'stream-chat';
import { visibleChannelIds } from '../../../base/client';
import demoData from '../../../base/demo-data.json';
import type { RecipeConfig } from '../../../base/recipe';
import { createSearchController } from './searchController';
import { WithSearchDialog } from './SearchDialogButton';
import { SimulateSearchDialog } from './SimulateSearchDialog';

// A search button above the channel list that opens a search dialog. SimulateSearchDialog only
// serves the screenshots.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithSearchDialog>
    <SimulateSearchDialog />
    {children}
  </WithSearchDialog>
);

const recipe: RecipeConfig = {
  chatProps: (client) => {
    const searchController = createSearchController(client);
    // Keeps the search to the cookbook's own channels and cast, as the base app's controller does,
    // so other data in the shared demo app never shows up.
    for (const source of searchController.sources) {
      if (source instanceof ChannelSearchSource) {
        source.filters = { id: { $in: visibleChannelIds } };
      } else if (source instanceof UserSearchSource) {
        source.filters = { id: { $in: demoData.users.map((user) => user.id) } };
      } else if (source instanceof MessageSearchSource) {
        source.messageSearchChannelFilters = { id: { $in: visibleChannelIds } };
      }
    }
    return { searchController };
  },
  Wrapper,
};

export default recipe;
