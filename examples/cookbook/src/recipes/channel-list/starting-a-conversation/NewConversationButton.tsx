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

/** Opens the dialog that starts a new conversation. */
const NewConversationButton = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
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
        <NewConversationDialog onClose={close} />
      </GlobalModal>
    </>
  );
};

/** The default channel list header, with the button at its end. */
const ChannelListHeaderWithButton = () => (
  <ChannelListHeader EndContent={NewConversationButton} />
);

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
