import { ChannelNavigation, ThreadList } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { BrowserBack } from './BrowserBack';
import { deriveWorkspaceNavigation, layouts, SinglePane, slotRenderers } from './views';

const recipe: RecipeConfig = {
  chatViewChildren: <BrowserBack />,
  chatViewProps: {
    deriveWorkspaceNavigation,
    layouts,
    slotRenderers,
    views: {
      channels: <SinglePane list={<ChannelNavigation />} />,
      threads: <SinglePane list={<ThreadList />} />,
    },
  },
};

export default recipe;
