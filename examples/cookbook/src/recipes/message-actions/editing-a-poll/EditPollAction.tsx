import { createContext, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { Poll, PollState } from 'stream-chat';
import type { MessageActionSetItem } from 'stream-chat-react';
import {
  ContextMenuButton,
  defaultMessageActionSet,
  MessageActions,
  useChannel,
  useChatContext,
  useComponentContextIcons,
  useContextMenuContext,
  useMessageContext,
  useStateStore,
  useThreadContext,
  WithComponents,
} from 'stream-chat-react';
import { EditPollDialog } from './EditPollDialog';
import type { EditPollTarget } from './EditPollDialog';

// The menu closes, and its items unmount, before the dialog opens, so the dialog lives above the
// message list and the action only says which poll to open it for.
const OpenEditPollContext = createContext<(target: EditPollTarget) => void>(
  () => undefined,
);

const pollSelector = ({ created_by_id, is_closed }: PollState) => ({
  created_by_id,
  is_closed,
});

/** Only on a poll the user created, while it's open. */
const useEditablePoll = (): Poll | undefined => {
  const { client } = useChatContext();
  const { message } = useMessageContext();
  const poll = message.poll_id ? client.polls.fromState(message.poll_id) : undefined;
  const state = useStateStore(poll?.state, pollSelector);
  const isEditable = !!state && !state.is_closed && state.created_by_id === client.userId;
  return isEditable ? poll : undefined;
};

const EditPollActionItem = () => {
  const { IconEdit } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();
  const { message } = useMessageContext();
  const channel = useChannel();
  const thread = useThreadContext();
  const openEditPoll = useContext(OpenEditPollContext);
  const poll = useEditablePoll();

  if (!poll) return null;

  return (
    <ContextMenuButton
      Icon={IconEdit}
      onClick={() => {
        closeMenu();
        openEditPoll({
          // Not `handleDelete` from `MessageContext`: it reports a failure as a notification and
          // resolves, so the dialog couldn't tell. `messageOperations.delete()` rejects instead.
          deleteMessage: () =>
            (thread ?? channel).messageOperations.delete({ localMessage: message }),
          poll,
        });
      }}
    >
      Edit poll
    </ContextMenuButton>
  );
};

// Declared once: the base filter recomputes whenever it gets a new list.
const messageActionSet: MessageActionSetItem[] = [
  ...defaultMessageActionSet,
  { Component: EditPollActionItem, placement: 'dropdown', type: 'editPoll' },
];

const MessageActionsWithEditPoll = () => (
  <MessageActions messageActionSet={messageActionSet} />
);

const overrides = { MessageActions: MessageActionsWithEditPoll };

/** Adds Edit poll to the message actions, and renders the one dialog it opens. */
export const WithEditPoll = ({ children }: PropsWithChildren) => {
  const [target, setTarget] = useState<EditPollTarget>();

  return (
    <OpenEditPollContext.Provider value={setTarget}>
      <WithComponents overrides={overrides}>{children}</WithComponents>
      <EditPollDialog onClose={() => setTarget(undefined)} target={target} />
    </OpenEditPollContext.Provider>
  );
};
