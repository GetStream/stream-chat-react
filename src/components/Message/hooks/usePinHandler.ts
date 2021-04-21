import { validateAndGetMessage } from '../utils';

import { StreamMessage, useChannelContext } from '../../../context/ChannelContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { UpdatedMessage } from 'stream-chat';

import type { ReactEventHandler } from '../types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

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
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  permissions?: PinPermissions,
  notifications: PinMessageNotifications<At, Ch, Co, Ev, Me, Re, Us> = {},
) => {
  const { getErrorNotification, notify } = notifications;

  const { channel, client } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const canPin = () => {
    if (!channel || !permissions || !permissions[channel.type]) {
      return false;
    }

    const currentChannelPermissions = permissions[channel.type];
    const currentRole = channel.state.membership.role;

    if (currentChannelPermissions && currentRole && currentChannelPermissions[currentRole]) {
      return true;
    }

    return false;
  };

  const handlePin: ReactEventHandler = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      try {
        await client.pinMessage(message as UpdatedMessage<At, Ch, Co, Me, Re, Us>);
      } catch (e) {
        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error pinning message'), 'error');
      }
    } else {
      try {
        await client.unpinMessage(message as UpdatedMessage<At, Ch, Co, Me, Re, Us>);
      } catch (e) {
        const errorMessage =
          getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error removing message pin'), 'error');
      }
    }
  };

  return { canPin: canPin(), handlePin };
};
