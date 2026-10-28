import { useMemo } from 'react';
import type { AttachmentManagerState, TextComposerState } from 'stream-chat';

import { useStateStore } from '../../../store';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { toScheduledMessagePreview } from '../utils';

const textComposerSelector = ({ text }: TextComposerState) => ({ text });

const attachmentManagerSelector = ({ attachments }: AttachmentManagerState) => ({
  attachments,
});

export const useScheduledMessagePreview = () => {
  const messageComposer = useMessageComposerController();
  const { attachmentManager, id, textComposer } = messageComposer;
  const { text } = useStateStore(textComposer.state, textComposerSelector);
  const { attachments } = useStateStore(
    attachmentManager.state,
    attachmentManagerSelector,
  );

  const previewMessage = useMemo(
    () => toScheduledMessagePreview({ attachments, id, text }, new Date()),
    [attachments, id, text],
  );

  return previewMessage;
};
