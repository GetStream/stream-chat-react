import type { MessageActionSetItem } from 'stream-chat-react';
import {
  ContextMenuButton,
  defaultMessageActionSet,
  MessageActions,
  useComponentContextIcons,
  useContextMenuContext,
  useMessageContext,
} from 'stream-chat-react';
import { useInlineEdit } from './InlineEditContext';

const InlineEditAction = () => {
  const { IconEdit } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { message, threadList = false } = useMessageContext();
  const { startEditing } = useInlineEdit();

  return (
    <ContextMenuButton
      Icon={IconEdit}
      onClick={() => {
        startEditing(message, threadList);
        closeMenu();
      }}
    >
      Edit Message
    </ContextMenuButton>
  );
};

// Declared once: the base filter recomputes whenever it gets a new list. The item keeps the
// `edit` type, so the menu still shows it only to users who can edit the message. The "more"
// button has no type, hence the `in` check.
const messageActionSet: MessageActionSetItem[] = defaultMessageActionSet.map((item) =>
  'type' in item && item.type === 'edit'
    ? { ...item, Component: InlineEditAction }
    : item,
);

export const InlineEditMessageActions = () => (
  <MessageActions messageActionSet={messageActionSet} />
);
