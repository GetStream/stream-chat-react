import i18n, { TFunction } from 'i18next';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import updateLocale from 'dayjs/plugin/updateLocale';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import relativeTime from 'dayjs/plugin/relativeTime';

import type moment from 'moment';
import type { TranslationLanguages } from 'stream-chat';

import type { TDateTimeParser } from '../context/TranslationContext';

import type { UnknownType } from '../types/types';

import {
  deTranslations,
  enTranslations,
  esTranslations,
  frTranslations,
  hiTranslations,
  itTranslations,
  jaTranslations,
  koTranslations,
  nlTranslations,
  ptTranslations,
  ruTranslations,
  trTranslations,
} from './translations';

const defaultNS = 'translation';
const defaultLng = 'en';

import 'dayjs/locale/de';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/hi';
import 'dayjs/locale/it';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/nl';
import 'dayjs/locale/pt';
import 'dayjs/locale/ru';
import 'dayjs/locale/tr';
// These locale imports also set these locale globally.
// So As a last step I am going to import english locale
// to make sure I don't mess up language at other places in app.
import 'dayjs/locale/en';

type CalendarLocaleConfig = {
  lastDay: string;
  lastWeek: string;
  nextDay: string;
  nextWeek: string;
  sameDay: string;
  sameElse: string;
};

Dayjs.extend(updateLocale);

Dayjs.updateLocale('de', {
  calendar: {
    lastDay: '[gestern um] LT',
    lastWeek: '[letzten] dddd [um] LT',
    nextDay: '[morgen um] LT',
    nextWeek: 'dddd [um] LT',
    sameDay: '[heute um] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('es', {
  calendar: {
    lastDay: '[ayer a las] LT',
    lastWeek: '[pasado] dddd [a] LT',
    nextDay: '[mañana a] LT',
    nextWeek: 'dddd [a] LT',
    sameDay: '[hoy a las] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('fr', {
  calendar: {
    lastDay: '[Hier à] LT',
    lastWeek: 'dddd [dernier à] LT',
    nextDay: '[Demain à] LT',
    nextWeek: 'dddd [à] LT',
    sameDay: '[Aujourd’hui à] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('hi', {
  calendar: {
    lastDay: '[कल] LT',
    lastWeek: '[पिछले] dddd, LT',
    nextDay: '[कल] LT',
    nextWeek: 'dddd, LT',
    sameDay: '[आज] LT',
    sameElse: 'L',
  },
  // Hindi notation for meridiems are quite fuzzy in practice. While there exists
  // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
  meridiem(hour: number) {
    if (hour < 4) {
      return 'रात';
    } else if (hour < 10) {
      return 'सुबह';
    } else if (hour < 17) {
      return 'दोपहर';
    } else if (hour < 20) {
      return 'शाम';
    } else {
      return 'रात';
    }
  },
  meridiemHour(hour: number, meridiem: string) {
    if (hour === 12) {
      hour = 0;
    }
    if (meridiem === 'रात') {
      return hour < 4 ? hour : hour + 12;
    } else if (meridiem === 'सुबह') {
      return hour;
    } else if (meridiem === 'दोपहर') {
      return hour >= 10 ? hour : hour + 12;
    } else if (meridiem === 'शाम') {
      return hour + 12;
    }
    return hour;
  },
  meridiemParse: /रात|सुबह|दोपहर|शाम/,
});

Dayjs.updateLocale('it', {
  calendar: {
    lastDay: '[Ieri alle] LT',
    lastWeek: '[lo scorso] dddd [alle] LT',
    nextDay: '[Domani alle] LT',
    nextWeek: 'dddd [alle] LT',
    sameDay: '[Oggi alle] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('ja', {
  calendar: {
    lastDay: '[昨日] LT',
    lastWeek: 'dddd LT',
    nextDay: '[明日] LT',
    nextWeek: '[次の] dddd LT',
    sameDay: '[今日] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('ko', {
  calendar: {
    lastDay: '[어제] LT',
    lastWeek: '[지난] dddd LT',
    nextDay: '[내일] LT',
    nextWeek: 'dddd LT',
    sameDay: '[오늘] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('nl', {
  calendar: {
    lastDay: '[gisteren om] LT',
    lastWeek: '[afgelopen] dddd [om] LT',
    nextDay: '[morgen om] LT',
    nextWeek: 'dddd [om] LT',
    sameDay: '[vandaag om] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('pt', {
  calendar: {
    lastDay: '[ontem às] LT',
    lastWeek: 'dddd [passada às] LT',
    nextDay: '[amanhã às] LT',
    nextWeek: 'dddd [às] LT',
    sameDay: '[hoje às] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('ru', {
  calendar: {
    lastDay: '[Вчера, в] LT',
    nextDay: '[Завтра, в] LT',
    sameDay: '[Сегодня, в] LT',
  },
});

Dayjs.updateLocale('tr', {
  calendar: {
    lastDay: '[dün] LT',
    lastWeek: '[geçen] dddd [saat] LT',
    nextDay: '[yarın saat] LT',
    nextWeek: '[gelecek] dddd [saat] LT',
    sameDay: '[bugün saat] LT',
    sameElse: 'L',
  },
});

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
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

// Type guards to check DayJs
const isDayJs = (dateTimeParser: typeof Dayjs | typeof moment): dateTimeParser is typeof Dayjs =>
  (dateTimeParser as typeof Dayjs).extend !== undefined;

type Options = {
  DateTimeParser?: typeof Dayjs | typeof moment;
  dayjsLocaleConfigForLanguage?: Partial<ILocale> & { calendar?: CalendarLocaleConfig };
  debug?: boolean;
  disableDateTimeTranslations?: boolean;
  language?: TranslationLanguages;
  logger?: (message?: string) => void;
  translationsForLanguage?: Partial<typeof enTranslations>;
};

/**
 * Wrapper around [i18next](https://www.i18next.com/) class for Stream related translations.
 * Instance of this class should be provided to Chat component to handle translations.
 * Stream provides following list of in-built translations:
 * 1. English (en)
 * 2. Dutch (nl)
 * 3. Russian (ru)
 * 4. Turkish (tr)
 * 5. French (fr)
 * 6. Italian (it)
 * 7. Hindi (hi)
 * 8. Spanish (es)
 * 9. Portuguese (pt)
 * 10. German (de)
 * 11. Japanese (ja)
 * 12. Korean (ko)
 *
 * Simplest way to start using chat components in one of the in-built languages would be following:
 *
 * ```
 * const i18n = new Streami18n({ language 'nl' });
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * If you would like to override certain keys in in-built translation.
 * UI will be automatically updated in this case.
 *
 * ```
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  translationsForLanguage: {
 *    'Nothing yet...': 'Nog Niet ...',
 *    '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 *  }
 * });
 *
 * If you would like to register additional languages, use registerTranslation. You can add as many languages as you want:
 *
 * i18n.registerTranslation('zh', {
 *  'Nothing yet...': 'Nog Niet ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 * });
 *
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * You can use the same function to add whole new language as well.
 *
 * ```
 * const i18n = new Streami18n();
 *
 * i18n.registerTranslation('mr', {
 *  'Nothing yet...': 'काहीही नाही  ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
 * });
 *
 * // Make sure to call setLanguage to reflect new language in UI.
 * i18n.setLanguage('it');
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * ## Datetime translations
 *
 * Stream react chat components uses [dayjs](https://day.js.org/en/) internally by default to format datetime stamp.
 * e.g., in ChannelPreview, MessageContent components.
 * Dayjs has locale support as well - https://day.js.org/docs/en/i18n/i18n
 * Dayjs is a lightweight alternative to Momentjs with the same modern API.
 *
 * Dayjs provides locale config for plenty of languages, you can check the whole list of locale configs at following url
 * https://github.com/iamkun/dayjs/tree/dev/src/locale
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
 *    'Nothing yet...': 'काहीही नाही  ...',
 *    '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
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
 * import 'dayjs/locale/nl';
 * import 'dayjs/locale/it';
 * // or if you want to include all locales
 * import 'dayjs/min/locales';
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
  language: 'en' as TranslationLanguages,
  logger: (message?: string) => console.warn(message),
};

export const defaultTranslatorFunction: TFunction = <tResult = string>(key: tResult) => key;

export class Streami18n {
  i18nInstance = i18n.createInstance();
  Dayjs = null;
  setLanguageCallback: (t: TFunction) => void = () => null;
  initialized = false;

  t: TFunction = defaultTranslatorFunction;
  tDateTimeParser: TDateTimeParser;

  translations: {
    [key: string]: {
      [key: string]: typeof enTranslations | UnknownType;
    };
  } = {
    de: { [defaultNS]: deTranslations },
    en: { [defaultNS]: enTranslations },
    es: { [defaultNS]: esTranslations },
    fr: { [defaultNS]: frTranslations },
    hi: { [defaultNS]: hiTranslations },
    it: { [defaultNS]: itTranslations },
    ja: { [defaultNS]: jaTranslations },
    ko: { [defaultNS]: koTranslations },
    nl: { [defaultNS]: nlTranslations },
    pt: { [defaultNS]: ptTranslations },
    ru: { [defaultNS]: ruTranslations },
    tr: { [defaultNS]: trTranslations },
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
  currentLanguage: TranslationLanguages;
  DateTimeParser: typeof Dayjs | typeof moment;
  isCustomDateTimeParser: boolean;
  i18nextConfig: {
    debug: boolean;
    fallbackLng: false;
    interpolation: { escapeValue: boolean };
    keySeparator: false;
    lng: string;
    nsSeparator: false;
    parseMissingKeyHandler: (key: string) => string;
  };
  /**
   * Constructor accepts following options:
   *  - language (String) default: 'en'
   *    Language code e.g., en, tr
   *
   *  - translationsForLanguage (object)
   *    Translations object. Please check src/i18n/en.json for example.
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
  constructor(options: Options = {}) {
    const finalOptions = {
      ...defaultStreami18nOptions,
      ...options,
    };
    // Prepare the i18next configuration.
    this.logger = finalOptions.logger;
    this.currentLanguage = finalOptions.language;
    this.DateTimeParser = finalOptions.DateTimeParser;

    try {
      if (this.DateTimeParser && isDayJs(this.DateTimeParser)) {
        this.DateTimeParser.extend(LocalizedFormat);
        this.DateTimeParser.extend(calendar);
        this.DateTimeParser.extend(localeData);
        this.DateTimeParser.extend(relativeTime);
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
      interpolation: { escapeValue: false },
      keySeparator: false,
      lng: this.currentLanguage,
      nsSeparator: false,

      parseMissingKeyHandler: (key) => {
        this.logger(`Streami18n: Missing translation for key: ${key}`);

        return key;
      },
    };

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
      if (finalOptions.disableDateTimeTranslations || !this.localeExists(this.currentLanguage)) {
        /**
         * TS needs to know which is being called to accept the chain call
         */
        if (isDayJs(this.DateTimeParser)) {
          return this.DateTimeParser(timestamp).locale(defaultLng);
        }
        return this.DateTimeParser(timestamp).locale(defaultLng);
      }

      if (isDayJs(this.DateTimeParser)) {
        return this.DateTimeParser(timestamp).locale(this.currentLanguage);
      }

      return this.DateTimeParser(timestamp).locale(this.currentLanguage);
    };
  }

  /**
   * Initializes the i18next instance with configuration (which enables natural language as default keys)
   */
  async init() {
    this.validateCurrentLanguage();

    try {
      this.t = await this.i18nInstance.init({
        ...this.i18nextConfig,
        lng: this.currentLanguage,
        resources: this.translations,
      });
      this.initialized = true;
    } catch (error) {
      this.logger(`Something went wrong with init: ${JSON.stringify(error)}`);
    }

    return {
      t: this.t,
      tDateTimeParser: this.tDateTimeParser,
    };
  }

  localeExists = (language: TranslationLanguages) => {
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
  geti18Instance = () => this.i18nInstance;

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
        this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
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
    language: TranslationLanguages,
    translation: typeof enTranslations,
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
          `Please import the locale file using "import 'dayjs/locale/${language}';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)`,
      );
    }

    if (this.initialized) {
      this.i18nInstance.addResources(language, defaultNS, translation);
    }
  }

  addOrUpdateLocale(key: TranslationLanguages, config: Partial<ILocale>) {
    if (this.localeExists(key)) {
      Dayjs.updateLocale(key, { ...config });
    } else {
      // Merging the custom locale config with en config, so missing keys can default to english.
      Dayjs.locale({ name: key, ...en_locale, ...config }, undefined, true);
    }
  }

  async setLanguage(language: TranslationLanguages) {
    this.currentLanguage = language;

    if (!this.initialized) return;

    try {
      const t = await this.i18nInstance.changeLanguage(language);
      if (this.dayjsLocales[language]) {
        this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
      }

      this.setLanguageCallback(t);
      return t;
    } catch (error) {
      this.logger(`Failed to set language: ${JSON.stringify(error)}`);
      return this.t;
    }
  }

  registerSetLanguageCallback(callback: (t: TFunction) => void) {
    this.setLanguageCallback = callback;
  }
}
