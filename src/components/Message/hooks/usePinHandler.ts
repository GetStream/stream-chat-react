import { validateAndGetMessage } from '../utils';

import { useChatContext } from '../../../context';
import { useMessagePaginator } from '../../../hooks';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage, UserResponse } from 'stream-chat';
import type { ReactEventHandler } from '../types';
import { nowNs } from 'stream-chat';

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
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  // The stored message, which may be newer than the `message` this hook rendered with.
  const getLatestMessage = () => messagePaginator.getItem(message.id) ?? message;

  // Restores only the pin fields from before the click, so updates that arrived while the request
  // was in flight (an edit, a reaction) are kept. Skipped unless the stored pin is still the
  // optimistic one: a pin or unpin that arrived meanwhile is newer than the snapshot, even when
  // `pinned` has the same value.
  const rollBackPin = (optimisticMessage: LocalMessage) => {
    const latestMessage = messagePaginator.getItem(message.id);
    const isOptimisticPinStored =
      latestMessage?.pinned === optimisticMessage.pinned &&
      latestMessage.pinned_at === optimisticMessage.pinned_at &&
      latestMessage.pinned_by?.id === optimisticMessage.pinned_by?.id;
    if (!latestMessage || !isOptimisticPinStored) return;

    messagePaginator.ingestItem({
      ...latestMessage,
      pin_expires: message.pin_expires,
      pinned: message.pinned,
      pinned_at: message.pinned_at,
      pinned_by: message.pinned_by,
    });
  };

  const handlePin: ReactEventHandler = async (event) => {
    event.preventDefault();

    if (!message) {
      throw new Error('usePinHandler was called but it is missing the message.');
    }

    if (!message.pinned) {
      const optimisticMessage: LocalMessage = {
        ...getLatestMessage(),
        pinned: true,
        pinned_at: nowNs(),
        pinned_by: client.user as UserResponse | undefined,
      };

      try {
        messagePaginator.ingestItem(optimisticMessage);

        await client.pinMessage(message);
      } catch (e) {
        // Roll back first, so a throwing notification callback cannot leave the optimistic state.
        rollBackPin(optimisticMessage);

        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify)
          notify(
            errorMessage ||
              t('common.errorPinningMessage.label', 'Error pinning message'),
            'error',
          );
        throw e;
      }
    } else {
      const optimisticMessage: LocalMessage = {
        ...getLatestMessage(),
        pin_expires: undefined,
        pinned: false,
        pinned_at: undefined,
        pinned_by: undefined,
      };

      try {
        messagePaginator.ingestItem(optimisticMessage);

        await client.unpinMessage(message);
      } catch (e) {
        // Roll back first, so a throwing notification callback cannot leave the optimistic state.
        rollBackPin(optimisticMessage);

        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify)
          notify(
            errorMessage ||
              t('common.errorRemovingMessagePin.label', 'Error removing message pin'),
            'error',
          );
        throw e;
      }
    }
  };

  return { handlePin };
};
