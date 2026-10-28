import type { SuggestionListProps } from 'stream-chat-react';
import { SuggestionList } from 'stream-chat-react';
import './StyledSuggestionList.css';

export const StyledSuggestionList = (props: SuggestionListProps) => (
  <SuggestionList {...props} className='cookbook-suggestion-list' />
);
