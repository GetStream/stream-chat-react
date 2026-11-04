import type { PropsWithChildren } from 'react';
import type { ReactionOptions } from 'stream-chat-react';
import { emojiToUnicode, WithComponents } from 'stream-chat-react';
import { CustomMessageUi } from './CustomMessageUi';

const reactionOptions: ReactionOptions = {
  quick: {
    '+1': {
      Component: () => <>👍</>,
      name: 'Thumbs up',
      unicode: emojiToUnicode('👍'),
    },
    '-1': {
      Component: () => <>👎</>,
      name: 'Thumbs down',
      unicode: emojiToUnicode('👎'),
    },
  },
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { MessageUI: CustomMessageUi, reactionOptions };

export const WithCustomMessageUi = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
