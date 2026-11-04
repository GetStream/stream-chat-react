import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoLocationShots } from './DemoLocationShots';
import { WithLocationMaps } from './WithLocationMaps';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithLocationMaps>
    <DemoLocationShots />
    {children}
  </WithLocationMaps>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
