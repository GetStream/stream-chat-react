import type { SuggestionItemProps } from 'stream-chat-react';
import { SuggestionListItem } from 'stream-chat-react';

export const CustomAutocompleteSuggestionItem = (props: SuggestionItemProps) => (
  <SuggestionListItem {...props} className='cookbook-suggestion-item' />
);
