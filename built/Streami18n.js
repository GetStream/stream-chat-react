'use strict';
var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function() {
          return this;
        }),
      g
    );
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var i18next_1 = __importDefault(require('i18next'));
var dayjs_1 = __importDefault(require('dayjs'));
var calendar_1 = __importDefault(require('dayjs/plugin/calendar'));
var updateLocale_1 = __importDefault(require('dayjs/plugin/updateLocale'));
var localizedFormat_1 = __importDefault(
  require('dayjs/plugin/localizedFormat'),
);
var localeData_1 = __importDefault(require('dayjs/plugin/localeData'));
var relativeTime_1 = __importDefault(require('dayjs/plugin/relativeTime'));
var i18n_1 = require('./i18n');
var defaultNS = 'translation';
var defaultLng = 'en';
require('dayjs/locale/nl');
require('dayjs/locale/ru');
require('dayjs/locale/tr');
require('dayjs/locale/fr');
require('dayjs/locale/hi');
require('dayjs/locale/it');
// These locale imports also set these locale globally.
// So As a last step I am going to import english locale
// to make sure I don't mess up language at other places in app.
require('dayjs/locale/en');
dayjs_1.default.extend(updateLocale_1.default);
dayjs_1.default.updateLocale('nl', {
  calendar: {
    sameDay: '[vandaag om] LT',
    nextDay: '[morgen om] LT',
    nextWeek: 'dddd [om] LT',
    lastDay: '[gisteren om] LT',
    lastWeek: '[afgelopen] dddd [om] LT',
    sameElse: 'L',
  },
});
dayjs_1.default.updateLocale('it', {
  calendar: {
    sameDay: '[Oggi alle] LT',
    nextDay: '[Domani alle] LT',
    nextWeek: 'dddd [alle] LT',
    lastDay: '[Ieri alle] LT',
    lastWeek: '[lo scorso] dddd [alle] LT',
    sameElse: 'L',
  },
});
dayjs_1.default.updateLocale('hi', {
  calendar: {
    sameDay: '[आज] LT',
    nextDay: '[कल] LT',
    nextWeek: 'dddd, LT',
    lastDay: '[कल] LT',
    lastWeek: '[पिछले] dddd, LT',
    sameElse: 'L',
  },
  // Hindi notation for meridiems are quite fuzzy in practice. While there exists
  // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
  meridiemParse: /रात|सुबह|दोपहर|शाम/,
  meridiemHour: function(hour, meridiem) {
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
  },
  meridiem: function(hour) {
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
});
dayjs_1.default.updateLocale('fr', {
  calendar: {
    sameDay: '[Aujourd’hui à] LT',
    nextDay: '[Demain à] LT',
    nextWeek: 'dddd [à] LT',
    lastDay: '[Hier à] LT',
    lastWeek: 'dddd [dernier à] LT',
    sameElse: 'L',
  },
});
dayjs_1.default.updateLocale('tr', {
  calendar: {
    sameDay: '[bugün saat] LT',
    nextDay: '[yarın saat] LT',
    nextWeek: '[gelecek] dddd [saat] LT',
    lastDay: '[dün] LT',
    lastWeek: '[geçen] dddd [saat] LT',
    sameElse: 'L',
  },
});
dayjs_1.default.updateLocale('ru', {
  calendar: {
    sameDay: '[Сегодня, в] LT',
    nextDay: '[Завтра, в] LT',
    lastDay: '[Вчера, в] LT',
  },
});
var en_locale = {
  weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
    '_',
  ),
  months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
    '_',
  ),
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
 * If you would like to stick with english language for datetimes in Stream compoments, you can set `disableDateTimeTranslations` to true.
 *
 */
var defaultStreami18nOptions = {
  language: 'en',
  disableDateTimeTranslations: false,
  debug: false,
  logger: function(msg) {
    return console.warn(msg);
  },
  dayjsLocaleConfigForLanguage: null,
  DateTimeParser: dayjs_1.default,
};
var Streami18n = /** @class */ (function() {
  /**
   * Contructor accepts following options:
   *  - language (String) default: 'en'
   *    Language code e.g., en, tr
   *
   *  - translationsForLanguage (object)
   *    Translations object. Please check src/i18n/en.json for example.
   *
   *  - disableDateTimeTranslations (boolean) default: false
   *    Disable translations for datetimes
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
  function Streami18n(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var _this = this;
    if (options === void 0) {
      options = {};
    }
    this.i18nInstance = i18next_1.default.createInstance();
    this.Dayjs = null;
    this.setLanguageCallback = function() {
      return null;
    };
    this.initialized = false;
    this.t = null;
    this.tDateTimeParser = null;
    this.translations = {
      en: ((_a = {}), (_a[defaultNS] = i18n_1.enTranslations), _a),
      nl: ((_b = {}), (_b[defaultNS] = i18n_1.nlTranslations), _b),
      ru: ((_c = {}), (_c[defaultNS] = i18n_1.ruTranslations), _c),
      tr: ((_d = {}), (_d[defaultNS] = i18n_1.trTranslations), _d),
      fr: ((_e = {}), (_e[defaultNS] = i18n_1.frTranslations), _e),
      hi: ((_f = {}), (_f[defaultNS] = i18n_1.hiTranslations), _f),
      it: ((_g = {}), (_g[defaultNS] = i18n_1.itTranslations), _g),
    };
    /**
     * dayjs.defineLanguage('nl') also changes the global locale. We don't want to do that
     * when user calls registerTranslation() function. So intead we will store the locale configs
     * given to registerTranslation() function in `dayjsLocales` object, and register the required locale
     * with moment, when setLanguage is called.
     * */
    this.dayjsLocales = {};
    this.localeExists = function(language) {
      if (_this.isCustomDateTimeParser) return true;
      return Object.keys(dayjs_1.default.Ls).indexOf(language) > -1;
    };
    this.validateCurrentLanguage = function() {
      var availableLanguages = Object.keys(_this.translations);
      if (availableLanguages.indexOf(_this.currentLanguage) === -1) {
        _this.logger(
          "Streami18n: '" +
            _this.currentLanguage +
            "' language is not registered." +
            (" Please make sure to call streami18n.registerTranslation('" +
              _this.currentLanguage +
              "', {...}) or ") +
            ('use one the built-in supported languages - ' +
              _this.getAvailableLanguages()),
        );
        _this.currentLanguage = defaultLng;
      }
    };
    /** Returns an instance of i18next used within this class instance */
    this.geti18Instance = function() {
      return _this.i18nInstance;
    };
    /** Returns list of available languages. */
    this.getAvailableLanguages = function() {
      return Object.keys(_this.translations);
    };
    /** Returns all the translation dictionary for all inbuilt-languages */
    this.getTranslations = function() {
      return _this.translations;
    };
    var finalOptions = __assign(
      __assign({}, defaultStreami18nOptions),
      options,
    );
    // Prepare the i18next configuration.
    this.logger = finalOptions.logger;
    this.currentLanguage = finalOptions.language;
    this.DateTimeParser = finalOptions.DateTimeParser;
    try {
      // This is a shallow check to see if given parser is instance of Dayjs.
      // For some reason Dayjs.isDayjs(this.DateTimeParser()) doesn't work.
      if (this.DateTimeParser && this.DateTimeParser.extend) {
        this.DateTimeParser.extend(localizedFormat_1.default);
        this.DateTimeParser.extend(calendar_1.default);
        this.DateTimeParser.extend(localeData_1.default);
        this.DateTimeParser.extend(relativeTime_1.default);
      }
    } catch (error) {
      throw Error(
        'Streami18n: Looks like you wanted to provide Dayjs instance, but something went wrong while adding plugins',
        error,
      );
    }
    this.isCustomDateTimeParser = !!options.DateTimeParser;
    var translationsForLanguage = finalOptions.translationsForLanguage;
    if (translationsForLanguage) {
      this.translations[this.currentLanguage] =
        ((_h = {}), (_h[defaultNS] = translationsForLanguage), _h);
    }
    // If translations don't exist for given language, then set it as empty object.
    if (!this.translations[this.currentLanguage]) {
      this.translations[this.currentLanguage] =
        ((_j = {}), (_j[defaultNS] = {}), _j);
    }
    this.i18nextConfig = {
      nsSeparator: false,
      keySeparator: false,
      fallbackLng: false,
      debug: finalOptions.debug,
      lng: this.currentLanguage,
      interpolation: { escapeValue: false },
      parseMissingKeyHandler: function(key) {
        _this.logger('Streami18n: Missing translation for key: ' + key);
        return key;
      },
    };
    this.validateCurrentLanguage(this.currentLanguage);
    var dayjsLocaleConfigForLanguage =
      finalOptions.dayjsLocaleConfigForLanguage;
    if (dayjsLocaleConfigForLanguage) {
      this.addOrUpdateLocale(
        this.currentLanguage,
        __assign({}, dayjsLocaleConfigForLanguage),
      );
    } else if (!this.localeExists(this.currentLanguage)) {
      this.logger(
        'Streami18n: Streami18n(...) - Locale config for ' +
          this.currentLanguage +
          ' does not exist in momentjs.' +
          ('Please import the locale file using "import \'moment/locale/' +
            this.currentLanguage +
            '\';" in your app or ') +
          'register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)',
      );
    }
    this.tDateTimeParser = function(timestamp) {
      if (
        finalOptions.disableDateTimeTranslations ||
        !_this.localeExists(_this.currentLanguage)
      ) {
        return _this.DateTimeParser(timestamp).locale(defaultLng);
      }
      return _this.DateTimeParser(timestamp).locale(_this.currentLanguage);
    };
  }
  /**
   * Initializes the i18next instance with configuration (which enables natural language as default keys)
   */
  Streami18n.prototype.init = function() {
    return __awaiter(this, void 0, void 0, function() {
      var _a, e_1;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            this.validateCurrentLanguage();
            _b.label = 1;
          case 1:
            _b.trys.push([1, 3, , 4]);
            _a = this;
            return [
              4 /*yield*/,
              this.i18nInstance.init(
                __assign(__assign({}, this.i18nextConfig), {
                  resources: this.translations,
                  lng: this.currentLanguage,
                }),
              ),
            ];
          case 2:
            _a.t = _b.sent();
            this.initialized = true;
            return [
              2 /*return*/,
              {
                t: this.t,
                tDateTimeParser: this.tDateTimeParser,
              },
            ];
          case 3:
            e_1 = _b.sent();
            this.logger('Something went wrong with init:', e_1);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Returns current version translator function.
   */
  Streami18n.prototype.getTranslators = function() {
    return __awaiter(this, void 0, void 0, function() {
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            if (!!this.initialized) return [3 /*break*/, 2];
            if (this.dayjsLocales[this.currentLanguage]) {
              this.addOrUpdateLocale(
                this.currentLanguage,
                this.dayjsLocales[this.currentLanguage],
              );
            }
            return [4 /*yield*/, this.init()];
          case 1:
            return [2 /*return*/, _a.sent()];
          case 2:
            return [
              2 /*return*/,
              {
                t: this.t,
                tDateTimeParser: this.tDateTimeParser,
              },
            ];
        }
      });
    });
  };
  /**
   * Register translation
   *
   * @param {*} language
   * @param {*} translation
   * @param {*} customDayjsLocale
   */
  Streami18n.prototype.registerTranslation = function(
    language,
    translation,
    customDayjsLocale,
  ) {
    var _a;
    if (!translation) {
      this.logger(
        'Streami18n: registerTranslation(language, translation, customDayjsLocale) called without translation',
      );
      return;
    }
    if (!this.translations[language]) {
      this.translations[language] =
        ((_a = {}), (_a[defaultNS] = translation), _a);
    } else {
      this.translations[language][defaultNS] = translation;
    }
    if (customDayjsLocale) {
      this.dayjsLocales[language] = __assign({}, customDayjsLocale);
    } else if (!this.localeExists(language)) {
      this.logger(
        'Streami18n: registerTranslation(language, translation, customDayjsLocale) - ' +
          ('Locale config for ' + language + ' does not exist in Dayjs.') +
          ('Please import the locale file using "import \'dayjs/locale/' +
            language +
            '\';" in your app or ') +
          'register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)',
      );
    }
    if (this.initialized) {
      this.i18nInstance.addResources(language, defaultNS, translation);
    }
  };
  Streami18n.prototype.addOrUpdateLocale = function(key, config) {
    if (this.localeExists(key)) {
      dayjs_1.default.updateLocale(key, __assign({}, config));
    } else {
      // Merging the custom locale config with en config, so missing keys can default to english.
      dayjs_1.default.locale(
        __assign({ name: key }, __assign(__assign({}, en_locale), config)),
        null,
        true,
      );
    }
  };
  /**
   * Changes the language.
   * @param {*} language
   */
  Streami18n.prototype.setLanguage = function(language) {
    return __awaiter(this, void 0, void 0, function() {
      var t, e_2;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            this.currentLanguage = language;
            if (!this.initialized) return [2 /*return*/];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, this.i18nInstance.changeLanguage(language)];
          case 2:
            t = _a.sent();
            if (this.dayjsLocales[language]) {
              this.addOrUpdateLocale(
                this.currentLanguage,
                this.dayjsLocales[this.currentLanguage],
              );
            }
            this.setLanguageCallback(t);
            return [2 /*return*/, t];
          case 3:
            e_2 = _a.sent();
            this.logger('Failed to set language:', e_2);
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   *
   * @param {*} callback
   */
  Streami18n.prototype.registerSetLanguageCallback = function(callback) {
    this.setLanguageCallback = callback;
  };
  return Streami18n;
})();
exports.Streami18n = Streami18n;
