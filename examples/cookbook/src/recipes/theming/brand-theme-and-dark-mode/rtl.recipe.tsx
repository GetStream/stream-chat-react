import type { PropsWithChildren } from 'react';
import type { RecipeConfig } from '../../../base/recipe';
import './theme.css';
import './rtl.css';

// A right-to-left layout: `dir` on an element around the chat.
const Wrapper = ({ children }: PropsWithChildren) => (
  <div className='cookbook-rtl' dir='rtl'>
    {children}
  </div>
);

const recipe: RecipeConfig = { Wrapper };

export default recipe;
