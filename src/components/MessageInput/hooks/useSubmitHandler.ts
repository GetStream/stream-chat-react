import { useCallback } from 'react';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { UpdatedMessage } from 'stream-chat';

import type { MessageInputProps } from '../MessageInput';
import { useMessageComposer } from './messageComposer/useMessageComposer';

export const useSubmitHandler = (props: MessageInputProps) => {
  const { clearEditingState, publishTypingEvent } = props;

  const { channel } = useChannelStateContext('useSubmitHandler');
  const { addNotification, editMessage, sendMessage } =
    useChannelActionContext('useSubmitHandler');
  const { t } = useTranslationContext('useSubmitHandler');
  const messageComposer = useMessageComposer();

  const handleSubmit = useCallback(
    async (
      event?: React.BaseSyntheticEvent,
      // todo: think how can custom data be passed to both edited and created message. Do we want to keep customMessageData param
      customMessageData?: Omit<UpdatedMessage, 'mentioned_users'>,
    ) => {
      event?.preventDefault();
      const composition = await messageComposer.compose();
      if (!composition || !composition.message) return;

      // todo: plug in the client's notification system
      // if (notification?.type === 'error') {
      //   addNotification(t(notification.text), 'error');
      //   return;
      // }

      const { localMessage, message, sendOptions } = composition;

      if (messageComposer.editedMessage && localMessage.type !== 'error') {
        try {
          await editMessage({ ...localMessage, ...customMessageData }, sendOptions);

          clearEditingState?.();
        } catch (err) {
          addNotification(t('Edit message request failed'), 'error');
        }
      } else {
        try {
          await sendMessage({ localMessage, message, options: sendOptions });
          messageComposer.clear();
          if (publishTypingEvent) await channel.stopTyping();
        } catch (err) {
          addNotification(t('Send message request failed'), 'error');
        }
      }
    },
    [
      addNotification,
      channel,
      clearEditingState,
      editMessage,
      messageComposer,
      publishTypingEvent,
      sendMessage,
      t,
    ],
  );

  return { handleSubmit };
};
