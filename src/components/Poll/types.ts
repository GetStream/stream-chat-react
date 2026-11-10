import type {
  PollOptionResponseData,
  PollResponseData,
  PollVoteResponseData,
} from 'stream-chat';

export type PollTextTranslations = NonNullable<
  | PollResponseData['name_i18n']
  | PollOptionResponseData['text_i18n']
  | PollVoteResponseData['answer_text_i18n']
>;
