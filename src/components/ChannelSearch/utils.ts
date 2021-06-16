import type { Channel, UserResponse } from 'stream-chat';

export type ChannelOrUserType =
  | Channel<
      DefaultAttachmentType,
      DefaultChannelType,
      DefaultCommandType,
      DefaultEventType,
      DefaultMessageType,
      DefaultReactionType,
      DefaultUserType
    >
  | UserResponse<DefaultUserType>;

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export const isChannel = (
  channel: ChannelOrUserType,
): channel is Channel<
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType
> =>
  (channel as Channel<
    DefaultAttachmentType,
    DefaultChannelType,
    DefaultCommandType,
    DefaultEventType,
    DefaultMessageType,
    DefaultReactionType,
    DefaultUserType
  >).cid !== undefined;
