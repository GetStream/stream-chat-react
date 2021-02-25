import type { MouseEvent } from 'react';
import type { MessageResponse } from 'stream-chat';

import { validateAndGetMessage } from '../utils';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

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

export const missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';

export type MessageNotificationArguments<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  getErrorNotification?: (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => string;
  getSuccessNotification?: (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  ) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useFlagHandler = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message?: MessageResponse<At, Ch, Co, Me, Re, Us>,
  notifications: MessageNotificationArguments<At, Ch, Co, Me, Re, Us> = {},
): ((event: MouseEvent<HTMLElement>) => Promise<void>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  return async (event) => {
    event.preventDefault();

    const {
      getErrorNotification,
      getSuccessNotification,
      notify,
    } = notifications;

    if (!client || !t || !notify || !message?.id) {
      console.warn(missingUseFlagHandlerParameterWarning);
      return;
    }

    try {
      await client.flagMessage(message.id);

      const successMessage =
        getSuccessNotification &&
        validateAndGetMessage(getSuccessNotification, [message]);

      notify(
        successMessage || t('Message has been successfully flagged'),
        'success',
      );
    } catch (e) {
      const errorMessage =
        getErrorNotification &&
        validateAndGetMessage(getErrorNotification, [message]);

      notify(
        errorMessage ||
          t(
            'Error adding flag: Either the flag already exist or there is issue with network connection ...',
          ),
        'error',
      );
    }
  };
};
