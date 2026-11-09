import type { RecipeConfig } from '../../../base/recipe';
import { OpenMenuFromUrl } from './OpenMenuFromUrl';
import { WithLucideIcons } from './WithLucideIcons';

// Every SDK icon replaced with its Lucide counterpart. OpenMenuFromUrl only serves the screenshot.
const recipe: RecipeConfig = {
  chatViewChildren: <OpenMenuFromUrl />,
  Wrapper: WithLucideIcons,
};

export default recipe;
