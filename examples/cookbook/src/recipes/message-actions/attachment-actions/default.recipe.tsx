import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { ClickVoteLocally } from './ClickVoteLocally';
import { installVoteActions } from './installVoteActions';
import { WithVoteAttachments } from './VoteAttachment';

const VoteActionsSetup = () => {
  const { client } = useChatContext();
  useEffect(() => installVoteActions(client), [client]);
  return null;
};

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithVoteAttachments>
    <VoteActionsSetup />
    <ClickVoteLocally />
    {children}
  </WithVoteAttachments>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
