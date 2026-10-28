import type { RecipeConfig } from '../../../base/recipe';
import { WithMentionsButton } from './MentionsButton';
import { OpenMentionsFromUrl } from './OpenMentionsFromUrl';

// A Mentions button in the channel list header that opens the user's mentions in the side panel.
// OpenMentionsFromUrl only serves the screenshots.
const recipe: RecipeConfig = {
  chatViewChildren: <OpenMentionsFromUrl />,
  Wrapper: WithMentionsButton,
};

export default recipe;
