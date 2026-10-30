import type { RecipeConfig } from '../../../base/recipe';
import { AddLocalSystemMessage } from './AddLocalSystemMessage';

// "Default system message component": the SDK's EventComponent, unchanged.
const recipe: RecipeConfig = { chatViewChildren: <AddLocalSystemMessage /> };

export default recipe;
