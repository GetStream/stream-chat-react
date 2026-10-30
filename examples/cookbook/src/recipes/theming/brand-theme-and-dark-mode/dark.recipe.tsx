import type { RecipeConfig } from '../../../base/recipe';
import { loadFont } from './loadFont';
import './theme.css';

loadFont();

// The dark theme, from the same theme.css.
const recipe: RecipeConfig = { theme: 'str-chat__theme-dark' };

export default recipe;
