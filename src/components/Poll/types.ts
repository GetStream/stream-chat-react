import type { Poll } from 'stream-chat';

import type { TranslationView } from '../../context/MessageTranslationViewContext';

export type PollProps = {
  poll: Poll;
  translationView?: TranslationView;
};
