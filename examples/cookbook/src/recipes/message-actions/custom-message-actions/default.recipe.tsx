import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { WithCustomMessageActions } from './CustomMessageActions';
import { OpenMenuFromUrl } from './OpenMenuFromUrl';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithCustomMessageActions>
    <OpenMenuFromUrl />
    {children}
  </WithCustomMessageActions>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
