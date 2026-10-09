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

  interface CustomCommandData extends DefaultCommandData {}

  interface CustomEventData extends DefaultEventData {}

  interface CustomMemberData extends DefaultMemberData {}

  interface CustomUserData extends DefaultUserData {}

  interface CustomMessageData extends DefaultMessageData {
    ai_generated?: boolean;
  }

  interface CustomPollOptionData extends DefaultPollOptionData {}

  interface CustomPollData extends DefaultPollData {}

  interface CustomReactionData extends DefaultReactionData {}

  interface CustomThreadData extends DefaultThreadData {}
}
