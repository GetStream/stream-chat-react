import 'stream-chat';

import {
  DefaultAttachmentData,
  DefaultChannelData,
  DefaultCommandData,
  DefaultEventData,
  DefaultMemberData,
  DefaultMessageComposerData,
  DefaultMessageData,
  DefaultPollData,
  DefaultPollOptionData,
  DefaultReactionData,
  DefaultThreadData,
  DefaultUserData,
} from '../types/defaultDataInterfaces';

declare module 'stream-chat' {
  interface CustomChannelData extends DefaultChannelData {}

  interface CustomAttachmentData extends DefaultAttachmentData {}

  interface CustomCommandData extends DefaultCommandData {}

  interface CustomEventData extends DefaultEventData {}

  interface CustomMemberData extends DefaultMemberData {}

  interface CustomMessageData extends DefaultMessageData {}

  interface CustomPollOptionData extends DefaultPollOptionData {}

  interface CustomPollData extends DefaultPollData {}

  interface CustomReactionData extends DefaultReactionData {}

  interface CustomUserData extends DefaultUserData {}

  interface CustomThreadData extends DefaultThreadData {}

  interface CustomMessageComposerData extends DefaultMessageComposerData {}
}
