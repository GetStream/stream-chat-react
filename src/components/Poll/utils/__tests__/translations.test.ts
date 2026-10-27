import { generatePoll } from '../../../../mock-builders';
import {
  getPollSourceLanguage,
  getPollTextTranslation,
  pollHasTranslation,
} from '../translations';

describe('getPollTextTranslation', () => {
  it('reads the `<language>_text` entry', () => {
    expect(getPollTextTranslation({ es_text: 'Manzanas', language: 'en' }, 'es')).toBe(
      'Manzanas',
    );
  });

  it('reads region-specific codes', () => {
    expect(getPollTextTranslation({ 'es-MX_text': 'Manzanas' }, 'es-MX')).toBe(
      'Manzanas',
    );
  });

  it('never treats the source-language marker as a translation', () => {
    expect(getPollTextTranslation({ language: 'en' }, 'language')).toBeUndefined();
  });

  it('returns undefined without a translation for the language', () => {
    expect(getPollTextTranslation({ fr: 'Pommes' }, 'es')).toBeUndefined();
    expect(getPollTextTranslation(undefined, 'es')).toBeUndefined();
  });
});

describe('pollHasTranslation', () => {
  const untranslated = {
    latest_answers: [],
    name: 'Fruit?',
    name_i18n: undefined,
    options: [{ id: 'a', text: 'Apples' }],
  };

  it('is false for a poll with no translations', () => {
    expect(pollHasTranslation(generatePoll(untranslated), 'es')).toBe(false);
    expect(pollHasTranslation(undefined, 'es')).toBe(false);
  });

  it('is true when the question is translated', () => {
    const poll = generatePoll({ ...untranslated, name_i18n: { es_text: '¿Fruta?' } });
    expect(pollHasTranslation(poll, 'es')).toBe(true);
  });

  it('is true when only an option is translated', () => {
    const poll = generatePoll({
      ...untranslated,
      options: [{ id: 'a', text: 'Apples', text_i18n: { es_text: 'Manzanas' } }],
    });
    expect(pollHasTranslation(poll, 'es')).toBe(true);
  });

  it('ignores translated answers, which only show inside the answers dialog', () => {
    const poll = generatePoll({
      ...untranslated,
      latest_answers: [
        {
          answer_text: 'Tasty',
          answer_text_i18n: { es_text: 'Sabroso' },
          id: 'ans',
          is_answer: true,
        },
      ],
    });
    expect(pollHasTranslation(poll, 'es')).toBe(false);
  });

  it('ignores a translation identical to the original (the source language)', () => {
    const poll = generatePoll({ ...untranslated, name_i18n: { en_text: 'Fruit?' } });
    expect(pollHasTranslation(poll, 'en')).toBe(false);
  });
});

describe('getPollSourceLanguage', () => {
  it('reads `language` from the question translations', () => {
    expect(
      getPollSourceLanguage({
        name: 'Fruit?',
        name_i18n: { es_text: '¿Fruta?', language: 'en' },
        options: [],
      }),
    ).toBe('en');
    expect(
      getPollSourceLanguage({
        name: 'Fruit?',
        name_i18n: undefined,
        options: [{ custom: {}, id: 'a', text: 'Apples' }],
      }),
    ).toBeUndefined();
  });

  it('falls back to an option when the question has no translations', () => {
    expect(
      getPollSourceLanguage({
        name: 'Fruit?',
        name_i18n: undefined,
        options: [
          { custom: {}, id: 'a', text: 'Apples' },
          {
            custom: {},
            id: 'b',
            text: 'Bananas',
            text_i18n: { es_text: 'Plátanos', language: 'en' },
          },
        ],
      }),
    ).toBe('en');
  });
});
