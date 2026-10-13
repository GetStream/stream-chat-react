import 'stream-chat';

/**
 * stream-chat v10 nests app-specific fields under `custom` (`channel.data.custom`,
 * `message.custom`, …) and types them through these interfaces. This example declares the fields
 * it reads via module augmentation.
 */
declare module 'stream-chat' {
  interface CustomChannelData {
    /** Conversation title, generated from the first message and shown in the sidebar and header. */
    summary?: string;
  }

  interface CustomMessageData {
    /** Set by the AI agent server on the messages it writes. */
    ai_generated?: boolean;
  }
}
