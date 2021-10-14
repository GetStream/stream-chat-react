import { defaultPinPermissions, validateAndGetMessage } from '../utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { ReactEventHandler } from '../types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

// @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
export type PinEnabledUserRoles<T extends string = string> = Partial<Record<T, boolean>> & {
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
export type PinPermissions<T extends string = string, U extends string = string> = Partial<
  Record<T, PinEnabledUserRoles<U>>
> & {
  commerce?: PinEnabledUserRoles<U>;
  gaming?: PinEnabledUserRoles<U>;
  livestream?: PinEnabledUserRoles<U>;
  messaging?: PinEnabledUserRoles<U>;
  team?: PinEnabledUserRoles<U>;
};

export type PinMessageNotifications<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  getErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const usePinHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  // @ts-expect-error @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
  permissions: PinPermissions = defaultPinPermissions, // eslint-disable-line
  notifications: PinMessageNotifications<At, Ch, Co, Ev, Me, Re, Us> = {},
) => {
  const { getErrorNotification, notify } = notifications;

  const { updateMessage } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>('usePinHandler');
  const { channelCapabilities = {} } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>(
    'usePinHandler',
  );
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('usePinHandler');
  const { t } = useTranslationContext('usePinHandler');

  const canPin = !!channelCapabilities['pin-message'];

  const handlePin: ReactEventHandler = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      try {
        const optimisticMessage = {
          ...message,
          pinned: true,
          pinned_at: new Date(),
          pinned_by: client.user,
        };

        updateMessage(optimisticMessage);

        const messageResponse = await client.pinMessage(message);

        updateMessage(messageResponse.message);
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

        const messageResponse = await client.unpinMessage(message);

        updateMessage(messageResponse.message);
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
