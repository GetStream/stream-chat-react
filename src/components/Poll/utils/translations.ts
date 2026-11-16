import type { PollResponse, TranslatedField, TranslationLanguages } from 'stream-chat';

export const getPollTextTranslation = (
  i18n: TranslatedField | undefined,
  language: string,
): string | undefined => i18n?.[`${language}_text` as `${TranslationLanguages}_text`];

export type PollTexts = Pick<PollResponse, 'name' | 'name_i18n' | 'options'>;

export const pollHasTranslation = (
  poll: PollTexts | undefined,
  language: string,
): boolean => {
  if (!poll) return false;
  const differs = (i18n: TranslatedField | undefined, original: string) => {
    const translation = getPollTextTranslation(i18n, language);
    return !!translation && translation !== original;
  };
  return (
    differs(poll.name_i18n, poll.name) ||
    !!poll.options?.some((option) => differs(option.text_i18n, option.text))
  );
};

export const getPollSourceLanguage = (poll: PollTexts | undefined): string | undefined =>
  poll?.name_i18n?.language ??
  poll?.options?.find((option) => option.text_i18n?.language)?.text_i18n?.language;
