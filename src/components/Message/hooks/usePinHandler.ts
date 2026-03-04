import { validateAndGetMessage } from '../utils';

import { useChatContext } from '../../../context';
import { useMessagePaginator } from '../../../hooks';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

// @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
export type PinEnabledUserRoles<T extends string = string> = Partial<
  Record<T, boolean>
> & {
  admin?: boolean;
  anonymous?: boolean;
  channel_member?: boolean;
  channel_moderator?: boolean;
  guest?: boolean;
  member?: boolean;
  moderator?: boolean;
  owner?: boolean;
  user?: boolean;
};

// @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
export type PinPermissions<
  T extends string = string,
  U extends string = string,
> = Partial<Record<T, PinEnabledUserRoles<U>>> & {
  commerce?: PinEnabledUserRoles<U>;
  gaming?: PinEnabledUserRoles<U>;
  livestream?: PinEnabledUserRoles<U>;
  messaging?: PinEnabledUserRoles<U>;
  team?: PinEnabledUserRoles<U>;
};

export type PinMessageNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const usePinHandler = (
  message: LocalMessage,
  notifications: PinMessageNotifications = {},
) => {
  const { getErrorNotification, notify } = notifications;

  const messagePaginator = useMessagePaginator();
  const { client } = useChatContext('usePinHandler');
  const { t } = useTranslationContext('usePinHandler');

  const handlePin: ReactEventHandler = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      try {
        const optimisticMessage: LocalMessage = {
          ...message,
          pinned: true,
          pinned_at: new Date(),
          pinned_by: client.user,
        };

        messagePaginator.ingestItem(optimisticMessage);

        await client.pinMessage(message);
      } catch (e) {
        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error pinning message'), 'error');
        messagePaginator.ingestItem(message);
      }
    } else {
      try {
        const optimisticMessage: LocalMessage = {
          ...message,
          pin_expires: null,
          pinned: false,
          pinned_at: null,
          pinned_by: null,
        };

        messagePaginator.ingestItem(optimisticMessage);

        await client.unpinMessage(message);
      } catch (e) {
        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error removing message pin'), 'error');
        messagePaginator.ingestItem(message);
      }
    }
  };

  return { handlePin };
};
