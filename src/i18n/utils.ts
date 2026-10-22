import { createDefaultTranslatorFunction } from '@stream-io/i18n';

import type { StreamTFunction } from './types';

/**
 * The `t` in force before i18next initializes and outside `<Chat>`. It renders the inline
 * `defaultValue` of each call site, so raw dotted keys never show.
 */
export const defaultTranslatorFunction: StreamTFunction =
  createDefaultTranslatorFunction() as StreamTFunction;

// Re-exported from `@stream-io/i18n` so the internal module path stays stable.
export {
  asDynamicKey,
  defaultDateTimeParser,
  getDateString,
  getDateStringForA11y,
  isDate,
  isDayOrMoment,
  isNumberOrString,
  predefinedFormatters,
} from '@stream-io/i18n';
