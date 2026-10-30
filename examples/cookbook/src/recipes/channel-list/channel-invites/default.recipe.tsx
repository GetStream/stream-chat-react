import type { PropsWithChildren } from 'react';
import { channelFilters } from '../../../base/client';
import type { RecipeConfig } from '../../../base/recipe';
import { SimulateInvites } from './SimulateInvites';
import { WithChannelInvites } from './WithChannelInvites';

// "Channel invites": an Invitations section above the channel list, whose channel list holds only
// the channels the user joined. The recipe registers that list's paginator itself, scoped to the
// cookbook's channels. SimulateInvites only serves the screenshots.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithChannelInvites filters={channelFilters}>
    <SimulateInvites />
    {children}
  </WithChannelInvites>
);

const recipe: RecipeConfig = {
  registerChannelPaginator: false,
  Wrapper,
};

export default recipe;
