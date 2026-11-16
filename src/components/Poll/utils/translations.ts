import type { PollResponseData } from 'stream-chat';

import type { PollTextTranslations } from '../types';

export const getPollTextTranslation = (
  i18n: PollTextTranslations | undefined,
  language: string,
): string | undefined => i18n?.[`${language}_text`];

export type PollTexts = Pick<PollResponseData, 'name' | 'name_i18n' | 'options'>;

export const pollHasTranslation = (
  poll: PollTexts | undefined,
  language: string,
): boolean => {
  if (!poll) return false;
  const differs = (i18n: PollTextTranslations | undefined, original: string) => {
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
