import type { RecipeConfig } from '../../../base/recipe';
import { createChannelHeaderWithAddMembers } from './ChannelHeaderWithAddMembers';
import { OpenHistoryDialog } from './OpenHistoryDialog';

// Dan isn't in Weekend trip, the channel the shot opens.
const ChannelHeaderWithAddMembers = createChannelHeaderWithAddMembers([
  'docs-v15-ck-dan',
]);

const recipe: RecipeConfig = {
  ChannelHeader: ChannelHeaderWithAddMembers,
  chatViewChildren: <OpenHistoryDialog />,
};

export default recipe;
