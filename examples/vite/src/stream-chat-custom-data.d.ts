import 'stream-chat';

/**
 * `stream-chat` types app-specific fields through these interfaces; integrators declare their own
 * shape via module augmentation. This file is the demo app doing exactly that.
 */
declare module 'stream-chat' {
  interface CustomMemberData {
    /**
     * Channel-specific nickname. Lives on the *member*, not the user — that is what scopes it to a
     * single channel. Read by `src/ChannelNicknames`; written server-side by the integrating app.
     */
    nickname?: string | null;
  }

  interface CustomMessageData {
    /**
     * `{ [userId]: displayTextUsedForThisMention }`, written at send time.
     *
     * Mention display text is frozen into `message.text`, so recording the mapping here lets the
     * renderer resolve `@nickname` → user without a member lookup — which matters once a channel
     * outgrows the 100-member threshold where members stop being held in local channel state.
     */
    mention_display_names?: Record<string, string>;
  }
}
