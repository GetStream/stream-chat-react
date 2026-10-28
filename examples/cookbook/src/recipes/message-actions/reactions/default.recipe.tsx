import type { RecipeConfig } from '../../../base/recipe';
import { SimulateMessageStates } from './SimulateMessageStates';
import { WithCustomMessageUi } from './WithCustomMessageUi';

// The complete example: the custom message with the action bar, quick reactions and reactions.
const recipe: RecipeConfig = {
  chatViewChildren: <SimulateMessageStates deleted />,
  Wrapper: WithCustomMessageUi,
};

export default recipe;
