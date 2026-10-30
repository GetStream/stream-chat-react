import type { RecipeConfig } from '../../../base/recipe';
import { SimulateCtrlClick } from './SimulateCtrlClick';
import {
  ChannelsView,
  deriveWorkspaceNavigation,
  layouts,
  slotRenderers,
  ThreadsView,
} from './views';

const recipe: RecipeConfig = {
  chatViewChildren: <SimulateCtrlClick />,
  chatViewProps: {
    deriveWorkspaceNavigation,
    layouts,
    slotRenderers,
    views: { channels: <ChannelsView />, threads: <ThreadsView /> },
  },
};

export default recipe;
