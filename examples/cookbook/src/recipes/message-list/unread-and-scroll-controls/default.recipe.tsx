import type { RecipeConfig } from '../../../base/recipe';
import { UnreadScreenshotHelpers } from './ScreenshotHelpers';

// The SDK's own separator, banner and scroll-to-latest button, for comparison.
const recipe: RecipeConfig = { chatViewChildren: <UnreadScreenshotHelpers /> };

export default recipe;
