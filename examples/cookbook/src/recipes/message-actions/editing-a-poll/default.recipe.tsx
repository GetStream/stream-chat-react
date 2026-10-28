import { MessageList } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { WithEditPoll } from './EditPollAction';
import { OpenEditPollFromUrl } from './OpenEditPollFromUrl';
import { ShowPollLocally } from './ShowPollLocally';

// The screenshot helpers need the channel, so they render inside `Channel`, next to the list.
const MessageListWithLocalPoll = () => (
  <>
    <ShowPollLocally />
    <OpenEditPollFromUrl />
    <MessageList />
  </>
);

const recipe: RecipeConfig = {
  MessageList: MessageListWithLocalPoll,
  Wrapper: WithEditPoll,
};

export default recipe;
