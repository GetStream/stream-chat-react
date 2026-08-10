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
  const { client } = useChatContext('useMuteHandler');
  const { t } = useTranslationContext('useMuteHandler');

  return async (event) => {
    event.preventDefault();

    const { getErrorNotification, getSuccessNotification, notify } = notifications;

    // Perform the mute/unmute unconditionally — mirror useMarkUnreadHandler/useDeleteHandler, which
    // do the action first and treat `notify` as an optional UI bridge. Gating the action on `notify`
    // (as this hook previously did) turned mute into a no-op, because Message.tsx wires the handler
    // as `useMuteHandler(message)` with no notifications, per the canonical `(message)`-only style.
    if (!message?.user || !client) {
      console.warn(missingUseMuteHandlerParamsWarning);
      return;
    }
    const mutes = client.mutedUsersStore.getLatestValue().mutedUsers ?? [];

    if (!isUserMuted(message, mutes)) {
      try {
        await client.muteUser(message.user.id);

        if (!notify) return;
        const successMessage =
          (getSuccessNotification &&
            validateAndGetMessage(getSuccessNotification, [message.user])) ||
          t('common.muted.label', '{{ user }} has been muted', {
            user: message.user.name || message.user.id,
          });

        if (typeof successMessage === 'string') notify(successMessage, 'success');
      } catch (e) {
        if (!notify) return;
        const errorMessage =
          (getErrorNotification &&
            validateAndGetMessage(getErrorNotification, [message.user])) ||
          t('common.errorMutingUser.label', 'Error muting a user ...');

        if (typeof errorMessage === 'string') notify(errorMessage, 'error');
      }
    } else {
      try {
        await client.unmuteUser(message.user.id);

        if (!notify) return;
        const successMessage =
          (getSuccessNotification &&
            validateAndGetMessage(getSuccessNotification, [message.user])) ||
          t('common.unmuted.label', '{{ user }} has been unmuted', {
            user: message.user.name || message.user.id,
          });

        if (typeof successMessage === 'string') notify(successMessage, 'success');
      } catch (e) {
        if (!notify) return;
        const errorMessage =
          (getErrorNotification &&
            validateAndGetMessage(getErrorNotification, [message.user])) ||
          t('common.errorUnmutingUser.label', 'Error unmuting a user ...');

        if (typeof errorMessage === 'string') notify(errorMessage, 'error');
      }
    }
  };
};
