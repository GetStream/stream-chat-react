import type { RecipeConfig } from '../../../base/recipe';
import { UnreadScreenshotHelpers } from './ScreenshotHelpers';
import { WithUnreadControls } from './UnreadControls';

// "Replace one part": a separator line with a Mark as read link, and an accent banner.
const recipe: RecipeConfig = {
  chatViewChildren: <UnreadScreenshotHelpers />,
  Wrapper: WithUnreadControls,
};

export default recipe;
