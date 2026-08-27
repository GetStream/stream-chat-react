import { useEffect } from 'react';
import {
  createAttachmentsCompositionMiddleware,
  createSendWithPendingUploadsAttachmentsMiddleware,
} from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useMessageComposerController } from './useMessageComposerController';

/**
 * Swaps in the composition middleware that lets a message be composed while its attachments are
 * still uploading, for as long as `Channel`'s `sendMessagesWithPendingUploads` prop is on.
 *
 * `stream-chat` ships the alternative middleware but no option to turn it on, because the flow is
 * only half implemented there: the composition it produces carries attachments with no URL yet,
 * and this SDK's send path (`Channel.sendMessageRequest`) is what awaits them. Installing it is
 * therefore the UI SDK's call — the same division RN makes with
 * `allowSendBeforeAttachmentsUpload`.
 *
 * Both middleware share an id, so `replace` keeps the position in the chain either way.
 */
export const useSendMessagesWithPendingUploads = () => {
  const { sendMessagesWithPendingUploads } = useChatContext();
  const messageComposer = useMessageComposerController();

  useEffect(() => {
    if (!sendMessagesWithPendingUploads) return;

    messageComposer.compositionMiddlewareExecutor.replace([
      createSendWithPendingUploadsAttachmentsMiddleware(messageComposer),
    ]);

    return () => {
      messageComposer.compositionMiddlewareExecutor.replace([
        createAttachmentsCompositionMiddleware(messageComposer),
      ]);
    };
  }, [messageComposer, sendMessagesWithPendingUploads]);
};
