import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { DemoPollShots } from './DemoPollShots';
import { WithPollWithText } from './WithPollWithText';

// The base app's channels view renders the channel, so the wrapper goes around it.
// DemoPollShots only serves the screenshots.
const Wrapper = ({ children }: PropsWithChildren) => (
  <WithPollWithText>
    <DemoPollShots />
    {children}
  </WithPollWithText>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
