import 'stream-chat';

/**
 * stream-chat v10 nests app-specific fields under `custom` (`user.custom`, `channel.data.custom`,
 * …) and types them through these interfaces. Integrators declare the shape of their own custom
 * data via module augmentation — this file is the demo app doing exactly that.
 */
declare module 'stream-chat' {
  interface CustomUserData {
    /** Used by this demo's simulated users and member lists as a fallback display name. */
    username?: string;
  }

  interface CustomAttachmentData {
    /**
     * The schedule and place of this demo's `event` attachments (see `EventInvite/`). The
     * invite's name is the attachment's `title`.
     */
    event?: {
      /** End, as an ISO 8601 timestamp in UTC. */
      ends_at: string;
      /** Where it happens: a place, or an http(s) meeting link that renders as a link. */
      location?: string;
      /** Start, as an ISO 8601 timestamp in UTC. */
      starts_at: string;
      /** The invite's id, the UID of its calendar entry. */
      uid?: string;
    };
  }
}
