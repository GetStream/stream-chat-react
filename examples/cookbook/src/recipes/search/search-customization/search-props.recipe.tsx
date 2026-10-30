import type { RecipeConfig } from '../../../base/recipe';
import { WithSidebarSearch } from './SidebarSearch';

// "Configure search through WithComponents": the sidebar's Search with props of its own.
const recipe: RecipeConfig = { Wrapper: WithSidebarSearch };

export default recipe;
