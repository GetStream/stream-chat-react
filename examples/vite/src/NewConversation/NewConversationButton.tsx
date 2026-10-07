import { useCallback, useState } from 'react';
import { GlobalModal, IconPlus } from 'stream-chat-react';
import { ChatViewSelectorButton } from 'stream-chat-react/slot-layout';

import { NewConversationDialog } from './NewConversationDialog';

/** Sidebar entry that opens the new conversation dialog. */
export const NewConversationButton = ({ iconOnly = true }: { iconOnly?: boolean }) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <ChatViewSelectorButton
        aria-label='Start a new conversation'
        className='app__new-conversation-button'
        iconOnly={iconOnly}
        onClick={() => setOpen(true)}
        text='New conversation'
      >
        <IconPlus />
      </ChatViewSelectorButton>
      <GlobalModal onClose={close} open={open}>
        {open && <NewConversationDialog onClose={close} />}
      </GlobalModal>
    </>
  );
};
