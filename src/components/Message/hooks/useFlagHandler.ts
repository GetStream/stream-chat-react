import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export const missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';

export const useFlagHandler = (message?: LocalMessage): ReactEventHandler => {
  const { client } = useChatContext('useFlagHandler');
  const { t } = useTranslationContext('useFlagHandler');

  return async (event) => {
    event.preventDefault();

    if (!client || !t || !message?.id) {
      console.warn(missingUseFlagHandlerParameterWarning);
      return;
    }

    await client.flagMessage(message.id);
  };
};
