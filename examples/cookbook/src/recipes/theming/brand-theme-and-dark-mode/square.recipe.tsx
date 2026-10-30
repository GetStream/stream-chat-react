import type { RecipeConfig } from '../../../base/recipe';
import { loadFont } from './loadFont';
import './theme.css';
import './square.css';

loadFont();

// A theme of your own on top of the brand theme: square corners.
const recipe: RecipeConfig = { theme: 'messaging light str-chat__theme-square' };

export default recipe;
