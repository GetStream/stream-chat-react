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
}
