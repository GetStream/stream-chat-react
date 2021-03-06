import { validateAndGetMessage } from '../utils';

import {
  StreamMessage,
  useChannelContext,
} from '../../../context/ChannelContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { UpdatedMessage } from 'stream-chat';

import type { MouseEventHandler } from '../types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

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

export type PinPermissions<
  T extends string = string,
  U extends string = string
> = Partial<Record<T, PinEnabledUserRoles<U>>> & {
  commerce?: PinEnabledUserRoles<U>;
  gaming?: PinEnabledUserRoles<U>;
  livestream?: PinEnabledUserRoles<U>;
  messaging?: PinEnabledUserRoles<U>;
  team?: PinEnabledUserRoles<U>;
};

export type PinMessageNotifications<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  getErrorNotification?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  ) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const usePinHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
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
    if (
      !client?.userID ||
      !channel?.state ||
      !permissions ||
      !permissions[channel.type]
    ) {
      return false;
    }

    const currentChannelPermissions = permissions[channel.type];
    const currentChannelMember = channel.state.members[client.userID];
    const currentChannelWatcher = channel.state.watchers[client.userID];

    if (
      currentChannelPermissions &&
      typeof client.user?.role === 'string' &&
      currentChannelPermissions[client.user.role]
    ) {
      return true;
    }

    if (
      currentChannelMember &&
      typeof currentChannelMember.role === 'string' &&
      currentChannelPermissions &&
      currentChannelPermissions[currentChannelMember.role]
    ) {
      return true;
    }

    if (
      currentChannelWatcher &&
      typeof currentChannelWatcher.role === 'string' &&
      currentChannelPermissions &&
      currentChannelPermissions[currentChannelWatcher.role]
    ) {
      return true;
    }

    return false;
  };

  const handlePin: MouseEventHandler = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      try {
        await client.pinMessage(
          message as UpdatedMessage<At, Ch, Co, Me, Re, Us>,
        );
      } catch (e) {
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message]);

        if (notify) notify(errorMessage || t('Error pinning message'), 'error');
      }
    } else {
      try {
        await client.unpinMessage(
          message as UpdatedMessage<At, Ch, Co, Me, Re, Us>,
        );
      } catch (e) {
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message]);

        if (notify)
          notify(errorMessage || t('Error removing message pin'), 'error');
      }
    }
  };

  return { canPin: canPin(), handlePin };
};
