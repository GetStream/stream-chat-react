import { useEffect, useMemo, useState } from 'react';
import { useStreami18nState } from '@stream-io/i18n/react';

import { Streami18n } from './Streami18n';

import type { StreamChat } from 'stream-chat';
import type { TranslationContextValue } from '../context/TranslationContext';

export type UseStreami18nParams = {
  client: StreamChat;
  /** An instance the integrator configured. One is created when absent. */
  i18nInstance?: Streami18n;
};

/**
 * Resolves the translation context value. The UI copy comes from the `Streami18n` instance, while
 * `userLanguage` is separate: `client.user.language`, the language the API auto-translates messages
 * into (read as ``message.i18n[`${userLanguage}_text`]``).
 */
export const useStreami18n = ({
  client,
  i18nInstance,
}: UseStreami18nParams): TranslationContextValue => {
  const i18n = useMemo(() => i18nInstance ?? new Streami18n(), [i18nInstance]);
  const [userLanguage, setUserLanguage] = useState(() => client.user?.language ?? 'en');

  useEffect(() => {
    const sync = () => setUserLanguage(client.user?.language ?? 'en');
    sync();
    const { unsubscribe } = client.on('user.updated', (event) => {
      if (event.user?.id === client.user?.id) sync();
    });
    return unsubscribe;
  }, [client]);

  const { t, tDateTimeParser } = useStreami18nState(i18n, (error) => {
    console.warn(`Streami18n failed to initialize`, error);
  });

  return useMemo(
    () => ({ t, tDateTimeParser, userLanguage }),
    [t, tDateTimeParser, userLanguage],
  );
};
