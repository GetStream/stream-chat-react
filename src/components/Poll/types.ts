import type {
  Poll,
  PollOptionResponseData,
  PollResponseData,
  PollVoteResponseData,
} from 'stream-chat';

import type { TranslationView } from '../../context/MessageTranslationViewContext';

export type PollProps = {
  poll: Poll;
  /**
   * The message's current translation view. Pass `useMessageContext().translationView` so the poll
   * follows the message's original/translated toggle; a custom `Poll` override that drops it always
   * shows translations and ignores "View original".
   */
  translationView?: TranslationView;
};

export type PollTextTranslations = NonNullable<
  | PollResponseData['name_i18n']
  | PollOptionResponseData['text_i18n']
  | PollVoteResponseData['answer_text_i18n']
>;
