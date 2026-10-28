import type {
  SuggestionListItemComponentProps,
  SuggestionListProps,
} from 'stream-chat-react';
import { defaultComponents, SuggestionList } from 'stream-chat-react';

type Tag = { id: string; name: string };

const TagItem = ({
  className,
  entity,
  // Kept off the button: the list already gives the focused row its class.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  focused,
  ...buttonProps
}: SuggestionListItemComponentProps) => (
  <button
    {...buttonProps}
    className={`${className ?? ''} cookbook-suggestion-row`}
    type='button'
  >
    #{(entity as Tag).name}
  </button>
);

const rows = { ...defaultComponents, '#': TagItem };

export const SuggestionListWithTags = (props: SuggestionListProps) => (
  <SuggestionList {...props} suggestionItemComponents={rows} />
);
