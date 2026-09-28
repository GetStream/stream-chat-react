/* eslint-disable */
import { Streami18n } from '../Streami18n';
import type { Streami18nOptions } from '../Streami18n';
import type { LooseTranslationDictionary, TranslationDictionary } from '../types';
import type { TranslationCatalog } from '../keys';
import { asDynamicKey, getDateString } from '../utils';
import { runtimeDefaults } from '../runtimeDefaults';
import { NotificationTranslationTopic } from '../TranslationBuilder';
import type { TranslationTopicConstructor } from '../TranslationBuilder';

const relativeDay = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString();
};

describe('Jest Timezone', () => {
  it('global config should set the timezone to UTC', () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});

const streami18nOptions = { logger: () => null };
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
    const first = await i18n.init();
    if (afterInit) {
      i18n.registerTranslation(language, { 'common.cancel.label': 'Abbrechen' });
    }
    const { t } = afterInit ? await i18n.init() : first;

    expect(t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });

  it('translationsForLanguage for a non-English language', async () => {
    const i18n = new Streami18n({
      language: 'de' as 'en',
      translationsForLanguage: { 'common.cancel.label': 'Abbrechen' },
    });
    const { t } = await i18n.init();

    expect(t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });

  it('overriding English does not drop the formatter keys', async () => {
    const i18n = new Streami18n();
    i18n.registerTranslation('en', { 'common.cancel.label': 'Dismiss' });
    const { t } = await i18n.init();

    expect(t('common.cancel.label', 'Cancel')).toBe('Dismiss');
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });

  it('an explicit override of a formatter key still wins', async () => {
    const i18n = new Streami18n();
    i18n.registerTranslation('en', {
      'timestamp.MessageTimestamp': '{{ timestamp | timestampFormatter(format: HH[h]) }}',
    });
    const { t } = await i18n.init();

    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10h');
  });

  it('repeated registrations for one language accumulate', async () => {
    const i18n = new Streami18n();
    i18n.registerTranslation('en', { 'common.cancel.label': 'Dismiss' });
    i18n.registerTranslation('en', { 'common.send.label': 'Fire away' });
    const { t } = await i18n.init();

    expect(t('common.cancel.label', 'Cancel')).toBe('Dismiss');
    expect(t('common.send.label', 'Send')).toBe('Fire away');
  });

  it('does not mutate the shared runtimeDefaults module object', async () => {
    const first = new Streami18n();
    first.registerTranslation('en', {
      'timestamp.MessageTimestamp': '{{ timestamp | timestampFormatter(format: HH[h]) }}',
    });
    await first.init();

    const second = new Streami18n();
    const { t } = await second.init();
    expect(t('timestamp.MessageTimestamp', { timestamp: TIMESTAMP })).toBe('10:30');
  });
});

describe('Streami18n - dictionary key types', () => {
  // The SDK only ships `_one`/`_other`, but a plural key accepts every `Intl.PluralRules` category
  // so a language needing `_few`/`_many`/`_zero` keeps its keys checked instead of widening to
  // LooseTranslationDictionary.
  it('accepts every plural category on a plural key, and resolves them at runtime', async () => {
    const K = 'channelDetail.channelMembersView.members.title';
    const ru: TranslationDictionary = {
      'channelDetail.channelMembersView.members.title_one': '{{ count }} участник',
      'channelDetail.channelMembersView.members.title_few': '{{ count }} участника',
      'channelDetail.channelMembersView.members.title_many': '{{ count }} участников',
      'channelDetail.channelMembersView.members.title_zero': 'нет участников',
    };

    const rejected: TranslationDictionary = {
      // @ts-expect-error common.cancel.label is not a plural key, so it takes no plural suffix
      'common.cancel.label_few': 'x',
    };
    expect(rejected).toBeDefined();

    const i18n = new Streami18n({ language: 'ru' as 'en', logger: () => null });
    i18n.registerTranslation('ru' as 'en', ru);
    const { t } = await i18n.init();
    const options = {
      defaultValue_one: '{{ count }} member',
      defaultValue_other: '{{ count }} members',
    };

    expect(t(K, { ...options, count: 1 })).toBe('1 участник');
    expect(t(K, { ...options, count: 3 })).toBe('3 участника');
    expect(t(K, { ...options, count: 7 })).toBe('7 участников');
  });

  // The completeness diff in ai-docs/i18n-v15-migration.md relies on `as const satisfies`, which
  // has to keep working now that the type is an intersection.
  it('supports the documented `as const satisfies` completeness diff', () => {
    const de = {
      'common.cancel.label': 'Abbrechen',
      'channelDetail.channelMembersView.members.title_few': '{{ count }} Mitglieder',
    } as const satisfies TranslationDictionary;

    type Untranslated = Exclude<keyof TranslationCatalog, keyof typeof de>;
    // The diff is non-empty and still excludes what `de` covers.
    const covered: Untranslated extends 'common.cancel.label' ? false : true = true;
    expect(covered).toBe(true);
    expect(Object.keys(de)).toHaveLength(2);
  });

  // The params are strict, so the default call shape — an inline object literal — is checked.
  // A typo here used to compile and then silently never apply at runtime.
  it('rejects an unknown key passed inline, and still accepts a loose dictionary', async () => {
    const i18n = new Streami18n({ logger: () => null });

    i18n.registerTranslation('en', {
      // @ts-expect-error 'lable' is a typo: not a key in the catalog
      'common.cancel.lable': 'Dismiss',
    });

    new Streami18n({
      logger: () => null,
      translationsForLanguage: {
        // @ts-expect-error v14 natural-language key
        Cancel: 'Dismiss',
      },
    });

    // The escape hatch: a loose-typed variable is still assignable, so an app can carry its own
    // keys and the extra plural categories some languages need.
    const withOwnKeys: LooseTranslationDictionary = {
      'common.cancel.label': 'Dismiss',
      'myApp.somethingElse': 'Hello',
    };
    i18n.registerTranslation('en', withOwnKeys);
    new Streami18n({ logger: () => null, translationsForLanguage: withOwnKeys });

    // Asserted by rendering rather than by reading the resource store, which is no longer exposed:
    // whether the app's own key resolves is the thing that matters, and `getTranslations()` only ever
    // confirmed it had been written down.
    const { t } = await i18n.init();
    expect(t(asDynamicKey('myApp.somethingElse'))).toBe('Hello');
  });

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
    const { t: _t } = await i18n.init();

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

describe('Streami18n - the calendar keys that carry English words', () => {
  // dayjs takes the calendar wording as part of the format string, so a handful of `timestamp.*`
  // values embed English day words. A per-key `calendarFormats` replaces the locale's calendar
  // wholesale, so `dayjsLocaleConfigForLanguage` cannot translate them — only overriding the key
  // can. The migration guide names these four; this keeps that list honest.
  const KEYS_WITH_ENGLISH_WORDS = [
    'timestamp.ChannelDetailPinnedMessageTimestamp',
    'timestamp.ChannelPreviewTimestamp',
    'timestamp.DateSeparator',
    'timestamp.ReminderNotification',
  ];

  it('is exactly the set the migration guide documents', () => {
    const found = Object.entries(runtimeDefaults)
      .filter(([, value]) =>
        [...value.matchAll(/\[([^\]]+)\]/g)].some(([, literal]) =>
          /[A-Za-z]{2}/.test(literal),
        ),
      )
      .map(([key]) => key)
      .sort();

    // A new one here means `ai-docs/i18n-v15-migration.md` ("Keys that are not copy" and
    // "Date and time") needs the key added, or integrators will silently ship English.
    expect(found).toEqual(KEYS_WITH_ENGLISH_WORDS);
  });

  it('renders English for a German app until the key is overridden', async () => {
    const i18n = new Streami18n({
      language: 'de' as 'en',
      logger: () => null,
      dayjsLocaleConfigForLanguage: {
        calendar: {
          sameDay: '[heute um] LT',
          lastDay: '[gestern um] LT',
          lastWeek: '[letzten] dddd [um] LT',
          nextDay: '[morgen um] LT',
          nextWeek: 'dddd [um] LT',
          sameElse: 'L',
        },
      },
    });
    i18n.registerTranslation('de' as 'en', { 'common.cancel.label': 'Abbrechen' });
    const { t, tDateTimeParser } = await i18n.init();
    const stamp = (key: string, when: string) =>
      getDateString({
        messageCreatedAt: when,
        t,
        tDateTimeParser,
        timestampTranslationKey: key,
      });

    // A key that formats against the locale's own calendar picks the config up.
    expect(stamp('timestamp.LiveLocation', relativeDay(0))).toContain('heute um');
    // One that passes its own calendarFormats does not — this is the documented gap.
    expect(stamp('timestamp.DateSeparator', relativeDay(0))).toBe('Today');
    expect(stamp('timestamp.ChannelPreviewTimestamp', relativeDay(-1))).toBe('Yesterday');
  });

  it('translates once the key is overridden, exactly as documented', async () => {
    const i18n = new Streami18n({ language: 'de' as 'en', logger: () => null });
    i18n.registerTranslation('de' as 'en', {
      'timestamp.DateSeparator':
        '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Heute]", "nextDay": "[Morgen]", "lastDay": "[Gestern]", "nextWeek": "dddd", "lastWeek": "[letzten] dddd", "sameElse": "ddd, D. MMM" }) }}',
      'timestamp.ChannelPreviewTimestamp':
        '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Gestern]", "lastWeek": "dddd", "sameElse": "L" }) }}',
    });
    const { t, tDateTimeParser } = await i18n.init();
    const stamp = (key: string, when: string) =>
      getDateString({
        messageCreatedAt: when,
        t,
        tDateTimeParser,
        timestampTranslationKey: key,
      });

    expect(stamp('timestamp.DateSeparator', relativeDay(0))).toBe('Heute');
    expect(stamp('timestamp.DateSeparator', relativeDay(-1))).toBe('Gestern');
    expect(stamp('timestamp.DateSeparator', relativeDay(1))).toBe('Morgen');
    expect(stamp('timestamp.ChannelPreviewTimestamp', relativeDay(-1))).toBe('Gestern');
  });
});
