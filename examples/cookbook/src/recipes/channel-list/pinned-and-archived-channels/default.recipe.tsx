import type { PropsWithChildren } from 'react';
import { channelFilters } from '../../../base/client';
import type { RecipeConfig } from '../../../base/recipe';
import { SectionedChannelNavigation } from './SectionedChannelNavigation';
import { SimulateSections } from './SimulateSections';

// "Pinned and archived channels": the channel list split into Pinned, Archived and Channels, on
// paginators the recipe registers itself, scoped to the cookbook's channels. SimulateSections only
// serves the screenshots.
const Navigation = () => <SectionedChannelNavigation filters={channelFilters} />;

const Wrapper = ({ children }: PropsWithChildren) => (
  <>
    <SimulateSections />
    {children}
  </>
);

const recipe: RecipeConfig = {
  ChannelNavigation: Navigation,
  registerChannelPaginator: false,
  Wrapper,
};

export default recipe;
