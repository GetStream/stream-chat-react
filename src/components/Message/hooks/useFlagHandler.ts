import { validateAndGetMessage } from '../utils';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';

export type FlagMessageNotifications<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  getErrorNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  getSuccessNotification?: (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useFlagHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  notifications: FlagMessageNotifications<At, Ch, Co, Ev, Me, Re, Us> = {},
): ReactEventHandler => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useFlagHandler');
  const { t } = useTranslationContext('useFlagHandler');

  return async (event) => {
    event.preventDefault();

    const { getErrorNotification, getSuccessNotification, notify } = notifications;

    if (!client || !t || !notify || !message?.id) {
      console.warn(missingUseFlagHandlerParameterWarning);
      return;
    }

    if (client.user?.banned) {
      return notify(t('Error adding flag'), 'error');
    }

    try {
      await client.flagMessage(message.id);

      const successMessage =
        getSuccessNotification && validateAndGetMessage(getSuccessNotification, [message]);

      notify(successMessage || t('Message has been successfully flagged'), 'success');
    } catch (e) {
      const errorMessage =
        getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

      notify(errorMessage || t('Error adding flag'), 'error');
    }
  };
};
