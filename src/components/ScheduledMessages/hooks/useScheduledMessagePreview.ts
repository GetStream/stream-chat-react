import { useMemo } from 'react';
import type {
  AttachmentManagerState,
  TextComposerState,
  UserResponse,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { toComposedScheduledMessagePreview } from '../utils';

const textComposerSelector = ({ text }: TextComposerState) => ({ text });

const attachmentManagerSelector = ({ attachments }: AttachmentManagerState) => ({
  attachments,
});

export const useScheduledMessagePreview = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();
  const { attachmentManager, channel, id, textComposer } = messageComposer;
  const { text } = useStateStore(textComposer.state, textComposerSelector);
  const { attachments } = useStateStore(
    attachmentManager.state,
    attachmentManagerSelector,
  );

  const previewMessage = useMemo(
    () =>
      toComposedScheduledMessagePreview(
        { attachments, cid: channel.cid, id, text },
        (client.user ?? { id: client.userID ?? '' }) as UserResponse,
        new Date(),
      ),
    [attachments, channel.cid, client.user, client.userID, id, text],
  );

  return previewMessage;
};
