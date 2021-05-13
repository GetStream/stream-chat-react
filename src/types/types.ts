import type { Event, LiteralStringForUnion, Mute } from 'stream-chat';

export type UnknownType = Record<string, unknown>;

export type CustomTrigger = {
  [key: string]: {
    componentProps: UnknownType;
    data: UnknownType;
  };
};

export type DefaultAttachmentType = UnknownType & {
  file_size?: number;
  mime_type?: string;
};

export type DefaultChannelType = UnknownType & {
  image?: string;
  member_count?: number;
  subtitle?: string;
};

export type DefaultCommandType = LiteralStringForUnion;

export type DefaultEventType = UnknownType;

export type DefaultMessageType = UnknownType & {
  date?: string | Date;
  errorStatusCode?: number;
  event?: Event<
    DefaultAttachmentType,
    DefaultChannelType,
    DefaultCommandType,
    DefaultEventType,
    DefaultMessageType,
    DefaultReactionType,
    DefaultUserType
  >;
  unread?: boolean;
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
