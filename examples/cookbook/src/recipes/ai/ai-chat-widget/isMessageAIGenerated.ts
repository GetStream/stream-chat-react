import type { LocalMessage } from 'stream-chat';

declare module 'stream-chat' {
  // The field the backend sets on the assistant's replies. Optional, because every message in the
  // app shares this interface.
  interface CustomMessageData {
    ai_generated?: boolean;
  }
}

/** The assistant wrote the message: the backend marks its replies with `ai_generated`. */
export const isMessageAIGenerated = (message: LocalMessage) =>
  !!message.custom?.ai_generated;
