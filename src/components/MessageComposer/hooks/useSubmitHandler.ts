import { useCallback } from 'react';
import { MessageComposer } from 'stream-chat';
import { useChatContext } from '../../../context/ChatContext';
import { useMessageComposerController } from './useMessageComposerController';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { addNotificationTargetTag, useNotificationTarget } from '../../Notifications';
import { discardPreEditSnapshot } from '../preEditSnapshot';

import type { MessageComposerProps } from '../MessageComposer';

const takeStateSnapshot = (messageComposer: MessageComposer) => {
  const textComposerState = messageComposer.textComposer.state.getLatestValue();
  const attachmentManagerState = messageComposer.attachmentManager.state.getLatestValue();
  const linkPreviewsManagerState =
    messageComposer.linkPreviewsManager.state.getLatestValue();
  const pollComposerState = messageComposer.pollComposer.state.getLatestValue();
  const customDataManagerState = messageComposer.customDataManager.state.getLatestValue();
  const state = messageComposer.state.getLatestValue();

  return () => {
    messageComposer.state.next(state);
    messageComposer.textComposer.state.next(textComposerState);
    messageComposer.attachmentManager.state.next(attachmentManagerState);
    messageComposer.linkPreviewsManager.state.next(linkPreviewsManagerState);
    messageComposer.pollComposer.state.next(pollComposerState);
    messageComposer.customDataManager.state.next(customDataManagerState);
  };
};

export const useSubmitHandler = (props: MessageComposerProps) => {
  const { overrideSubmitHandler } = props;

  const { client } = useChatContext('useSubmitHandler');
  const { editMessage, sendMessage } = useChannelActionContext('useSubmitHandler');
  const { t } = useTranslationContext('useSubmitHandler');
  const panel = useNotificationTarget();
  const messageComposer = useMessageComposerController();

  const handleSubmit = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      event?.preventDefault();
      const composition = await messageComposer.compose();
      if (!composition || !composition.message) return;

      const { localMessage, message, sendOptions } = composition;

      if (messageComposer.editedMessage && localMessage.type !== 'error') {
        try {
          await editMessage(localMessage, sendOptions);
          discardPreEditSnapshot(messageComposer);
          messageComposer.clear();
        } catch (err) {
          client.notifications.addError({
            message: t('Edit message request failed'),
            options: { tags: addNotificationTargetTag(panel) },
            origin: { emitter: 'MessageComposer' },
          });
        }
      } else {
        const restoreComposerStateSnapshot = takeStateSnapshot(messageComposer);
        try {
          // FIXME: once MessageComposer has sendMessage method, then the following condition should be encapsulated by it
          // keep attachments, text, quoted message (treat them as draft) ... if sending a poll
          const sentPollMessage = !!message.poll_id;
          if (sentPollMessage) {
            messageComposer.state.partialNext({
              id: MessageComposer.generateId(),
              pollId: null,
            });
          } else {
            messageComposer.clear();
          }
          // todo: get rid of overrideSubmitHandler once MessageComposer supports submission flow
          if (overrideSubmitHandler) {
            await overrideSubmitHandler({
              cid: messageComposer.channel.cid,
              localMessage,
              message,
              sendOptions,
            });
          } else {
            await sendMessage({ localMessage, message, options: sendOptions });
          }
          if (messageComposer.config.text.publishTypingEvents)
            await messageComposer.channel.stopTyping();
        } catch (err) {
          restoreComposerStateSnapshot();
          client.notifications.addError({
            message: t('Send message request failed'),
            options: { tags: addNotificationTargetTag(panel) },
            origin: { emitter: 'MessageComposer' },
          });
        }
      }
    },
    [client, editMessage, messageComposer, overrideSubmitHandler, panel, sendMessage, t],
  );

  return { handleSubmit };
};
