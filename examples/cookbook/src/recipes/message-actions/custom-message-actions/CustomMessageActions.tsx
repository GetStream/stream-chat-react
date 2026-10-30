import type { PropsWithChildren } from 'react';
import type { MessageActionSetItem } from 'stream-chat-react';
import {
  ContextMenuButton,
  defaultMessageActionSet,
  MessageActions,
  QuickMessageActionsButton,
  useComponentContextIcons,
  useContextMenuContext,
  useMessageContext,
  WithComponents,
} from 'stream-chat-react';

const YellAction = () => {
  const { IconMegaphone } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { message } = useMessageContext();

  if (!message.text) return null;

  return (
    <ContextMenuButton
      Icon={IconMegaphone}
      onClick={() => {
        window.alert(message.text?.toUpperCase());
        closeMenu();
      }}
    >
      Yell
    </ContextMenuButton>
  );
};

const CopyIdAction = () => {
  const { IconCopy } = useComponentContextIcons();
  const { message } = useMessageContext();

  return (
    <QuickMessageActionsButton
      aria-label='Copy message ID'
      onClick={() => void navigator.clipboard.writeText(message.id)}
    >
      <IconCopy />
    </QuickMessageActionsButton>
  );
};

const hiddenTypes = new Set(['blockUser', 'markUnread']);

// Declared once: the base filter recomputes whenever it gets a new list.
const messageActionSet: MessageActionSetItem[] = [
  // The "more" button has no type, so it's kept explicitly.
  ...defaultMessageActionSet.filter(
    (item) => item.placement === 'quick-dropdown-toggle' || !hiddenTypes.has(item.type),
  ),
  { Component: CopyIdAction, placement: 'quick', type: 'copyId' },
  { Component: YellAction, placement: 'dropdown', type: 'yell' },
];

const CustomMessageActions = () => <MessageActions messageActionSet={messageActionSet} />;

const overrides = { MessageActions: CustomMessageActions };

export const WithCustomMessageActions = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
