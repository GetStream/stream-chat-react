import i18n from 'i18next';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar.js';
import updateLocale from 'dayjs/plugin/updateLocale.js';
import LocalizedFormat from 'dayjs/plugin/localizedFormat.js';
import localeData from 'dayjs/plugin/localeData.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import duration from 'dayjs/plugin/duration.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { NotificationTranslationTopic, TranslationBuilder } from './TranslationBuilder';
import { defaultTranslatorFunction, predefinedFormatters } from './utils';

import type { i18n as I18n } from 'i18next';
import type momentTimezone from 'moment-timezone';

import type { TranslationTopicConstructor } from './TranslationBuilder';
import type { UnknownType } from '../types/types';
import type {
  CustomFormatters,
  LooseTranslationDictionary,
  PredefinedFormatters,
  StreamTFunction,
  TDateTimeParser,
  TranslationDictionary,
} from './types';

import { runtimeDefaults } from './runtimeDefaults';

import 'dayjs/locale/en.js';

const defaultNS = 'translation';
const defaultLng = 'en';

type CalendarLocaleConfig = {
  lastDay: string;
  lastWeek: string;
  nextDay: string;
  nextWeek: string;
  sameDay: string;
  sameElse: string;
};

Dayjs.extend(updateLocale);
Dayjs.extend(utc);
Dayjs.extend(timezone);

const en_locale = {
  formats: {},
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  relativeTime: {},
  weekdays: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
};

type DateTimeParserModule = typeof Dayjs | typeof momentTimezone;
// Type guards to check DayJs
const isDayJs = (dateTimeParser: DateTimeParserModule): dateTimeParser is typeof Dayjs =>
  (dateTimeParser as typeof Dayjs).extend !== undefined;

type TimezoneParser = {
  tz: momentTimezone.MomentTimezone | Dayjs.Dayjs;
};
const supportsTz = (dateTimeParser: unknown): dateTimeParser is TimezoneParser =>
  (dateTimeParser as TimezoneParser).tz !== undefined;

export type Streami18nOptions = {
  DateTimeParser?: DateTimeParserModule;
  dayjsLocaleConfigForLanguage?: Partial<ILocale> & { calendar?: CalendarLocaleConfig };
  debug?: boolean;
  disableDateTimeTranslations?: boolean;
  formatters?: Partial<PredefinedFormatters> & CustomFormatters;
  language?: string;
  logger?: (message?: string) => void;
  translationBuilderTopics?: Record<string, TranslationTopicConstructor>;
  parseMissingKeyHandler?: (key: string, defaultValue?: string) => string;
  timezone?: string;
  translationsForLanguage?: TranslationDictionary;
};

const defaultStreami18nOptions = {
  DateTimeParser: Dayjs,
  debug: false,
  disableDateTimeTranslations: false,
  language: 'en',
  logger: (message?: string) => console.warn(message),
  /**
   * Key in the translationBuilderTopics has to match postProcessorName in the translation value.
   *
   * {
   *   "key": "{{value, postProcessorName}}"
   * }
   *
   * At least the default topics will be supported.
   */
  translationBuilderTopics: {
    notification: NotificationTranslationTopic,
  },
};

/**
 * Wraps an integrator's `parseMissingKeyHandler` so it only sees genuinely missing translations.
 *
 * i18next counts every prose key as missing (they render from the inline `defaultValue`, not from
 * the resource) and lets the handler's return value replace the rendered string — so an unguarded
 * handler blanks out most of the UI. A resolved default arrives as the second argument, which is
 * how the two cases are told apart.
 */
const guardMissingKeyHandler =
  (handler: (key: string, defaultValue?: string) => string) =>
  (key: string, defaultValue?: string) => {
    if (typeof defaultValue === 'string') return defaultValue;
    return handler(key, defaultValue);
  };

/**
 * Wrapper around [i18next](https://www.i18next.com/) class for Stream related i18n.
 * Instance of this class should be provided to Chat component to handle i18n.
 *
 * English (`en`) is the only built-in language. Every other language is supplied by the
 * integrator via `registerTranslation()` or `translationsForLanguage`. Keys are stable,
 * namespaced identifiers (e.g. `message.status.sent.text`); use the `TranslationKey` type for
 * autocompletion, or `yarn i18n:export` for the whole catalog as JSON.
 *
 * Only the keys that cannot carry inline English copy are bundled (see `runtimeDefaults`);
 * everything else renders from the copy passed inline at its call site.
 *
 * Override built-in English copy — the UI updates automatically:
 *
 * ```
 * const i18n = new Streami18n({
 *  translationsForLanguage: {
 *    'emptyState.indicator.noConversationsYet.label': 'Nothing here yet',
 *  }
 * });
 * ```
 *
 * Add a language with `registerTranslation`, as many as you want:
 *
 * ```
 * const i18n = new Streami18n({ language: 'nl' });
 *
 * i18n.registerTranslation('nl', {
 *  'emptyState.indicator.noConversationsYet.label': 'Nog niets...',
 *  'typing.singleUser': '{{ typing }} is aan het typen',
 *  'typing.twoUsers': '{{ typing }} zijn aan het typen',
 * });
 *
 * // setLanguage reflects the new language in the UI.
 * i18n.setLanguage('nl');
 * <Chat client={chatClient} i18nInstance={i18n}>...</Chat>
 * ```
 *
 * Keys you do not supply fall back to the English copy that ships inline with each component, so a
 * partial dictionary is safe — as is no dictionary at all. Every language is layered over the
 * bundled `runtimeDefaults`.
 *
 * Type your dictionary as {@link TranslationDictionary} to turn a typo or a leftover v14 key into a
 * compile error; it accepts every plural category, so Russian or Arabic stays checked too. Widen to
 * {@link LooseTranslationDictionary} only for keys the SDK does not define.
 * {@link TranslationCatalog} maps every key to its English copy.
 *
 * ## Datetime i18n
 *
 * Dates are formatted with [dayjs](https://day.js.org/docs/en/i18n/i18n) unless you pass your own
 * `DateTimeParser` (dayjs or moment). Only the `en` dayjs locale is bundled: for any other
 * language import the [locale](https://github.com/iamkun/dayjs/tree/dev/src/locale) and pass
 * `dayjsLocaleConfigForLanguage`, including its `calendar` block.
 *
 * ```
 * import 'dayjs/locale/nl.js';
 *
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  dayjsLocaleConfigForLanguage: { months: [...], calendar: { sameDay: '[vandaag om] LT', ... } },
 * });
 * ```
 *
 * `registerTranslation(language, translation, customDayjsLocale)` takes the same config as its
 * third argument. Set `disableDateTimeTranslations` to keep dates in English.
 *
 * That `calendar` block does not reach the four `timestamp.*` keys that pass their own
 * `calendarFormats` (`DateSeparator`, `ReminderNotification`, `ChannelPreviewTimestamp`,
 * `ChannelDetailPinnedMessageTimestamp`). Those carry English day words; translate them by
 * overriding the keys — see `ai-docs/i18n-v15-migration.md`.
 */
export class Streami18n {
  i18nInstance: I18n = i18n.createInstance();
  translationBuilder: TranslationBuilder;
  private translationBuilderTopics: Record<string, TranslationTopicConstructor> = {};
  Dayjs = null;
  setLanguageCallback: (t: StreamTFunction) => void = () => null;
  initialized = false;

  /** Narrowed from i18next's `TFunction` to the shipped catalog; cast once, in `init()`. */
  t: StreamTFunction = defaultTranslatorFunction;
  tDateTimeParser: TDateTimeParser;

  translations: {
    [key: string]: {
      [key: string]: LooseTranslationDictionary | UnknownType;
    };
  } = {
    en: { [defaultNS]: { ...runtimeDefaults } },
  };

  /**
   * Languages an integrator supplied a dictionary for. Narrower than
   * `Object.keys(this.translations)`, which also holds languages seeded with `runtimeDefaults`
   * alone.
   */
  registeredLanguages = new Set<string>([defaultLng]);

  /**
   * dayjs.defineLanguage('nl') also changes the global locale. We don't want to do that
   * when user calls registerTranslation() function. So instead we will store the locale configs
   * given to registerTranslation() function in `dayjsLocales` object, and register the required locale
   * with moment, when setLanguage is called.
   * */
  dayjsLocales: { [key: string]: Partial<ILocale> } = {};
  // dayjsLocales = {};

  /**
   * Initialize properties used in constructor
   */
  logger: (msg?: string) => void;
  currentLanguage: string;
  DateTimeParser: DateTimeParserModule;
  formatters: PredefinedFormatters & CustomFormatters = predefinedFormatters;
  isCustomDateTimeParser: boolean;
  i18nextConfig: {
    debug: boolean;
    fallbackLng: false;
    interpolation: { escapeValue: boolean; formatSeparator: string };
    keySeparator: false;
    lng: string;
    nsSeparator: false;
    parseMissingKeyHandler?: (key: string, defaultValue?: string) => string;
    postProcess?: string[];
  };
  /**
   * A valid TZ identifier string (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
   */
  timezone?: string;
  /**
   * Constructor accepts following options:
   *  - language (String) default: 'en'
   *    Language code e.g., en, tr
   *
   *  - translationsForLanguage (object)
   *    Translations object, keyed by `TranslationKey`, which is a union of every key.
   *
   *  - disableDateTimeTranslations (boolean) default: false
   *    Disable translations for date-times
   *
   *  - debug (boolean) default: false
   *    Enable debug mode in internal i18n class
   *
   *  - logger (function) default: () => {}
   *    Logger function to log warnings/errors from this class
   *
   *  - dayjsLocaleConfigForLanguage (object) default: 'enConfig'
   *    [Config object](https://momentjs.com/docs/#/i18n/changing-locale/) for internal moment object,
   *    corresponding to language (param)
   *
   *  - DateTimeParser (function) Moment or Dayjs instance/function.
   *    Make sure to load all the required locales in this Moment or Dayjs instance that you will be provide to Streami18n
   *
   * @param {*} options
   */
  constructor(options: Streami18nOptions = {}) {
    const finalOptions = {
      ...defaultStreami18nOptions,
      ...options,
    };
    this.logger = finalOptions.logger;
    this.currentLanguage = finalOptions.language;
    const dateTimeParser = (this.DateTimeParser = finalOptions.DateTimeParser);
    this.timezone = finalOptions.timezone;
    this.formatters = { ...predefinedFormatters, ...options?.formatters };
    this.translationBuilder = new TranslationBuilder(this.i18nInstance);
    this.translationBuilderTopics = {
      ...defaultStreami18nOptions.translationBuilderTopics,
      ...options.translationBuilderTopics,
    };

    if (dateTimeParser && isDayJs(dateTimeParser)) {
      dateTimeParser.extend(LocalizedFormat);
      dateTimeParser.extend(calendar);
      dateTimeParser.extend(localeData);
      dateTimeParser.extend(relativeTime);
      dateTimeParser.extend(duration);
    }

    this.isCustomDateTimeParser = !!options.DateTimeParser;
    const translationsForLanguage = finalOptions.translationsForLanguage;

    if (translationsForLanguage) {
      this.translations[this.currentLanguage] = {
        [defaultNS]: this.mergeWithRuntimeDefaults(
          this.currentLanguage,
          translationsForLanguage,
        ),
      };
      this.registeredLanguages.add(this.currentLanguage);
    }

    this.ensureLanguage(this.currentLanguage);

    this.i18nextConfig = {
      debug: finalOptions.debug,
      fallbackLng: false,
      interpolation: { escapeValue: false, formatSeparator: '|' },
      keySeparator: false,
      lng: this.currentLanguage,
      nsSeparator: false,
    };

    const postProcess = Object.keys(this.translationBuilderTopics);

    if (postProcess.length > 0) {
      this.i18nextConfig.postProcess = postProcess;
    }

    if (finalOptions.parseMissingKeyHandler) {
      this.i18nextConfig.parseMissingKeyHandler = guardMissingKeyHandler(
        finalOptions.parseMissingKeyHandler,
      );
    }

    const dayjsLocaleConfigForLanguage = finalOptions.dayjsLocaleConfigForLanguage;

    if (dayjsLocaleConfigForLanguage) {
      this.addOrUpdateLocale(this.currentLanguage, {
        ...dayjsLocaleConfigForLanguage,
      });
    } else if (!this.localeExists(this.currentLanguage)) {
      this.logger(
        `Streami18n: Streami18n(...) - Locale config for ${this.currentLanguage} does not exist in momentjs.` +
          `Please import the locale file using "import 'moment/locale/${this.currentLanguage}';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)`,
      );
    }

    this.tDateTimeParser = (timestamp) => {
      const language =
        finalOptions.disableDateTimeTranslations ||
        !this.localeExists(this.currentLanguage)
          ? defaultLng
          : this.currentLanguage;

      const dateTimeParser = this.DateTimeParser;
      if (isDayJs(dateTimeParser)) {
        return supportsTz(dateTimeParser)
          ? dateTimeParser(timestamp).tz(this.timezone).locale(language)
          : dateTimeParser(timestamp).locale(language);
      }

      if (supportsTz(dateTimeParser) && this.timezone) {
        return dateTimeParser(timestamp).tz(this.timezone).locale(language);
      }
      return dateTimeParser(timestamp).locale(language);
    };
  }

  /**
   * Initializes the i18next instance with configuration (which enables natural language as default keys)
   */
  async init() {
    this.validateCurrentLanguage();

    try {
      this.t = (await this.i18nInstance.init({
        ...this.i18nextConfig,
        lng: this.currentLanguage,
        resources: this.translations,
      })) as unknown as StreamTFunction;
      this.initialized = true;
      if (this.formatters) {
        Object.entries(this.formatters).forEach(([name, formatterFactory]) => {
          if (!formatterFactory) return;
          this.i18nInstance.services.formatter?.add(name, formatterFactory(this));
        });
      }
      // Register post-processors after initialization
      Object.entries(this.translationBuilderTopics).forEach(
        ([topic, TranslationTopic]) => {
          this.translationBuilder.registerTopic(topic, TranslationTopic);
        },
      );
    } catch (error) {
      this.logger(`Something went wrong with init: ${JSON.stringify(error)}`);
    }

    return {
      t: this.t,
      tDateTimeParser: this.tDateTimeParser,
    };
  }

  localeExists = (language: string) => {
    if (this.isCustomDateTimeParser) return true;

    return Object.keys(Dayjs.Ls).indexOf(language) > -1;
  };

  /**
   * A dictionary layered over `runtimeDefaults`. Every write into `this.translations` goes through
   * here: those keys have no inline `defaultValue` and `fallbackLng` is false, so a language
   * missing them renders raw `duration.*` keys and unformatted ISO timestamps.
   */
  private mergeWithRuntimeDefaults = (
    language: string,
    translation?: LooseTranslationDictionary,
  ): LooseTranslationDictionary => ({
    ...runtimeDefaults,
    ...this.translations[language]?.[defaultNS],
    ...translation,
  });

  /**
   * Guarantees `language` has a dictionary, so a language nobody registered still formats dates and
   * durations and renders the SDK's copy in English. Writes into i18next's store too when already
   * initialized — the only route for a language added after `init()`.
   */
  private ensureLanguage = (language: string) => {
    if (this.translations[language]) return;

    const translation = this.mergeWithRuntimeDefaults(language);
    this.translations[language] = { [defaultNS]: translation };

    if (this.initialized) {
      this.i18nInstance.addResources(language, defaultNS, translation);
    }
  };

  /**
   * Warns when the current language has no registered dictionary. Not an error and not a reason to
   * fall back to `en` — the language renders English copy with its own date formats.
   */
  validateCurrentLanguage = () => {
    if (this.registeredLanguages.has(this.currentLanguage)) return;

    this.logger(
      `Streami18n: no translation dictionary is registered for '${this.currentLanguage}', so the ` +
        `SDK's copy renders in English. Call ` +
        `streami18n.registerTranslation('${this.currentLanguage}', {...}) to translate it. ` +
        `Registered: ${[...this.registeredLanguages].join(', ')}`,
    );
  };

  /** Returns list of available languages. */
  getAvailableLanguages = () => Object.keys(this.translations);

  /**
   * The resource dictionaries this instance hands to i18next, keyed by language.
   *
   * Not the full English catalog — prose keys are never bundled, so `en` holds `runtimeDefaults`
   * plus whatever has been registered. To enumerate every key with its copy, use
   * {@link TranslationCatalog} or `yarn i18n:export`.
   */
  getTranslations = () => this.translations;

  /**
   * Returns current version translator function.
   */
  async getTranslators() {
    if (!this.initialized) {
      if (this.dayjsLocales[this.currentLanguage]) {
        this.addOrUpdateLocale(
          this.currentLanguage,
          this.dayjsLocales[this.currentLanguage],
        );
      }

      return await this.init();
    }

    return {
      t: this.t,
      tDateTimeParser: this.tDateTimeParser,
    };
  }

  registerTranslation(
    language: string,
    translation: TranslationDictionary,
    customDayjsLocale?: Partial<ILocale>,
  ) {
    // Merged, not replaced, so repeated calls for one language accumulate.
    const merged = this.mergeWithRuntimeDefaults(language, translation);
    this.translations[language] = { [defaultNS]: merged };
    this.registeredLanguages.add(language);

    if (customDayjsLocale) {
      this.dayjsLocales[language] = { ...customDayjsLocale };
    } else if (!this.localeExists(language)) {
      this.logger(
        `Streami18n: registerTranslation - ` +
          `Locale config for ${language} does not exist in Dayjs.` +
          `Please import the locale file using "import 'dayjs/locale/${language}.js';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)`,
      );
    }

    if (this.initialized) {
      // `merged`, not `translation`: for a language registered *after* init this is the only write
      // into i18next's store, so passing the partial would leave `runtimeDefaults` absent there.
      this.i18nInstance.addResources(language, defaultNS, merged);
    }
  }

  addOrUpdateLocale(key: string, config: Partial<ILocale>) {
    if (this.localeExists(key)) {
      Dayjs.updateLocale(key, { ...config });
    } else {
      // Merging the custom locale config with en config, so missing keys can default to english.
      Dayjs.locale({ name: key, ...en_locale, ...config }, undefined, true);
    }
  }

  async setLanguage(language: string) {
    this.currentLanguage = language;
    this.ensureLanguage(language);

    if (!this.initialized) return;

    this.validateCurrentLanguage();

    try {
      const t = await this.i18nInstance.changeLanguage(language);
      if (this.dayjsLocales[language]) {
        this.addOrUpdateLocale(
          this.currentLanguage,
          this.dayjsLocales[this.currentLanguage],
        );
      }

      this.setLanguageCallback(t as unknown as StreamTFunction);
      return t;
    } catch (error) {
      this.logger(`Failed to set language: ${JSON.stringify(error)}`);
      return this.t;
    }
  }

  registerSetLanguageCallback(callback: (t: StreamTFunction) => void) {
    this.setLanguageCallback = callback;
  }
}
