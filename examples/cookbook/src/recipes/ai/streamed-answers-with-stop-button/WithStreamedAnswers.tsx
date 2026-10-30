import type { PropsWithChildren } from 'react';
import { WithComponents } from 'stream-chat-react';
import { AssistantStatus } from './AssistantStatus';
import { StopButton } from './StopButton';

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  StopAIGenerationButton: StopButton,
  TypingIndicator: AssistantStatus,
};

/**
 * The assistant's state at the end of the message list, and a Stop button in place of the send
 * button while it answers. `StreamedMessageText` needs no override: `MessageUI` renders it for
 * every message `Chat`'s `isMessageAIGenerated` returns `true` for.
 */
export const WithStreamedAnswers = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
