import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { isMessageAIGenerated } from './isMessageAIGenerated';
import { SimulateVoice } from './SimulateVoice';
import { VoiceChannelHeader } from './VoiceChannelHeader';
import { WithVoiceAgent } from './WithVoiceAgent';

// "Voice agent visuals": a voice conversation with the assistant shows under the channel header as
// a glow for the assistant and a wave for the user's microphone, and the reply being spoken shows
// only what the user has heard. SimulateVoice stands in for the voice backend.
const Wrapper = ({ children }: PropsWithChildren) => (
  <SimulateVoice>
    <WithVoiceAgent>{children}</WithVoiceAgent>
  </SimulateVoice>
);

const recipe: RecipeConfig = {
  ChannelHeader: VoiceChannelHeader,
  chatProps: () => ({ isMessageAIGenerated }),
  Wrapper,
};

export default recipe;
