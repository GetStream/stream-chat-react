import type { RecipeConfig } from '../../../base/recipe';
import { UnreadScreenshotHelpers } from './ScreenshotHelpers';
import './unread-and-scroll-controls.css';

// "Restyle": the default separator, banner and scroll-to-latest button in the accent color.
const recipe: RecipeConfig = { chatViewChildren: <UnreadScreenshotHelpers /> };

export default recipe;
