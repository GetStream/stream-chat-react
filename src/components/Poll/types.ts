import type {
  Poll,
  PollOptionResponseData,
  PollResponseData,
  PollVoteResponseData,
} from 'stream-chat';

import type { TranslationView } from '../../context/MessageTranslationViewContext';

export type PollProps = {
  poll: Poll;
  translationView?: TranslationView;
};

export type PollTextTranslations = NonNullable<
  | PollResponseData['name_i18n']
  | PollOptionResponseData['text_i18n']
  | PollVoteResponseData['answer_text_i18n']
>;
