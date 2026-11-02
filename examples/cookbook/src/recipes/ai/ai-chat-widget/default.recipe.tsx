import type { RecipeConfig } from '../../../base/recipe';
import { AssistantWidget } from './AssistantWidget';
import { ChannelsWithoutAssistant } from './ChannelsWithoutAssistant';
import { isMessageAIGenerated } from './isMessageAIGenerated';
import { OpenWidgetFromUrl } from './OpenWidgetFromUrl';

// The user's channel with the assistant, from this recipe's demo-data.json.
const ASSISTANT_CHANNEL_ID = 'docs-v15-cb-widget-assistant';

// A chat bubble at the bottom right of the base app that opens the user's channel with the
// assistant. The channel list leaves that channel out. OpenWidgetFromUrl only serves the
// screenshots.
const recipe: RecipeConfig = {
  chatProps: () => ({ isMessageAIGenerated }),
  chatViewChildren: (
    <>
      <ChannelsWithoutAssistant channelId={ASSISTANT_CHANNEL_ID} />
      <AssistantWidget channelId={ASSISTANT_CHANNEL_ID} />
      <OpenWidgetFromUrl />
    </>
  ),
  registerChannelPaginator: false,
};

export default recipe;
