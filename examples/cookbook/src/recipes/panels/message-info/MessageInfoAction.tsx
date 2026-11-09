import type { PropsWithChildren } from 'react';
import type { MessageActionSetItem } from 'stream-chat-react';
import {
  ContextMenuButton,
  defaultMessageActionSet,
  MessageActions,
  useComponentContextIcons,
  useContextMenuContext,
  useMessageContext,
  WithComponents,
} from 'stream-chat-react';
import { useSidePanel } from '../../../base/SidePanel';
import { MessageInfo } from './MessageInfoPanel';

const MessageInfoAction = () => {
  const { IconInfo } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { isMyMessage, message } = useMessageContext();
  const { openSidePanel } = useSidePanel();

  // Only the user's own messages, and only in the channel: threads have no receipts yet.
  if (!isMyMessage() || message.parent_id) return null;

  return (
    <ContextMenuButton
      Icon={IconInfo}
      onClick={() => {
        // Only the ids: the panel reads the message from the channel, so it stays current.
        openSidePanel({
          body: <MessageInfo cid={message.cid} messageId={message.id} />,
          id: `message-info:${message.id}`,
          title: 'Message info',
        });
        closeMenu();
      }}
    >
      Info
    </ContextMenuButton>
  );
};

// Declared once: the base filter recomputes whenever it gets a new list. Info goes just above
// Delete, so the destructive action stays last.
const infoAction: MessageActionSetItem = {
  Component: MessageInfoAction,
  placement: 'dropdown',
  type: 'info',
};
const messageActionSet = defaultMessageActionSet.flatMap((item) =>
  'type' in item && item.type === 'delete' ? [infoAction, item] : [item],
);

const MessageActionsWithInfo = () => (
  <MessageActions messageActionSet={messageActionSet} />
);

const overrides = { MessageActions: MessageActionsWithInfo };

export const WithMessageInfoAction = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
