import { useState } from 'react';
import { Button, GlobalModal, IconMessageBubbles, IconPlus } from 'stream-chat-react';
import { NewConversationDialog } from '../starting-a-conversation/NewConversationDialog';
import './ChannelListState.css';

/**
 * Shown in place of the channel list when the user has no conversations. The button opens the same
 * New conversation dialog as the header's button.
 */
export const EmptyChannelList = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className='cookbook-channel-list-state'>
      <div className='cookbook-channel-list-state__icon'>
        <IconMessageBubbles />
      </div>
      <p className='cookbook-channel-list-state__title'>No conversations yet</p>
      <p className='cookbook-channel-list-state__text'>
        Start one with a person or a group, and it shows up here.
      </p>
      <Button
        appearance='solid'
        aria-haspopup='dialog'
        onClick={() => setOpen(true)}
        size='md'
        variant='primary'
      >
        <IconPlus />
        New conversation
      </Button>
      <GlobalModal onClose={close} open={open}>
        {/* Mounted only while open, so every opening starts with an empty dialog. */}
        {open && <NewConversationDialog onClose={close} />}
      </GlobalModal>
    </div>
  );
};
