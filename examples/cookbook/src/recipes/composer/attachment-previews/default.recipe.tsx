import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoAttachments } from './DemoAttachments';
import { WithSquareImagePreviews } from './WithSquareImagePreviews';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithSquareImagePreviews>
    <DemoAttachments />
    {children}
  </WithSquareImagePreviews>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
