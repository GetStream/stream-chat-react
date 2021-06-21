import type { Channel, UserResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ChannelOrUserResponse =
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

export const isChannelOrUserResponse = (
  channel: ChannelOrUserResponse,
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
  >).cid != null;
