import { useCallback } from 'react';
import { useMessageComposer } from './useMessageComposer';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { MessageInputProps } from '../MessageInput';
import type { MessageComposer } from 'stream-chat';

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

export const useSubmitHandler = (props: MessageInputProps) => {
  const { clearEditingState, overrideSubmitHandler } = props;

  const { addNotification, editMessage, sendMessage } =
    useChannelActionContext('useSubmitHandler');
  const { t } = useTranslationContext('useSubmitHandler');
  const messageComposer = useMessageComposer();

  const handleSubmit = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      event?.preventDefault();
      const composition = await messageComposer.compose();
      if (!composition || !composition.message) return;

      const { localMessage, message, sendOptions } = composition;

      if (messageComposer.editedMessage && localMessage.type !== 'error') {
        try {
          await editMessage(localMessage, sendOptions);
          clearEditingState?.();
        } catch (err) {
          addNotification(t('Edit message request failed'), 'error');
        }
      } else {
        const restoreComposerStateSnapshot = takeStateSnapshot(messageComposer);
        try {
          messageComposer.clear();
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
          addNotification(t('Send message request failed'), 'error');
        }
      }
    },
    [
      addNotification,
      clearEditingState,
      editMessage,
      messageComposer,
      overrideSubmitHandler,
      sendMessage,
      t,
    ],
  );

  return { handleSubmit };
};
