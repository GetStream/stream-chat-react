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
 * Resolves the translation context value. Two independent languages come out of here, and keeping
 * them apart is the point:
 *
 * - **UI copy** — from the `Streami18n` instance via `useStreami18nState` (shared with the React
 *   Native SDK; it owns `init()` and the store subscription).
 * - **`userLanguage`** — `client.user.language`, the language the API auto-translates *messages*
 *   into, used to read ``message.i18n[`${userLanguage}_text`]``. Chat-client state, so it stays here.
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
