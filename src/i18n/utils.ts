import { createDefaultTranslatorFunction } from 'stream-chat/i18n';

import type { StreamTFunction } from './types';

/**
 * The `t` in force before i18next has initialized, and the default value of the translation context.
 *
 * Core's factory, instantiated against this SDK's catalog so it is typed the same as the real `t`. It
 * honours the inline `defaultValue` at each call site, which is what stops raw dotted keys flashing on
 * the first frame — or rendering permanently for a component used outside `<Chat>`.
 */
export const defaultTranslatorFunction: StreamTFunction =
  createDefaultTranslatorFunction() as StreamTFunction;

/**
 * The date/time and key helpers now live in `stream-chat/i18n`, shared with the React Native SDK.
 *
 * Re-exported from here rather than rewritten at ~15 call sites, so the internal module path stays
 * stable. `getDateString` and the type guards behave identically; `predefinedFormatters` gains
 * `fromNowFormatter`, and `timestampFormatter`'s relative-compact wording now goes through `t()` rather
 * than being hardcoded English.
 */
export {
  asDynamicKey,
  defaultDateTimeParser,
  getDateString,
  getDateStringForA11y,
  isDate,
  isDayOrMoment,
  isNumberOrString,
  predefinedFormatters,
} from 'stream-chat/i18n';
