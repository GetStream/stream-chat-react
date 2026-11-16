import type { Poll } from 'stream-chat';

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
