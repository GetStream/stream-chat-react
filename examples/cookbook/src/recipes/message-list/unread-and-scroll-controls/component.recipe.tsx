import { MessageList } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { UnreadScreenshotHelpers } from './ScreenshotHelpers';
import { WithUnreadControls } from './UnreadControls';

// "Replace one part": a separator line with a Mark as read link, and an accent banner. The list
// is the one UnreadChannel.tsx renders, without the date separator above the new messages.
const UnreadMessageList = () => <MessageList hideNewMessageSeparator />;

const recipe: RecipeConfig = {
  chatViewChildren: <UnreadScreenshotHelpers />,
  MessageList: UnreadMessageList,
  Wrapper: WithUnreadControls,
};

export default recipe;
