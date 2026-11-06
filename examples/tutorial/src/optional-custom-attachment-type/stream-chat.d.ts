import type { DefaultAttachmentData } from 'stream-chat-react';

declare module 'stream-chat' {
  interface CustomAttachmentData extends DefaultAttachmentData {
    image?: string;
    name?: string;
    url?: string;
  }
}
