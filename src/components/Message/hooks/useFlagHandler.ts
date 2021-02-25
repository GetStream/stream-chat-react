import { MouseEvent, useContext } from 'react';
import type { MessageResponse } from 'stream-chat';
import type { MessageNotificationArguments } from 'types';
import { ChannelContext, TranslationContext } from '../../../context';
import { validateAndGetMessage } from '../utils';

export const missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';

export const useFlagHandler = (
  message: MessageResponse | undefined,
  notifications: MessageNotificationArguments = {},
): ((event: MouseEvent<HTMLElement>) => Promise<void>) => {
  const { client } = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);

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
