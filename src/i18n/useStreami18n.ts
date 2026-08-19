import { useEffect, useMemo } from 'react';

import { Streami18n } from './Streami18n';
import type { BundledKey, TranslationCatalog } from './types';
import { useStateStore } from '../store';

import type { StreamChat } from 'stream-chat';
import type { Streami18nState } from 'stream-chat/i18n';
import type { TranslationContextValue } from '../context/TranslationContext';

/**
 * This SDK's instantiation of core's state shape.
 *
 * Spelled out rather than left to `Streami18nState`'s defaults: those default the catalog to
 * `AnyTranslationCatalog`, and `t` is contravariant in its options, so the concrete store is not
 * assignable to the default-parameterized one.
 */
type SDKStreami18nState = Streami18nState<TranslationCatalog, BundledKey>;

/**
 * Whether a value is a `Streami18n` from any copy of the package.
 *
 * `instanceof` is deliberately avoided: an integrator's app can resolve a second physical
 * `stream-chat`, and an identity check would then reject the instance they configured and silently
 * replace it with a fresh English default — every registered dictionary, formatter and language gone,
 * with no error anywhere. `Symbol.for` returns the same symbol in every copy, so a branded static
 * survives the boundary.
 *
 * Compared against `Streami18n.brand` rather than tested for truthiness, because `brand` is a common
 * static name and accepting any truthy one would let an unrelated object through to `init()` and throw
 * at render instead of taking the warn-and-fall-back path below.
 */
const isStreami18n = (value: unknown): value is Streami18n =>
  typeof value === 'object' &&
  value !== null &&
  (value.constructor as typeof Streami18n | undefined)?.brand === Streami18n.brand;

/** Module scope, so the subscription is not torn down and rebuilt on every render. */
const selector = ({ t, tDateTimeParser }: SDKStreami18nState) => ({ t, tDateTimeParser });

export type UseStreami18nParams = {
  client: StreamChat;
  /** Language to fall back to when neither the user nor the browser names a registered one. */
  defaultLanguage?: string;
  /** An instance the integrator configured. One is created when absent. */
  i18nInstance?: Streami18n;
};

/**
 * Resolves the translation context value from a `Streami18n` instance.
 *
 * Mirrors `stream-chat-react-native`'s `useStreami18n`: adopt-or-create the instance, initialize it,
 * and subscribe to its store. Keeping the two SDKs the same shape here is the point — this logic used
 * to sit inside `useChat` alongside user-agent stamping, mutes and subsystem subscriptions, which is
 * exactly the kind of divergence moving the runtime into `stream-chat` was meant to remove.
 *
 * Reactivity is the instance's `StateStore`. `subscribe` fires synchronously with the current value, so
 * there is no ordering to get right: whether this runs before or after `init()`, the live `t` arrives.
 */
export const useStreami18n = ({
  client,
  defaultLanguage = 'en',
  i18nInstance,
}: UseStreami18nParams): TranslationContextValue => {
  const streami18n = useMemo(() => {
    if (!i18nInstance) {
      // The user's language at creation time, which is what the instance should start in.
      return new Streami18n({ language: client.user?.language ?? defaultLanguage });
    }
    if (isStreami18n(i18nInstance)) return i18nInstance;
    // Loud, because the alternative is rendering English and looking fine.
    console.warn(
      'stream-chat-react: the value passed as `i18nInstance` is not a Streami18n, so it was ignored ' +
        'and a default English instance is being used. If you did construct one, check for a ' +
        'duplicate `stream-chat` in node_modules.',
    );
    return new Streami18n({ language: client.user?.language ?? defaultLanguage });
    // `client` is read but deliberately not a dependency: re-running this would build a *new*
    // instance and discard every dictionary, formatter and locale registered on the old one. The
    // language is a starting value, not a binding — `userLanguage` below tracks it reactively.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18nInstance]);

  /**
   * The language whose translations the UI should show.
   *
   * The browser's language only wins if the instance actually has a dictionary for it; otherwise
   * picking it would render the SDK's English copy while claiming a different language, and
   * `MessageTranslationIndicator` would then look for the wrong `message.i18n` entry.
   */
  const userLanguage = useMemo(() => {
    const fromUser = client.user?.language;
    if (fromUser) return fromUser;

    // Language code only, not the country-specific variant.
    const browserLanguage = window.navigator.language.slice(0, 2);
    return streami18n.registeredLanguages.has(browserLanguage)
      ? browserLanguage
      : defaultLanguage;
  }, [client.user?.language, defaultLanguage, streami18n]);

  useEffect(() => {
    streami18n.init();
  }, [streami18n]);

  const { t, tDateTimeParser } = useStateStore(streami18n.state, selector);

  return useMemo(
    () => ({ t, tDateTimeParser, userLanguage }),
    [t, tDateTimeParser, userLanguage],
  );
};
