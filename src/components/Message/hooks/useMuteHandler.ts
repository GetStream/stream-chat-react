import { isUserMuted } from '../utils';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';

import type { ReactEventHandler } from '../types';

export const missingUseMuteHandlerParamsWarning =
  'useMuteHandler was called but it is missing one or more necessary parameter.';

export const useMuteHandler = (message?: LocalMessage): ReactEventHandler => {
  const { mutes } = useChannelStateContext('useMuteHandler');
  const { client } = useChatContext('useMuteHandler');
  const { t } = useTranslationContext('useMuteHandler');

  return async (event) => {
    event.preventDefault();

    if (!t || !message?.user || !client) {
      console.warn(missingUseMuteHandlerParamsWarning);
      return;
    }

    if (!isUserMuted(message, mutes)) {
      await client.muteUser(message.user.id);
    } else {
      await client.unmuteUser(message.user.id);
    }
  };
};
