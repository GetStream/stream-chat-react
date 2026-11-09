import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoProductShots } from './DemoProductShots';

// The SDK's defaults, for the "before" screenshots: no overrides.
const Wrapper = ({ children }: PropsWithChildren) => (
  <>
    <DemoProductShots />
    {children}
  </>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
