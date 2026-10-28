import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { WithCustomComposer } from './WithCustomComposer';
import { PrefillComposer } from './PrefillComposer';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithCustomComposer>
    <PrefillComposer />
    {children}
  </WithCustomComposer>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
