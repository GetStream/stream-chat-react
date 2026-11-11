import { StateStore } from 'stream-chat';

import type { AIChatOption } from './ChatOptions';

export type AIMessageComposerStore = {
  attachments: {
    file: File;
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- public type kept identical to @stream-io/chat-react-ai@0.2.0 for drop-in migration
    meta?: Record<string, any>;
  }[];
  text: string;
  /**
   * The chat option picked for the next message, which `AIMessageComposer.ChatOptions` shows. It
   * stays picked after a message is sent.
   */
  chatOption?: AIChatOption | null;
  /** Data of your own, which an `AIConversationController` sends with the message as `custom`. */
  custom?: Record<string, unknown>;
  disabled?: boolean;
  /**
   * Whether the person is editing a message they sent. The composer says so above the text,
   * with a button that cancels it, and focuses the text input.
   */
  isEditing?: boolean;
};

export const initialAIMessageComposerState: AIMessageComposerStore = {
  attachments: [],
  disabled: false,
  text: '',
};

/** A store for what the person writes in an `AIMessageComposer`, such as for a conversation. */
export const createAIMessageComposerStore = () =>
  new StateStore<AIMessageComposerStore>(initialAIMessageComposerState);
