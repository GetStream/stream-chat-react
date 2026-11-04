import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoAttachments } from './DemoAttachments';
import { WithEventPreviews } from './CustomAttachmentPreviewList';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithEventPreviews>
    <DemoAttachments />
    {children}
  </WithEventPreviews>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
