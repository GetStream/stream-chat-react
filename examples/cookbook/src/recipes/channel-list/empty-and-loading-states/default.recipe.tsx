import { ChannelNavigation } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { WithNewConversation } from '../starting-a-conversation/NewConversationButton';
import { SimulateChannelListState } from './SimulateChannelListState';
import { WithChannelListStates } from './WithChannelListStates';

const Navigation = () => (
  <WithChannelListStates>
    <ChannelNavigation />
  </WithChannelListStates>
);

// The empty list's button opens the New conversation dialog, so the recipe builds on Starting a
// conversation, which registers the handler that creates a new conversation on its first send.
// SimulateChannelListState only serves the screenshots.
const recipe: RecipeConfig = {
  ChannelNavigation: Navigation,
  chatViewChildren: <SimulateChannelListState />,
  Wrapper: WithNewConversation,
};

export default recipe;
