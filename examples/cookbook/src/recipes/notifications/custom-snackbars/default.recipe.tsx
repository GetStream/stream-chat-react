import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { SimulateSnackbars } from './SimulateSnackbars';
import { WithSnackbars } from './SnackbarStack';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithSnackbars>
    <SimulateSnackbars />
    {children}
  </WithSnackbars>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
