import type {
  DefaultAttachmentData,
  DefaultChannelData,
  DefaultCommandData,
  DefaultEventData,
  DefaultMemberData,
  DefaultMessageData,
  DefaultPollData,
  DefaultPollOptionData,
  DefaultReactionData,
  DefaultThreadData,
  DefaultUserData,
} from 'stream-chat-react';

declare module 'stream-chat' {
  interface CustomAttachmentData extends DefaultAttachmentData {
    id?: string;
  }

  interface CustomChannelData extends DefaultChannelData {
    summary?: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomCommandData extends DefaultCommandData {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomEventData extends DefaultEventData {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomMemberData extends DefaultMemberData {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomUserData extends DefaultUserData {}

  interface CustomMessageData extends DefaultMessageData {
    ai_generated?: boolean;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomPollOptionData extends DefaultPollOptionData {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomPollData extends DefaultPollData {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomReactionData extends DefaultReactionData {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation placeholder
  interface CustomThreadData extends DefaultThreadData {}
}
