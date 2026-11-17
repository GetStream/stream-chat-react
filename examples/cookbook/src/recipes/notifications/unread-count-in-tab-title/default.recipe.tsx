import type { RecipeConfig } from '../../../base/recipe';
import { UnreadCountInTitle } from './UnreadCountInTitle';

// The count belongs to the user, not to the open channel, so the component sits beside the
// views, inside Chat, and keeps counting whichever view or channel is open.
const recipe: RecipeConfig = {
  chatViewChildren: <UnreadCountInTitle appTitle='UI Cookbook' />,
};

export default recipe;
