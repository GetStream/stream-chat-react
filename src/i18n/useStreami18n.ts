import { useEffect, useMemo, useState } from 'react';

import { Streami18n } from './Streami18n';
import type { Streami18nState } from './types';
import { useStateStore } from '../store';

import type { StreamChat } from 'stream-chat';
import type { TranslationContextValue } from '../context/TranslationContext';

/** Module scope, so the subscription is not torn down and rebuilt on every render. */
const selector = ({ t, tDateTimeParser }: Streami18nState) => ({ t, tDateTimeParser });

export type UseStreami18nParams = {
  client: StreamChat;
  /** An instance the integrator configured. One is created when absent. */
  i18nInstance?: Streami18n;
};

/**
 * Resolves the translation context value.
 *
 * Two independent languages come out of here, and keeping them apart is the point:
 *
 * - **UI copy** comes from the `Streami18n` instance, through `state`. Set it with the `language`
 *   option or `setLanguage()`.
 * - **`userLanguage`** is the language the API auto-translates *messages* into, which is
 *   `client.user.language` and nothing else. Every consumer uses it to read
 *   `message.i18n[`${userLanguage}_text`]`.
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

  useEffect(() => {
    i18n.init().catch((error: unknown) => {
      console.warn(`Streami18n failed to initialize`, error);
    });
  }, [i18n]);

  const { t, tDateTimeParser } = useStateStore(i18n.state, selector);

  return useMemo(
    () => ({ t, tDateTimeParser, userLanguage }),
    [t, tDateTimeParser, userLanguage],
  );
};
