import type { MentionSuggestion } from 'stream-chat';
import type {
  SuggestionListItemComponentProps,
  UserGroupItemProps,
} from 'stream-chat-react';
import { MentionItem } from 'stream-chat-react';

const CustomUserGroupItem = ({
  className,
  entity,
  // Kept off the button: the list already gives the focused row its class.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  focused,
  ...buttonProps
}: UserGroupItemProps) => (
  <button
    {...buttonProps}
    className={`${className ?? ''} cookbook-suggestion-row`}
    type='button'
  >
    👥 {entity.name}
  </button>
);

export const GroupMentionItem = (props: SuggestionListItemComponentProps) => (
  <MentionItem
    {...props}
    entity={props.entity as MentionSuggestion}
    UserGroupItem={CustomUserGroupItem}
  />
);
