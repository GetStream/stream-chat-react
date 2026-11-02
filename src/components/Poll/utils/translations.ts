import type { PollResponseData } from 'stream-chat';

/**
 * The translation of one poll text into `language`, or undefined if there is none.
 *
 * The single place that knows the key format of the backend's poll translation maps (`name_i18n`,
 * an option's `text_i18n`, an answer's `answer_text_i18n`). They have the same shape as
 * `message.i18n`: one `<language>_text` entry per language, plus `language`, the source language.
 */
export const getPollTextTranslation = (
  i18n: PollResponseData['name_i18n'],
  language: string,
): string | undefined => i18n?.[`${language}_text`];

/** The poll texts the message-level translation indicator reads. */
export type PollTexts = Pick<PollResponseData, 'name' | 'name_i18n' | 'options'>;

/**
 * Whether the poll's question or any of its options has a translation into `language` that differs
 * from the original. Answers are left out: they are only visible inside the answers dialog, so they
 * must not put a translation indicator on the message.
 */
export const pollHasTranslation = (
  poll: PollTexts | undefined,
  language: string,
): boolean => {
  if (!poll) return false;
  const differs = (i18n: PollResponseData['name_i18n'], original: string) => {
    const translation = getPollTextTranslation(i18n, language);
    return !!translation && translation !== original;
  };
  return (
    differs(poll.name_i18n, poll.name) ||
    !!poll.options?.some((option) => differs(option.text_i18n, option.text))
  );
};

/** The poll's source language code, when the backend sends one (`language` in a translation map). */
export const getPollSourceLanguage = (poll: PollTexts | undefined): string | undefined =>
  poll?.name_i18n?.language ??
  poll?.options?.find((option) => option.text_i18n?.language)?.text_i18n?.language;
