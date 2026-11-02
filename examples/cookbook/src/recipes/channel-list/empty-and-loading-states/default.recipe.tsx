import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { WithNewConversation } from '../starting-a-conversation/NewConversationButton';
import { SimulateChannelListState } from './SimulateChannelListState';
import { WithChannelListStates } from './WithChannelListStates';

// The empty list's button opens the New conversation dialog, so the recipe builds on Starting a
// conversation, which registers the handler that creates a new conversation on its first send.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithNewConversation>
    <WithChannelListStates>{children}</WithChannelListStates>
  </WithNewConversation>
);

// SimulateChannelListState only serves the screenshots.
const recipe: RecipeConfig = {
  chatViewChildren: <SimulateChannelListState />,
  Wrapper,
};

export default recipe;
