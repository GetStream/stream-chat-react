import type { RecipeConfig } from '../../../base/recipe';
import { WithMessageInfoAction } from './MessageInfoAction';
import { OpenInfoFromUrl } from './OpenInfoFromUrl';

// OpenInfoFromUrl only serves the screenshot: it picks Info in a message's menu.
const recipe: RecipeConfig = {
  chatViewChildren: <OpenInfoFromUrl />,
  Wrapper: WithMessageInfoAction,
};

export default recipe;
