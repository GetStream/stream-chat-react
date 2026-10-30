import type { RecipeConfig } from '../../../base/recipe';
import { WithNewConversation } from './NewConversationButton';
import { SimulateNewConversation } from './SimulateNewConversation';

// A New conversation button in the channel list header. SimulateNewConversation only serves the
// screenshots: it sits inside ChatView, where the open channels are known.
const recipe: RecipeConfig = {
  chatViewChildren: <SimulateNewConversation />,
  Wrapper: WithNewConversation,
};

export default recipe;
