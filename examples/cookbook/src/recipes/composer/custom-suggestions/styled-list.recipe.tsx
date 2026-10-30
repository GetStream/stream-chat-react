import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import type { RecipeConfig } from '../../../base/recipe';
import { StyledSuggestionList } from './StyledSuggestionList';
import { TypeFromUrl } from './TypeFromUrl';

const overrides = { AutocompleteSuggestionList: StyledSuggestionList };

const Wrapper = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>
    <TypeFromUrl />
    {children}
  </WithComponents>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
