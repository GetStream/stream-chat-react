import type { RecipeConfig } from '../../../base/recipe';
import { WithReadReceiptAvatars } from './ReadReceiptAvatars';

// Each member's avatar sits under the last message they read. The base app's channels view
// renders the channel, so the wrapper goes around it; ReadReceiptsChannel.tsx is the same
// wrapper around a channel of your own.
const recipe: RecipeConfig = { Wrapper: WithReadReceiptAvatars };

export default recipe;
