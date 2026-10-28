import type { RecipeConfig } from '../../../base/recipe';
import { WithPinnedByIndicator } from './PinnedByIndicator';

// "Component based solution": who pinned the message, when, and an Unpin button.
const recipe: RecipeConfig = { Wrapper: WithPinnedByIndicator };

export default recipe;
