import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { CustomSuggestionList } from './CustomSuggestionList';
import './CustomSuggestionList.css';

const overrides = { AutocompleteSuggestionList: CustomSuggestionList };

export const WithCustomSuggestionList = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
