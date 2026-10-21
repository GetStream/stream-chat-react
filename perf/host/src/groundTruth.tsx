import { MessageUI, useMessageContext } from 'stream-chat-react';

import { noteSlotRender } from './renders';

/**
 * Validation only (?ground_truth=1): sits in the SDK's MessageUI slot, records that its own body ran
 * for this message, then renders the SDK's default MessageUI unchanged. It renders whenever the SDK
 * renders the slot (MessageWithContext rendered, or the message context changed), so it is a direct
 * count of row renders to check the fiber-based counter against.
 */
export const GroundTruthMessageUI = (props: Parameters<typeof MessageUI>[0]) => {
  const { message } = useMessageContext();
  noteSlotRender(message.id);
  return <MessageUI {...props} />;
};
