import type { RecipeConfig } from '../../../base/recipe';
import { OpenSavedItemsFromUrl } from './OpenSavedItemsFromUrl';
import { WithSavedItemsButton } from './SavedItemsButton';

// A Saved items button in the channel list header that opens the user's reminders and saved
// messages in the side panel. OpenSavedItemsFromUrl only serves the screenshots.
const recipe: RecipeConfig = {
  chatViewChildren: <OpenSavedItemsFromUrl />,
  Wrapper: WithSavedItemsButton,
};

export default recipe;
