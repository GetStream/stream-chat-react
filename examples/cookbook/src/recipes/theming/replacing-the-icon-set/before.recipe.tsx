import type { RecipeConfig } from '../../../base/recipe';
import { OpenMenuFromUrl } from './OpenMenuFromUrl';

// For the "before" screenshot: the base app with the SDK's own icons and the same menu open.
const recipe: RecipeConfig = { chatViewChildren: <OpenMenuFromUrl /> };

export default recipe;
