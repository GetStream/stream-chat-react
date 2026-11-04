import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  Button,
  ChannelListHeader,
  GlobalModal,
  IconPlus,
  useChatContext,
  WithComponents,
} from 'stream-chat-react';
import { NewConversationDialog } from './NewConversationDialog';
import { createOnFirstSend } from './startConversation';
import './NewConversationButton.css';

/** The default channel list header, with a button beside it that opens the dialog. */
const ChannelListHeaderWithButton = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className='cookbook-channel-list-header'>
      <div className='cookbook-channel-list-header__title'>
        <ChannelListHeader />
      </div>
      <Button
        appearance='solid'
        aria-haspopup='dialog'
        aria-label='New conversation'
        circular
        onClick={() => setOpen(true)}
        size='md'
        variant='primary'
      >
        <IconPlus />
      </Button>
      <GlobalModal onClose={close} open={open}>
        {/* Mounted only while open, so every opening starts with an empty dialog. */}
        {open && <NewConversationDialog onClose={close} />}
      </GlobalModal>
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { ChannelListHeader: ChannelListHeaderWithButton };

/**
 * Adds the New conversation button to the channel list header, and registers the send handler that
 * creates a new conversation on its first message.
 */
export const WithNewConversation = ({ children }: PropsWithChildren) => {
  const { client } = useChatContext();

  useEffect(() => {
    client.config.set({
      channel: { requestHandlers: { sendMessageRequest: createOnFirstSend(client) } },
    });
  }, [client]);

  return <WithComponents overrides={overrides}>{children}</WithComponents>;
};
