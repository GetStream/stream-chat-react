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
import type { TranslationLanguage } from 'stream-chat';

import type { TranslationTopicConstructor } from './TranslationBuilder';
import type { UnknownType } from '../types/types';
import type {
  CustomFormatters,
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
  language?: TranslationLanguage;
  logger?: (message?: string) => void;
  translationBuilderTopics?: Record<string, TranslationTopicConstructor>;
  parseMissingKeyHandler?: (key: string, defaultValue?: string) => string;
  timezone?: string;
  translationsForLanguage?: TranslationDictionary;
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
 * If you would like to override certain keys in the built-in English translation,
 * the UI will be automatically updated:
 *
 * ```
 * const i18n = new Streami18n({
 *  translationsForLanguage: {
 *    'messageList.empty': 'Nothing here yet',
 *  }
 * });
 * ```
 *
 * To add a language, use `registerTranslation`. You can add as many as you want:
 *
 * ```
 * const i18n = new Streami18n({ language: 'nl' });
 *
 * i18n.registerTranslation('nl', {
 *  'messageList.empty': 'Nog niets...',
 *  'typing.multipleUsers': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 * });
 *
 * // Make sure to call setLanguage to reflect the new language in the UI.
 * i18n.setLanguage('nl');
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * Keys you do not supply fall back to the English copy that ships inline with each
 * component, so a partial dictionary is safe.
 *
 * ## Datetime i18n
 *
 * Stream react chat components uses [dayjs](https://day.js.org/en/) internally by default to format datetime stamp.
 * e.g., in ChannelPreview, MessageContent components.
 * Dayjs has locale support as well - https://day.js.org/docs/en/i18n/i18n
 * Dayjs is a lightweight alternative to Momentjs with the same modern API.
 *
 * Dayjs provides locale config for plenty of languages, you can check the whole list of locale configs at following url
 * https://github.com/iamkun/dayjs/tree/dev/src/locale
 *
 * Only the `en` dayjs locale is bundled. For any other language you must import the dayjs
 * locale yourself (`import 'dayjs/locale/nl.js'`) and/or pass `dayjsLocaleConfigForLanguage`,
 * including the `calendar` block — the SDK no longer ships calendar formats for other languages.
 *
 * You can either provide the dayjs locale config while registering
 * language with Streami18n (either via constructor or registerTranslation()) or you can provide your own Dayjs or Moment instance
 * to Streami18n constructor, which will be then used internally (using the language locale) in components.
 *
 * 1. Via language registration
 *
 * e.g.,
 * ```
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  dayjsLocaleConfigForLanguage: {
 *    months: [...],
 *    monthsShort: [...],
 *    calendar: {
 *      sameDay: ...'
 *    }
 *  }
 * });
 * ```
 *
 * Similarly, you can add locale config for moment while registering translation via `registerTranslation` function.
 *
 * e.g.,
 * ```
 * const i18n = new Streami18n();
 *
 * i18n.registerTranslation(
 *  'mr',
 *  {
 *    'messageList.empty': 'काहीही नाही ...',
 *    'typing.twoUsers': '{{ typing }} टीपी करत आहेत',
 *  },
 *  {
 *    months: [...],
 *    monthsShort: [...],
 *    calendar: {
 *      sameDay: ...'
 *    }
 *  }
 * );
 *```
 * 2. Provide your own Moment object
 *
 * ```js
 * import 'moment/locale/nl';
 * import 'moment/locale/it';
 * // or if you want to include all locales
 * import 'moment/min/locales';
 *
 * import Moment from moment
 *
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  DateTimeParser: Moment
 * })
 * ```
 *
 * 3. Provide your own Dayjs object
 *
 * ```js
 * import Dayjs from 'dayjs'
 *
 * import 'dayjs/locale/nl.js';
 * import 'dayjs/locale/it.js';
 *
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  DateTimeParser: Dayjs
 * })
 * ```
 * If you would like to stick with english language for datetimes in Stream components, you can set `disableDateTimeTranslations` to true.
 *
 */
const defaultStreami18nOptions = {
  DateTimeParser: Dayjs,
  dayjsLocaleConfigForLanguage: null,
  debug: false,
  disableDateTimeTranslations: false,
  language: 'en' as TranslationLanguage,
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
 * Prose keys are not in the bundled resource — each renders from the English copy passed inline at
 * its call site. i18next treats that as a missing key: it calls `parseMissingKeyHandler` and
 * **replaces the rendered string with whatever the handler returns**. An unguarded handler like
 * `(key) => \`[missing: ${key}]\`` would therefore blank out most of the UI.
 *
 * i18next passes the resolved default as the second argument (`usedDefault ? res : undefined`), so
 * "the SDK supplied this copy" is distinguishable from "no translation exists". We return the
 * default untouched in the first case, and defer to the handler only in the second.
 */
const guardMissingKeyHandler =
  (handler: (key: string, defaultValue?: string) => string) =>
  (key: string, defaultValue?: string) => {
    if (typeof defaultValue === 'string') return defaultValue;
    return handler(key, defaultValue);
  };

export class Streami18n {
  i18nInstance: I18n = i18n.createInstance();
  translationBuilder: TranslationBuilder;
  private translationBuilderTopics: Record<string, TranslationTopicConstructor> = {};
  Dayjs = null;
  setLanguageCallback: (t: StreamTFunction) => void = () => null;
  initialized = false;

  /**
   * i18next's own `TFunction` accepts any string; the SDK's `StreamTFunction` narrows the key to
   * the shipped catalog. The cast happens here, once, at the boundary where i18next hands the
   * function over — see `init()`.
   */
  t: StreamTFunction = defaultTranslatorFunction;
  tDateTimeParser: TDateTimeParser;

  translations: {
    [key: string]: {
      [key: string]: TranslationDictionary | UnknownType;
    };
  } = {
    en: { [defaultNS]: runtimeDefaults },
  };

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
  currentLanguage: TranslationLanguage;
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
    // Prepare the i18next configuration.
    this.logger = finalOptions.logger;
    this.currentLanguage = finalOptions.language;
    this.DateTimeParser = finalOptions.DateTimeParser;
    this.timezone = finalOptions.timezone;
    this.formatters = { ...predefinedFormatters, ...options?.formatters };
    this.translationBuilder = new TranslationBuilder(this.i18nInstance);
    this.translationBuilderTopics = {
      ...defaultStreami18nOptions.translationBuilderTopics,
      ...options.translationBuilderTopics,
    };

    try {
      if (this.DateTimeParser && isDayJs(this.DateTimeParser)) {
        this.DateTimeParser.extend(LocalizedFormat);
        this.DateTimeParser.extend(calendar);
        this.DateTimeParser.extend(localeData);
        this.DateTimeParser.extend(relativeTime);
        this.DateTimeParser.extend(duration);
      }
    } catch (error) {
      throw Error(
        `Streami18n: Looks like you wanted to provide Dayjs instance, but something went wrong while adding plugins ${error}`,
      );
    }

    this.isCustomDateTimeParser = !!options.DateTimeParser;
    const translationsForLanguage = finalOptions.translationsForLanguage;

    if (translationsForLanguage) {
      this.translations[this.currentLanguage] = {
        [defaultNS]:
          this.translations[this.currentLanguage] &&
          this.translations[this.currentLanguage][defaultNS]
            ? {
                ...this.translations[this.currentLanguage][defaultNS],
                ...translationsForLanguage,
              }
            : translationsForLanguage,
      };
    }

    // If translations don't exist for given language, then set it as empty object.
    if (!this.translations[this.currentLanguage]) {
      this.translations[this.currentLanguage] = {
        [defaultNS]: {},
      };
    }

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

    this.validateCurrentLanguage();

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

      if (isDayJs(this.DateTimeParser)) {
        return supportsTz(this.DateTimeParser)
          ? this.DateTimeParser(timestamp).tz(this.timezone).locale(language)
          : this.DateTimeParser(timestamp).locale(language);
      }

      if (supportsTz(this.DateTimeParser) && this.timezone) {
        return this.DateTimeParser(timestamp).tz(this.timezone).locale(language);
      }
      return this.DateTimeParser(timestamp).locale(language);
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

  localeExists = (language: TranslationLanguage) => {
    if (this.isCustomDateTimeParser) return true;

    return Object.keys(Dayjs.Ls).indexOf(language) > -1;
  };

  validateCurrentLanguage = () => {
    const availableLanguages = Object.keys(this.translations);
    if (availableLanguages.indexOf(this.currentLanguage) === -1) {
      this.logger(
        `Streami18n: '${this.currentLanguage}' language is not registered.` +
          ` Please make sure to call streami18n.registerTranslation('${this.currentLanguage}', {...}) or ` +
          `use one the built-in supported languages - ${this.getAvailableLanguages()}`,
      );

      this.currentLanguage = defaultLng;
    }
  };

  /** Returns an instance of i18next used within this class instance */
  geti18Instance = (): I18n => this.i18nInstance;

  /** Returns list of available languages. */
  getAvailableLanguages = () => Object.keys(this.translations);

  /** Returns all the translation dictionary for all inbuilt-languages */
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
    } else {
      return {
        t: this.t,
        tDateTimeParser: this.tDateTimeParser,
      };
    }
  }

  registerTranslation(
    language: TranslationLanguage,
    translation: TranslationDictionary,
    customDayjsLocale?: Partial<ILocale>,
  ) {
    if (!translation) {
      this.logger(
        `Streami18n: registerTranslation(language, translation, customDayjsLocale) called without translation`,
      );
      return;
    }

    if (!this.translations[language]) {
      this.translations[language] = { [defaultNS]: translation };
    } else {
      this.translations[language][defaultNS] = translation;
    }

    if (customDayjsLocale) {
      this.dayjsLocales[language] = { ...customDayjsLocale };
    } else if (!this.localeExists(language)) {
      this.logger(
        `Streami18n: registerTranslation(language, translation, customDayjsLocale) - ` +
          `Locale config for ${language} does not exist in Dayjs.` +
          `Please import the locale file using "import 'dayjs/locale/${language}.js';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)`,
      );
    }

    if (this.initialized) {
      this.i18nInstance.addResources(language, defaultNS, translation);
    }
  }

  addOrUpdateLocale(key: TranslationLanguage, config: Partial<ILocale>) {
    if (this.localeExists(key)) {
      Dayjs.updateLocale(key, { ...config });
    } else {
      // Merging the custom locale config with en config, so missing keys can default to english.
      Dayjs.locale({ name: key, ...en_locale, ...config }, undefined, true);
    }
  }

  async setLanguage(language: TranslationLanguage) {
    this.currentLanguage = language;

    if (!this.initialized) return;

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
