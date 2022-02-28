import { isUserMuted, validateAndGetMessage } from '../utils';

import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { UserResponse } from 'stream-chat';

import type { ReactEventHandler } from '../types';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const missingUseMuteHandlerParamsWarning =
  'useMuteHandler was called but it is missing one or more necessary parameter.';

export type MuteUserNotifications<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  getErrorNotification?: (user: UserResponse<StreamChatGenerics>) => string;
  getSuccessNotification?: (user: UserResponse<StreamChatGenerics>) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useMuteHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
  notifications: MuteUserNotifications<StreamChatGenerics> = {},
): ReactEventHandler => {
  const { mutes } = useChannelStateContext<StreamChatGenerics>('useMuteHandler');
  const { client } = useChatContext<StreamChatGenerics>('useMuteHandler');
  const { t } = useTranslationContext('useMuteHandler');

  return async (event) => {
    event.preventDefault();

    const { getErrorNotification, getSuccessNotification, notify } = notifications;

    if (!t || !message?.user || !notify || !client) {
      console.warn(missingUseMuteHandlerParamsWarning);
      return;
    }

    if (!isUserMuted(message, mutes)) {
      try {
        await client.muteUser(message.user.id);

        const successMessage =
          getSuccessNotification && validateAndGetMessage(getSuccessNotification, [message.user]);

        notify(
          successMessage ||
            t(`{{ user }} has been muted`, {
              user: message.user.name || message.user.id,
            }),
          'success',
        );
      } catch (e) {
        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message.user]);

        notify(errorMessage || t('Error muting a user ...'), 'error');
      }
    } else {
      try {
        await client.unmuteUser(message.user.id);

        const fallbackMessage = t(`{{ user }} has been unmuted`, {
          user: message.user.name || message.user.id,
        });

        const successMessage =
          (getSuccessNotification &&
            validateAndGetMessage(getSuccessNotification, [message.user])) ||
          fallbackMessage;

        if (typeof successMessage === 'string') {
          notify(successMessage, 'success');
        }
      } catch (e) {
        const errorMessage =
          (getErrorNotification && validateAndGetMessage(getErrorNotification, [message.user])) ||
          t('Error unmuting a user ...');

        if (typeof errorMessage === 'string') {
          notify(errorMessage, 'error');
        }
      }
    }
  };
};
