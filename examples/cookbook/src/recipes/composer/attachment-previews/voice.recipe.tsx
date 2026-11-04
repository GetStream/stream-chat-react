import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoAttachments } from './DemoAttachments';
import { WithVoicePreview } from './VoiceRecordingPreview';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithVoicePreview>
    <DemoAttachments />
    {children}
  </WithVoicePreview>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
