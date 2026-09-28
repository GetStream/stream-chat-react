// Adding languages to the SDK, end to end. English is the only one it bundles; everything else is
// three things you supply per language:
//
//   1. a dictionary of translated keys                    — `<lang>Translations`
//   2. the dayjs locale, for month/weekday names          — `import 'dayjs/locale/<lang>.js'`
//   3. a `calendar` config, for relative date wording     — `<lang>DayjsLocaleConfig`
//
// Steps 1 and 3 are the exports of ./de.ts and ./it.ts; step 2 is the side-effect import at the top
// of each. All of it goes onto **one** `Streami18n` instance: `registerTranslation` takes the dayjs
// config as its third argument, so every language is registered up front and `setLanguage()` swaps
// the active one at runtime — no remount, no second instance. The language switcher in
// AppSettings › General drives exactly that call.
import { Streami18n } from 'stream-chat-react';

import { deDayjsLocaleConfig, deTranslations } from './de';
import { itDayjsLocaleConfig, itTranslations } from './it';

const registeredLanguages = {
  de: { dayjsLocaleConfig: deDayjsLocaleConfig, translations: deTranslations },
  it: { dayjsLocaleConfig: itDayjsLocaleConfig, translations: itTranslations },
};

/** The languages the switcher offers. `en` needs no dictionary — the SDK ships it inline. */
export const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

const languageFromUrl =
  typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get('language');

/**
 * The app's single `Streami18n` instance, with every language registered.
 *
 * A code with no dictionary still works: the UI keeps the SDK's English copy while dates follow
 * that language, provided its dayjs locale has been imported.
 */
export const streamI18n = new Streami18n({
  language: languageFromUrl ?? DEFAULT_LANGUAGE,
});

for (const [code, { dayjsLocaleConfig, translations }] of Object.entries(
  registeredLanguages,
)) {
  streamI18n.registerTranslation(code, translations, dayjsLocaleConfig);
}
