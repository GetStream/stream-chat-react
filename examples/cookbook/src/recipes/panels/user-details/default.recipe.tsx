import type { RecipeConfig } from '../../../base/recipe';
import { SimulatePresence } from '../../channel-list/members-and-online-status/SimulatePresence';
import { MessageListWithUserDetails } from './MessageListWithUserDetails';
import { OpenProfileFromUrl } from './OpenProfileFromUrl';
import { UserDetailsPanel } from './UserDetailsPanel';

// A profile in the side panel, opened from an avatar or a mention in the channel or the thread.
// SimulatePresence and OpenProfileFromUrl only serve the screenshots: they bring Bob online and
// open his profile.
const recipe: RecipeConfig = {
  chatViewChildren: <OpenProfileFromUrl />,
  MessageList: MessageListWithUserDetails,
  sidePanelProps: { UserProfile: UserDetailsPanel },
  Wrapper: SimulatePresence,
};

export default recipe;
