import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { SpokenMessageText } from './SpokenMessageText';

// Declared once, so WithComponents gets the same object on every render.
const overrides = { StreamedMessageText: SpokenMessageText };

/**
 * The assistant's replies, revealed at the pace of its voice while it speaks them. `MessageUI`
 * renders the `StreamedMessageText` slot for every message `Chat`'s `isMessageAIGenerated`
 * returns `true` for.
 */
export const WithVoiceAgent = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
