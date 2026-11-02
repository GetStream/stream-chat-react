import { isUserMuted, validateAndGetMessage } from '../utils';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage, UserResponse } from 'stream-chat';

import type { ReactEventHandler } from '../types';

export const missingUseMuteHandlerParamsWarning =
  'useMuteHandler was called but it is missing one or more necessary parameter.';

export type MuteUserNotifications = {
  getErrorNotification?: (user: UserResponse) => string;
  getSuccessNotification?: (user: UserResponse) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useMuteHandler = (
  message?: LocalMessage,
  notifications: MuteUserNotifications = {},
): ReactEventHandler => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  return async (event) => {
    event.preventDefault();

    const { getErrorNotification, getSuccessNotification, notify } = notifications;

    // The action runs even without `notify` (`Message` passes none); it only reports the outcome.
    if (!message?.user || !client) {
      throw new Error(missingUseMuteHandlerParamsWarning);
    }
    const mutes = client.mutedUsersStore.getLatestValue().mutedUsers ?? [];

    if (!isUserMuted(message, mutes)) {
      try {
        await client.moderation.mute({ target_ids: [message.user.id] });

        if (!notify) return;
        const successMessage =
          (getSuccessNotification &&
            validateAndGetMessage(getSuccessNotification, [message.user])) ||
          t('common.muted.label', '{{ user }} has been muted', {
            user: message.user.name || message.user.id,
          });

        if (typeof successMessage === 'string') notify(successMessage, 'success');
      } catch (e) {
        if (notify) {
          const errorMessage =
            (getErrorNotification &&
              validateAndGetMessage(getErrorNotification, [message.user])) ||
            t('common.errorMutingUser.label', 'Error muting a user ...');

          if (typeof errorMessage === 'string') notify(errorMessage, 'error');
        }
        throw e;
      }
    } else {
      try {
        await client.moderation.unmute({ target_ids: [message.user.id] });

        if (!notify) return;
        const successMessage =
          (getSuccessNotification &&
            validateAndGetMessage(getSuccessNotification, [message.user])) ||
          t('common.unmuted.label', '{{ user }} has been unmuted', {
            user: message.user.name || message.user.id,
          });

        if (typeof successMessage === 'string') notify(successMessage, 'success');
      } catch (e) {
        if (notify) {
          const errorMessage =
            (getErrorNotification &&
              validateAndGetMessage(getErrorNotification, [message.user])) ||
            t('common.errorUnmutingUser.label', 'Error unmuting a user ...');

          if (typeof errorMessage === 'string') notify(errorMessage, 'error');
        }
        throw e;
      }
    }
  };
};
