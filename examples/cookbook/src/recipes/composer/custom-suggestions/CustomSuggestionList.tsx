import type { MentionSuggestion } from 'stream-chat';
import type {
  SuggestionListItemComponentProps,
  SuggestionListProps,
  UserItemProps,
} from 'stream-chat-react';
import {
  Avatar,
  defaultComponents,
  MentionItem,
  SuggestionList,
} from 'stream-chat-react';

const CustomUserItem = ({
  className,
  entity,
  // Kept off the button: the list already gives the focused row its class.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  focused,
  ...buttonProps
}: UserItemProps) => {
  const title = entity.name ?? entity.id;
  if (!title) return null;

  return (
    <button
      {...buttonProps}
      // Keeps the classes the list passes, such as the one for the focused row.
      className={`${className ?? ''} cookbook-suggestion-row`}
      type='button'
    >
      <Avatar imageUrl={entity.image} size='sm' userName={title} />
      <span>{title}</span>
    </button>
  );
};

const CustomMentionItem = (props: SuggestionListItemComponentProps) => (
  <MentionItem
    {...props}
    entity={props.entity as MentionSuggestion}
    UserItem={CustomUserItem}
  />
);

const rows = { ...defaultComponents, '@': CustomMentionItem };

export const CustomSuggestionList = (props: SuggestionListProps) => (
  <SuggestionList {...props} suggestionItemComponents={rows} />
);
