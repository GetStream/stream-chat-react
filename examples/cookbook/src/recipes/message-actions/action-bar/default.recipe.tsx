import type { RecipeConfig } from '../../../base/recipe';
import { SimulateMessageStates } from './SimulateMessageStates';
import { WithCustomMessageUi } from './WithCustomMessageUi';

// The custom message with the action bar and the reply count.
const recipe: RecipeConfig = {
  chatViewChildren: <SimulateMessageStates deleted />,
  Wrapper: WithCustomMessageUi,
};

export default recipe;
