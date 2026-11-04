import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { SimulateSearch } from './SimulateSearch';
import { ChannelsView, layouts } from './Workspace';

// "Render search outside ChannelList": search in a top bar, the channel lists in the sidebar.
// SimulateSearch only serves the screenshot.
const Wrapper = ({ children }: PropsWithChildren) => (
  <>
    <SimulateSearch />
    {children}
  </>
);

const recipe: RecipeConfig = {
  chatViewProps: { layouts, views: { channels: <ChannelsView /> } },
  Wrapper,
};

export default recipe;
