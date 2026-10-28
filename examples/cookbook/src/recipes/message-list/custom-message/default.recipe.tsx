import type { RecipeConfig } from '../../../base/recipe';
import { SimulateMessageStates } from './SimulateMessageStates';
import { WithCustomMessageUi } from './WithCustomMessageUi';

// The complete component: formatted text, metadata, grouping and the deleted placeholder.
const recipe: RecipeConfig = {
  chatViewChildren: <SimulateMessageStates deleted />,
  Wrapper: WithCustomMessageUi,
};

export default recipe;
