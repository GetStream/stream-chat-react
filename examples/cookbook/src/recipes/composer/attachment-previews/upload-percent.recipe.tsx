import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoAttachments } from './DemoAttachments';
import { WithUploadPercent } from './UploadPercent';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithUploadPercent>
    <DemoAttachments />
    {children}
  </WithUploadPercent>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
