import 'stream-chat';

declare module 'stream-chat' {
  interface CustomUserData {
    image?: string;
  }

  interface CustomChannelData {
    image?: string;
    subtitle?: string;
  }
}
