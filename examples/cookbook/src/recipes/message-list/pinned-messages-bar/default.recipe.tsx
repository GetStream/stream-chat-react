import type { RecipeConfig } from '../../../base/recipe';
import { ChannelHeaderWithPinnedBar } from './ChannelHeaderWithPinnedBar';
import { ClickPinnedBarFromUrl } from './ClickPinnedBarFromUrl';

// ClickPinnedBarFromUrl only serves the screenshot: it clicks the bar.
const recipe: RecipeConfig = {
  ChannelHeader: ChannelHeaderWithPinnedBar,
  chatViewChildren: <ClickPinnedBarFromUrl />,
};

export default recipe;
