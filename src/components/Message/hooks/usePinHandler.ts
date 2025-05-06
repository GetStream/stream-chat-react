import { defaultPinPermissions, validateAndGetMessage } from '../utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
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
  // @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
  _permissions: PinPermissions = defaultPinPermissions, // eslint-disable-line
  notifications: PinMessageNotifications = {},
) => {
  const { getErrorNotification, notify } = notifications;

  const { updateMessage } = useChannelActionContext('usePinHandler');
  const { channelCapabilities = {} } = useChannelStateContext('usePinHandler');
  const { client } = useChatContext('usePinHandler');
  const { t } = useTranslationContext('usePinHandler');

  const canPin = !!channelCapabilities['pin-message'];

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

        updateMessage(optimisticMessage);

        await client.pinMessage(message);
      } catch (e) {
        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error pinning message'), 'error');
        updateMessage(message);
      }
    } else {
      try {
        const optimisticMessage = {
          ...message,
          pin_expires: null,
          pinned: false,
          pinned_at: null,
          pinned_by: null,
        };

        updateMessage(optimisticMessage);

        await client.unpinMessage(message);
      } catch (e) {
        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error removing message pin'), 'error');
        updateMessage(message);
      }
    }
  };

  return { canPin, handlePin };
};
