import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export const missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';

export const useFlagHandler = (message?: LocalMessage): ReactEventHandler => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  return async (event) => {
    event.preventDefault();

    if (!client || !t || !message?.id) {
      throw new Error(missingUseFlagHandlerParameterWarning);
    }

    await client.moderation.flagMessage({ message_id: message.id });
  };
};
