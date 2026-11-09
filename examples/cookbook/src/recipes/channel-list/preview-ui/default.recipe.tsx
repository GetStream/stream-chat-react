import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { WithCompactChannelRows } from './CompactChannelRow';
import { SimulateUnread } from './SimulateUnread';

// "Custom channel preview": every row of the channel list rendered by CompactChannelRow.
// SimulateUnread only serves the screenshot of the unread badge.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithCompactChannelRows>
    <SimulateUnread />
    {children}
  </WithCompactChannelRows>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
