import type { RecipeConfig } from '../../../base/recipe';
import { SimulatePresence } from '../../channel-list/members-and-online-status/SimulatePresence';
import './channel-details-theme.css';
import { ChannelHeaderWithDetails } from './ChannelHeaderWithDetails';
import { OpenDetailsFromUrl } from './OpenDetailsFromUrl';

// SimulatePresence and OpenDetailsFromUrl only serve the screenshots: they bring some members
// online and open the panel.
const recipe: RecipeConfig = {
  ChannelHeader: ChannelHeaderWithDetails,
  chatViewChildren: <OpenDetailsFromUrl />,
  Wrapper: SimulatePresence,
};

export default recipe;
