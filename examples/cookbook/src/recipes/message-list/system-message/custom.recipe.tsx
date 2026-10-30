import type { RecipeConfig } from '../../../base/recipe';
import { AddLocalSystemMessage } from './AddLocalSystemMessage';
import { WithCustomSystemMessages } from './CustomSystemMessage';

// "Custom system message component": the event, who triggered it, and when.
const recipe: RecipeConfig = {
  chatViewChildren: <AddLocalSystemMessage />,
  Wrapper: WithCustomSystemMessages,
};

export default recipe;
