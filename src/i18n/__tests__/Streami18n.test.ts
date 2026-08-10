/* eslint-disable */
import { Streami18n } from '../Streami18n';
import type { Streami18nOptions } from '../Streami18n';
import type { TranslationDictionary } from '../types';
import { nanoid } from 'nanoid';
import { default as Dayjs } from 'dayjs';
import moment from 'moment-timezone';
import { fromPartial } from '@total-typescript/shoehorn';
// Only the `en` dayjs locale ships with the SDK; integrators import the ones they need,
// exactly as this test does.
import 'dayjs/locale/nl';
import 'dayjs/locale/fr';
import localeData from 'dayjs/plugin/localeData';
import { getDateString } from '../utils';
import { NotificationTranslationTopic } from '../TranslationBuilder';
import type { TranslationTopicConstructor } from '../TranslationBuilder';
Dayjs.extend(localeData);

const customDayjsLocaleConfig = {
  months:
    'januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember'.split(
      '_',
    ),
  monthsShort: 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
  weekdays:
    'sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur'.split(
      '_',
    ),
  weekdaysShort: 'sun_mán_týs_mik_hós_frí_ley'.split('_'),
  weekdaysMin: 'su_má_tý_mi_hó_fr_le'.split('_'),
  formats: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd D. MMMM, YYYY HH:mm',
  },
  calendar: {
    sameDay: '[Í dag kl.] LT',
    nextDay: '[Í morgin kl.] LT',
    nextWeek: 'dddd [kl.] LT',
    lastDay: '[Í gjár kl.] LT',
    lastWeek: '[síðstu] dddd [kl] LT',
    sameElse: 'L',
  },
  relativeTime: {
    future: 'um %s',
    past: '%s síðani',
    s: 'fá sekund',
    ss: '%d sekundir',
    m: 'ein minutt',
    mm: '%d minuttir',
    h: 'ein tími',
    hh: '%d tímar',
    d: 'ein dagur',
    dd: '%d dagar',
    M: 'ein mánaði',
    MM: '%d mánaðir',
    y: 'eitt ár',
    yy: '%d ár',
  },
  dayOfMonthOrdinalParse: /\d{1,2}\./,
  ordinal: '%d.',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
};

describe('Jest Timezone', () => {
  it('global config should set the timezone to UTC', () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});

const streami18nOptions = { logger: () => null };
describe('Streami18n instance - default', () => {
  const streami18n = new Streami18n(streami18nOptions);

  it('should provide default english translator', async () => {
    const { t: _t } = await streami18n.getTranslators();
    const text = nanoid();

    expect(_t(text)).toBe(text);
  });

  it('should provide moment with default en locale', async () => {
    const { tDateTimeParser } = await streami18n.getTranslators();
    expect(tDateTimeParser() instanceof Dayjs).toBe(true);
    expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('en');
  });
});

// `en` is the only bundled language. Non-English support is entirely integrator-supplied,
// so these tests exercise that path rather than deleted built-in dictionaries.
const dutchTranslations = {
  'messageList.empty': 'Nog niets...',
  'messageComposer.sendButton.label': 'Verstuur bericht',
};

// Only the keys that cannot carry an inline default are bundled (see src/i18n/runtimeDefaults.ts).
// Everything else renders from the English copy passed inline at its call site, which means these
// tests exercise the resolution path the whole design depends on.
describe('Streami18n - resolution without a bundled prose resource', () => {
  it('renders a prose key from its inline default, not the key', async () => {
    const streami18n = new Streami18n({ logger: () => null });
    const { t: _t } = await streami18n.getTranslators();

    expect(_t('message.status.sent.text', 'Sent')).toBe('Sent');
  });

  it('interpolates into an inline default', async () => {
    const streami18n = new Streami18n({ logger: () => null });
    const { t: _t } = await streami18n.getTranslators();

    expect(
      _t(
        'a11y.incomingMessageAnnouncements.newMessage.label',
        'New message from {{user}}',
        {
          user: 'Ada',
        },
      ),
    ).toBe('New message from Ada');
  });

  it('selects the plural form from the inline defaults', async () => {
    const streami18n = new Streami18n({ logger: () => null });
    const { t: _t } = await streami18n.getTranslators();
    const options = {
      defaultValue_one: '{{ count }} member',
      defaultValue_other: '{{ count }} members',
    };

    expect(
      _t('channelDetail.channelMembersView.members.title', { ...options, count: 1 }),
    ).toBe('1 member');
    expect(
      _t('channelDetail.channelMembersView.members.title', { ...options, count: 4 }),
    ).toBe('4 members');
  });

  it('resolves the bundled keys that have no inline default', async () => {
    const streami18n = new Streami18n({ logger: () => null });
    const { t: _t } = await streami18n.getTranslators();

    // language names are keyed off a runtime language code
    expect(_t('language.de')).toBe('German');
    // formatter expressions are passed around as prop values, never written inline
    expect(_t('timestamp.MessageTimestamp', { timestamp: new Date(0) })).not.toBe(
      'timestamp.MessageTimestamp',
    );
  });

  it('does not report a prose key to parseMissingKeyHandler, and keeps its copy', async () => {
    const parseMissingKeyHandler = vi.fn(() => 'CLOBBERED');
    const streami18n = new Streami18n({ logger: () => null, parseMissingKeyHandler });
    const { t: _t } = await streami18n.getTranslators();

    // Unguarded, i18next would replace the result with the handler's return value.
    expect(_t('message.status.sent.text', 'Sent')).toBe('Sent');
    expect(parseMissingKeyHandler).not.toHaveBeenCalled();
  });

  it('still reports a genuinely unknown key to parseMissingKeyHandler', async () => {
    const parseMissingKeyHandler = vi.fn(() => 'HANDLED');
    const streami18n = new Streami18n({ logger: () => null, parseMissingKeyHandler });
    const { t: _t } = await streami18n.getTranslators();

    const unknown = `nonexistent.${nanoid()}`;
    // @ts-expect-error deliberately outside the key union
    expect(_t(unknown)).toBe('HANDLED');
    expect(parseMissingKeyHandler).toHaveBeenCalledWith(unknown, undefined);
  });
});

describe('Streami18n instance - with an integrator-registered language', () => {
  describe('datetime translations enabled', () => {
    const streami18n = new Streami18n({ language: 'nl', logger: () => null });
    streami18n.registerTranslation(
      'nl',
      // @ts-expect-error partial translations for testing
      dutchTranslations,
    );

    it('should translate the registered keys', async () => {
      const { t: _t } = await streami18n.getTranslators();
      for (const [key, value] of Object.entries(dutchTranslations)) {
        expect(_t(key)).toBe(value);
      }
    });

    it('should fall back to the key for unregistered keys', async () => {
      const { t: _t } = await streami18n.getTranslators();
      const missing = nanoid();
      expect(_t(missing)).toBe(missing);
    });

    it('should provide dayjs with `nl` locale', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('nl');
    });
  });

  describe('datetime translations disabled', () => {
    const streami18n = new Streami18n({
      language: 'nl',
      disableDateTimeTranslations: true,
      logger: () => null,
    });
    streami18n.registerTranslation(
      'nl',
      // @ts-expect-error partial translations for testing
      dutchTranslations,
    );

    it('should translate the registered keys', async () => {
      const { t: _t } = await streami18n.getTranslators();
      for (const [key, value] of Object.entries(dutchTranslations)) {
        expect(_t(key)).toBe(value);
      }
    });

    it('should provide dayjs with default `en` locale', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('en');
    });
  });

  describe('custom momentjs locale config', () => {
    const streami18nOptions: Streami18nOptions = {
      language: 'nl',
      dayjsLocaleConfigForLanguage: fromPartial(customDayjsLocaleConfig),
    };
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide moment with given custom locale config', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      const localeConfig = (tDateTimeParser() as Dayjs.Dayjs).localeData();
      for (const key in streami18nOptions.dayjsLocaleConfigForLanguage) {
        if (localeConfig[key]) {
          expect(
            typeof localeConfig[key] === 'function'
              ? localeConfig[key]()
              : localeConfig[key],
          ).toStrictEqual(streami18nOptions.dayjsLocaleConfigForLanguage[key]);
        }
      }
    });
  });
});

describe('Streami18n instance - with custom translations', () => {
  describe('datetime translations enabled', () => {
    const textKey1 = 'this is text one';
    const textValue1 = '这是文字一';
    const textKey2 = 'this is text two';
    const textValue2 = '这是文字二';
    const translations = {
      [textKey1]: textValue1,
      [textKey2]: textValue2,
    };
    // Note: original test had typo 'langauge' instead of 'language'
    const streami18nOptions = {
      translationsForLanguage:
        translations as unknown as Streami18nOptions['translationsForLanguage'],
    } satisfies Streami18nOptions;
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide given (chinese in this case) translator', async () => {
      const { t: _t } = await streami18n.getTranslators();

      expect(_t(textKey1)).toBe(textValue1);

      expect(_t(textKey2)).toBe(textValue2);
    });

    it('should provide moment with default `en` locale', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('en');
    });
  });
});

describe('registerTranslation - register new language `mr` (Marathi) ', () => {
  const streami18nOptions = {
    language: 'en',
    disableDateTimeTranslations: false,
  };
  const streami18n = new Streami18n(streami18nOptions);
  const languageCode = 'mr';
  const translations = {
    text1: 'अनुवादित मजकूर 1',
    text2: 'अनुवादित मजकूर 2',
  };
  streami18n.registerTranslation(
    languageCode,
    // @ts-expect-error partial translations for testing
    translations,
    customDayjsLocaleConfig,
  );

  streami18n.setLanguage('mr');

  it('should add Marathi translations object to list of translations', () => {
    // Merged over `runtimeDefaults` rather than stored verbatim — the keys with no inline
    // `defaultValue` have to survive, or every timestamp renders as its raw key.
    expect(streami18n.getTranslations()[languageCode].translation).toMatchObject(
      translations,
    );
    expect(streami18n.getTranslations()[languageCode].translation).toHaveProperty(
      'timestamp.MessageTimestamp',
    );
  });

  it('should register moment locale config for Marathi translations', async () => {
    const { tDateTimeParser } = await streami18n.getTranslators();
    expect(tDateTimeParser() instanceof Dayjs).toBe(true);

    const localeConfig = (tDateTimeParser() as Dayjs.Dayjs).localeData();
    for (const key in customDayjsLocaleConfig) {
      if (localeConfig[key]) {
        expect(customDayjsLocaleConfig[key]).toStrictEqual(
          typeof localeConfig[key] === 'function'
            ? localeConfig[key]()
            : localeConfig[key],
        );
      }
    }
  });
});

describe('setLanguage - switch to a registered language', () => {
  const frenchTranslations = {
    'messageList.empty': 'Rien pour le moment...',
    'messageComposer.sendButton.label': 'Envoyer le message',
  };

  it('should provide the french translator after switching', async () => {
    const streami18n = new Streami18n({ logger: () => null });
    streami18n.registerTranslation(
      'fr',
      // @ts-expect-error partial translations for testing
      frenchTranslations,
    );

    // English before the switch: an unknown key resolves to itself.
    const { t: beforeT } = await streami18n.getTranslators();
    expect(beforeT('messageList.empty')).toBe('messageList.empty');

    await streami18n.setLanguage('fr');

    const { t: _t } = await streami18n.getTranslators();
    for (const [key, value] of Object.entries(frenchTranslations)) {
      expect(_t(key)).toBe(value);
    }
  });

  it('should fall back to the key for an unregistered language', async () => {
    // An unknown language gets an empty dictionary rather than being rejected, so every
    // key resolves to itself — which is the inline English default at each call site.
    const streami18n = new Streami18n({ language: 'zz', logger: () => null });
    const { t: _t } = await streami18n.getTranslators();

    expect(streami18n.currentLanguage).toBe('zz');
    expect(_t('messageComposer.sendButton.label')).toBe(
      'messageComposer.sendButton.label',
    );
  });
});

describe('Streami18n timezone', () => {
  describe.each([
    ['Dayjs', Dayjs],
    ['moment', moment],
  ])('%s', (moduleName, module) => {
    it('is by default the local timezone', () => {
      const streamI18n = new Streami18n({ DateTimeParser: module });
      const date = new Date();
      expect((streamI18n.tDateTimeParser(date) as Dayjs.Dayjs).format('H')).toBe(
        date.getHours().toString(),
      );
    });

    it('can be set to different timezone on init', () => {
      const streamI18n = new Streami18n({
        DateTimeParser: module,
        timezone: 'Europe/Prague',
      });
      const date = new Date();
      expect((streamI18n.tDateTimeParser(date) as Dayjs.Dayjs).format('H')).not.toBe(
        date.getHours().toString(),
      );
      expect((streamI18n.tDateTimeParser(date) as Dayjs.Dayjs).format('H')).not.toBe(
        (date.getUTCHours() - 2).toString(),
      );
    });

    it('is ignored if datetime parser does not support timezones', () => {
      const moduleRecord = module as unknown as Record<string, unknown>;
      const tz = moduleRecord.tz;
      delete moduleRecord.tz;

      const streamI18n = new Streami18n({
        DateTimeParser: module,
        timezone: 'Europe/Prague',
      });
      const date = new Date();
      expect((streamI18n.tDateTimeParser(date) as Dayjs.Dayjs).format('H')).toBe(
        date.getHours().toString(),
      );

      moduleRecord.tz = tz;
    });
    describe('formatters property', () => {
      it('contains the default timestampFormatter', () => {
        expect(new Streami18n().formatters.timestampFormatter).toBeDefined();
      });
      // `value` has to be supplied: an undefined interpolation value short-circuits before the
      // formatter is consulted, so omitting it would assert nothing about formatter registration.
      it('allows to override the default timestampFormatter', async () => {
        const i18n = new Streami18n({
          formatters: { timestampFormatter: () => () => 'custom' },
          translationsForLanguage: {
            abc: '{{ value | timestampFormatter }}',
          } as unknown as Streami18nOptions['translationsForLanguage'],
        });
        await i18n.init();
        expect(i18n.t('abc', { value: new Date(0) })).toBe('custom');
      });
      it('allows to add new custom formatter', async () => {
        const i18n = new Streami18n({
          formatters: { customFormatter: () => () => 'custom' },
          translationsForLanguage: {
            abc: '{{ value | customFormatter }}',
          } as unknown as Streami18nOptions['translationsForLanguage'],
        });
        await i18n.init();
        expect(i18n.t('abc', { value: 'anything' })).toBe('custom');
      });
    });
  });
});

describe('Streami18n translationBuilder', () => {
  it('is created at construction time', () => {
    const streami18n = new Streami18n(streami18nOptions);
    expect(streami18n.translationBuilder).toBeDefined();
    expect(streami18n.translationBuilder['topics'].size).toBe(0);
  });
  it('registers topics on init', async () => {
    const streami18n = new Streami18n(streami18nOptions);
    await streami18n.init();
    expect(streami18n.translationBuilder).toBeDefined();
    expect(streami18n.translationBuilder['topics'].size).toBe(1);
    expect(streami18n.translationBuilder.getTopic('notification')).toBeInstanceOf(
      NotificationTranslationTopic,
    );
  });

  it('registers custom topics', async () => {
    class CustomTopic {
      constructor() {}
    }
    const streami18n = new Streami18n({
      ...streami18nOptions,
      translationBuilderTopics: {
        test: CustomTopic as unknown as TranslationTopicConstructor,
      },
    });
    await streami18n.init();
    expect(streami18n.translationBuilder).toBeDefined();
    expect(streami18n.translationBuilder['topics'].size).toBe(2);
    expect(streami18n.translationBuilder.getTopic('notification')).toBeInstanceOf(
      NotificationTranslationTopic,
    );
    expect(streami18n.translationBuilder.getTopic('test')).toBeInstanceOf(CustomTopic);
  });

  it('overrides default topics', async () => {
    class CustomNotificationTranslationTopic {
      constructor() {}
    }
    const streami18n = new Streami18n({
      ...streami18nOptions,
      translationBuilderTopics: {
        notification:
          CustomNotificationTranslationTopic as unknown as TranslationTopicConstructor,
      },
    });
    await streami18n.init();
    expect(streami18n.translationBuilder).toBeDefined();
    expect(streami18n.translationBuilder['topics'].size).toBe(1);
    expect(streami18n.translationBuilder.getTopic('notification')).toBeInstanceOf(
      CustomNotificationTranslationTopic,
    );
  });
});

describe('Streami18n - a custom dictionary keeps the keys that have no inline copy', () => {
  // The 71 `runtimeDefaults` entries are the only keys with no `defaultValue` at their call site,
  // and `fallbackLng` is false. A dictionary that replaced rather than merged left them
  // unresolvable, so every timestamp in the UI rendered as the literal key.
  const TIMESTAMP = '2024-01-01T10:30:00.000Z';

  it.each([
    ['registerTranslation, language registered before init', 'de', false],
    ['registerTranslation, language registered after init', 'de', true],
  ])('%s', async (_name, language, afterInit) => {
    const i18n = new Streami18n({ language: language as 'en' });
    if (!afterInit)
      i18n.registerTranslation(language, { 'common.cancel.label': 'Abbrechen' });
    const first = await i18n.getTranslators();
    if (afterInit) {
      i18n.registerTranslation(language, { 'common.cancel.label': 'Abbrechen' });
    }
    const { t } = afterInit ? await i18n.getTranslators() : first;

    expect(t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });

  it('translationsForLanguage for a non-English language', async () => {
    const i18n = new Streami18n({
      language: 'de' as 'en',
      translationsForLanguage: { 'common.cancel.label': 'Abbrechen' },
    });
    const { t } = await i18n.getTranslators();

    expect(t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });

  it('overriding English does not drop the formatter keys', async () => {
    const i18n = new Streami18n();
    i18n.registerTranslation('en', { 'common.cancel.label': 'Dismiss' });
    const { t } = await i18n.getTranslators();

    expect(t('common.cancel.label', 'Cancel')).toBe('Dismiss');
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });

  it('an explicit override of a formatter key still wins', async () => {
    const i18n = new Streami18n();
    i18n.registerTranslation('en', {
      'timestamp.MessageTimestamp': '{{ timestamp | timestampFormatter(format: HH[h]) }}',
    });
    const { t } = await i18n.getTranslators();

    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10h');
  });

  it('repeated registrations for one language accumulate', async () => {
    const i18n = new Streami18n();
    i18n.registerTranslation('en', { 'common.cancel.label': 'Dismiss' });
    i18n.registerTranslation('en', { 'common.send.label': 'Fire away' });
    const { t } = await i18n.getTranslators();

    expect(t('common.cancel.label', 'Cancel')).toBe('Dismiss');
    expect(t('common.send.label', 'Send')).toBe('Fire away');
  });

  it('does not mutate the shared runtimeDefaults module object', async () => {
    const first = new Streami18n();
    first.registerTranslation('en', {
      'timestamp.MessageTimestamp': '{{ timestamp | timestampFormatter(format: HH[h]) }}',
    });
    await first.getTranslators();

    const second = new Streami18n();
    const { t } = await second.getTranslators();
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });
});

describe('Streami18n - dictionary key types', () => {
  // Compile-time contract, asserted here so it cannot regress silently. TranslationDictionary
  // must accept the `_one`/`_other` plural entries a translator has to supply — keying a dictionary
  // on TranslationKey rejects them, because that union is what `t()` takes (the bare handle).
  it('accepts plural forms and rejects stale keys, and both resolve at runtime', async () => {
    const de: TranslationDictionary = {
      'common.cancel.label': 'Abbrechen',
      'channelDetail.channelMembersView.members.title_one': '{{ count }} Mitglied',
      'channelDetail.channelMembersView.members.title_other': '{{ count }} Mitglieder',
    };
    const stale: TranslationDictionary = {
      // @ts-expect-error 'Cancel' is a v14 natural-language key and is not in the catalog
      Cancel: 'Abbrechen',
    };
    expect(stale).toBeDefined();

    const i18n = new Streami18n({ language: 'de' as 'en', logger: () => null });
    i18n.registerTranslation('de' as 'en', de);
    const { t: _t } = await i18n.getTranslators();

    const options = {
      defaultValue_one: '{{ count }} member',
      defaultValue_other: '{{ count }} members',
    };
    expect(_t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
    expect(
      _t('channelDetail.channelMembersView.members.title', { ...options, count: 1 }),
    ).toBe('1 Mitglied');
    expect(
      _t('channelDetail.channelMembersView.members.title', { ...options, count: 4 }),
    ).toBe('4 Mitglieder');
  });
});

describe('Streami18n - a language nobody registered still formats dates', () => {
  // Only `registerTranslation` and `translationsForLanguage` used to layer `runtimeDefaults`.
  // Selecting a language without supplying a dictionary — the recipe in the migration guide's
  // "Date and time" section, for an app that wants localized dates but is happy with English
  // copy — fell through to an empty dictionary, so `duration.*` rendered as its raw key and every
  // timestamp came out as an unformatted ISO string.
  const TIMESTAMP = '2024-01-01T10:30:00.000Z';

  const stamp = (i18n: Streami18n, key = 'timestamp.MessageTimestamp') =>
    getDateString({
      messageCreatedAt: TIMESTAMP,
      t: i18n.t,
      tDateTimeParser: i18n.tDateTimeParser,
      timestampTranslationKey: key,
    });

  it('language is selected but no dictionary is registered', async () => {
    const i18n = new Streami18n({ language: 'de' as 'en', logger: () => null });
    const { t } = await i18n.getTranslators();

    expect(stamp(i18n)).toBe('10:30');
    expect(stamp(i18n, 'timestamp.DateSeparator')).toBe('Mon, 1 Jan');
    expect(t('duration.remindMe', { milliseconds: 600000 })).toBe('in 10 minutes');
    // The postProcessor directive is bundled too, and drives the notification topic.
    expect(i18n.getTranslations()['de'].translation).toHaveProperty(
      'translationBuilderTopic.notification',
    );
    // Copy falls back to the inline English default, which is the documented trade-off.
    expect(t('common.cancel.label', 'Cancel')).toBe('Cancel');
  });

  it('language is selected with a dayjs locale config and no dictionary', async () => {
    const i18n = new Streami18n({
      language: 'nl' as 'en',
      logger: () => null,
      dayjsLocaleConfigForLanguage: customDayjsLocaleConfig,
    });
    await i18n.getTranslators();

    expect(stamp(i18n)).toBe('10:30');
  });

  it('keeps the selected language rather than silently reverting to English', async () => {
    // `language: 'de'` followed by `registerTranslation('de', …)` is the documented flow, so the
    // constructor must not reset `currentLanguage` when the dictionary has not arrived yet.
    const i18n = new Streami18n({ language: 'de' as 'en', logger: () => null });
    i18n.registerTranslation('de' as 'en', { 'common.cancel.label': 'Abbrechen' });
    const { t } = await i18n.getTranslators();

    expect(i18n.currentLanguage).toBe('de');
    expect(t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
  });
});

describe('Streami18n - setLanguage to a language nobody registered', () => {
  const TIMESTAMP = '2024-01-01T10:30:00.000Z';
  const stamp = (i18n: Streami18n) =>
    getDateString({
      messageCreatedAt: TIMESTAMP,
      t: i18n.t,
      tDateTimeParser: i18n.tDateTimeParser,
      timestampTranslationKey: 'timestamp.MessageTimestamp',
    });

  // Switching after init used to bypass every guard: no warning, and no resource bundle for the
  // new language, so dates broke. Before init the same call warned and fell back to English —
  // the outcome depended on whether <Chat> had mounted yet.
  it.each([
    ['before init', false],
    ['after init', true],
  ])('%s', async (_name, afterInit) => {
    const logger = vi.fn();
    const i18n = new Streami18n({ logger });
    if (afterInit) await i18n.getTranslators();

    await i18n.setLanguage('de' as 'en');
    if (!afterInit) await i18n.getTranslators();

    expect(i18n.currentLanguage).toBe('de');
    expect(stamp(i18n)).toBe('10:30');
    expect(i18n.t('duration.remindMe', { milliseconds: 600000 })).toBe('in 10 minutes');
    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining("no translation dictionary is registered for 'de'"),
    );
  });

  it('does not clobber a dictionary registered for that language', async () => {
    const i18n = new Streami18n({ logger: () => null });
    i18n.registerTranslation('de' as 'en', { 'common.cancel.label': 'Abbrechen' });
    await i18n.getTranslators();
    await i18n.setLanguage('de' as 'en');

    expect(i18n.t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
    expect(stamp(i18n)).toBe('10:30');
  });

  it('switching back and forth keeps both dictionaries', async () => {
    const i18n = new Streami18n({ logger: () => null });
    i18n.registerTranslation('de' as 'en', { 'common.cancel.label': 'Abbrechen' });
    await i18n.getTranslators();

    await i18n.setLanguage('de' as 'en');
    expect(i18n.t('common.cancel.label', 'Cancel')).toBe('Abbrechen');

    await i18n.setLanguage('en');
    expect(i18n.t('common.cancel.label', 'Cancel')).toBe('Cancel');

    await i18n.setLanguage('de' as 'en');
    expect(i18n.t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
  });
});

describe('Streami18n - the unregistered-language warning', () => {
  it('is not emitted at construction time, when registerTranslation has yet to run', () => {
    const logger = vi.fn();
    new Streami18n({ language: 'de' as 'en', logger });

    expect(logger).not.toHaveBeenCalledWith(
      expect.stringContaining('no translation dictionary is registered'),
    );
  });

  it('is emitted once, on init, when no dictionary ever arrives', async () => {
    const logger = vi.fn();
    const i18n = new Streami18n({ language: 'de' as 'en', logger });
    await i18n.getTranslators();

    const warnings = logger.mock.calls.filter(([message]) =>
      String(message).includes('no translation dictionary is registered'),
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0][0]).toContain("registerTranslation('de', {...})");
  });

  it('is not emitted when a dictionary was registered before init', async () => {
    const logger = vi.fn();
    const i18n = new Streami18n({ language: 'de' as 'en', logger });
    i18n.registerTranslation('de' as 'en', { 'common.cancel.label': 'Abbrechen' });
    await i18n.getTranslators();

    expect(logger).not.toHaveBeenCalledWith(
      expect.stringContaining('no translation dictionary is registered'),
    );
  });

  it('is not emitted when translationsForLanguage supplied the dictionary', async () => {
    const logger = vi.fn();
    const i18n = new Streami18n({
      language: 'de' as 'en',
      logger,
      translationsForLanguage: { 'common.cancel.label': 'Abbrechen' },
    });
    await i18n.getTranslators();

    expect(logger).not.toHaveBeenCalledWith(
      expect.stringContaining('no translation dictionary is registered'),
    );
  });
});
