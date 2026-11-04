import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { EditFromUrl } from './EditFromUrl';
import { WithInlineMessageEditing } from './WithInlineMessageEditing';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithInlineMessageEditing>
    <EditFromUrl />
    {children}
  </WithInlineMessageEditing>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
