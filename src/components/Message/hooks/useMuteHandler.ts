import { isUserMuted, validateAndGetMessage } from '../utils';

import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { UserResponse } from 'stream-chat';

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

export const missingUseMuteHandlerParamsWarning =
  'useMuteHandler was called but it is missing one or more necessary parameter.';

export type MuteUserNotifications<Us extends DefaultUserType<Us> = DefaultUserType> = {
  getErrorNotification?: (user: UserResponse<Us>) => string;
  getSuccessNotification?: (user: UserResponse<Us>) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useMuteHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  notifications: MuteUserNotifications<Us> = {},
): ReactEventHandler => {
  const { mutes } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>('useMuteHandler');
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useMuteHandler');
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
