import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { WithCompactChannelResults } from './CompactChannelResults';
import { SimulateSearch } from './SimulateSearch';

// "Customize search result items": channel results as compact rows. SimulateSearch only serves
// the screenshot.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithCompactChannelResults>
    <SimulateSearch />
    {children}
  </WithCompactChannelResults>
);

const recipe: RecipeConfig = {
  Wrapper,
};

export default recipe;
