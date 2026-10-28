import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import { TypeFromUrl } from './TypeFromUrl';
import { WithCustomSuggestionList } from './WithCustomSuggestionList';

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithCustomSuggestionList>
    <TypeFromUrl />
    {children}
  </WithCustomSuggestionList>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
