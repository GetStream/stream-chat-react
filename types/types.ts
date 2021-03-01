import type { Event, LiteralStringForUnion, Mute } from 'stream-chat';

export type UnknownType = Record<string, unknown>;

export type DefaultAttachmentType = UnknownType & {
  file_size?: number;
};

export type DefaultChannelType = UnknownType & {
  image?: string;
  member_count?: number;
  subtitle?: string;
};

export type DefaultCommandType = LiteralStringForUnion;

export type DefaultEventType = UnknownType;

export type DefaultMessageType = UnknownType & {
  event?: Event<
    DefaultAttachmentType,
    DefaultChannelType,
    DefaultCommandType,
    DefaultEventType,
    DefaultMessageType,
    DefaultReactionType,
    DefaultUserType
  >;
};

export type DefaultReactionType = UnknownType;

export type DefaultUserTypeInternal = {
  image?: string;
  status?: string;
};

export type DefaultUserType<
  UserType extends DefaultUserTypeInternal = DefaultUserTypeInternal
> = UnknownType &
  DefaultUserTypeInternal & {
    mutes?: Array<Mute<UserType>>;
  };
