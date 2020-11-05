// @ts-check
import { useContext } from 'react';
import { ChannelContext, TranslationContext } from '../../../context';
import { validateAndGetMessage } from '../utils';

export const missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';

/**
 * @type {import('types').useFlagHandler}
 */
export const useFlagHandler = (message, notifications = {}) => {
  const { client } = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);

  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  return async (event) => {
    event.preventDefault();
    const {
      notify,
      getSuccessNotification,
      getErrorNotification,
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
