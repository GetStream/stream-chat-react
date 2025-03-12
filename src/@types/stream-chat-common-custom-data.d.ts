import 'stream-chat';

declare module 'stream-chat' {
  interface CustomChannelData {
    image?: string;
    name?: string;
    subtitle?: string;
  }
}
