import type { Event, ExtendableGenerics, LiteralStringForUnion, Mute } from 'stream-chat';

export type UnknownType = Record<string, unknown>;

export type CustomTrigger = {
  [key: string]: {
    componentProps: UnknownType;
    data: UnknownType;
  };
};

export type DefaultAttachmentType = UnknownType & {
  asset_url?: string;
  file_size?: number;
  id?: string;
  images?: Array<{
    image_url?: string;
    thumb_url?: string;
  }>;
};

export type DefaultChannelType = UnknownType & {
  frozen?: boolean;
  image?: string;
  member_count?: number;
  subtitle?: string;
};

export type DefaultStreamChatGenerics = ExtendableGenerics & {
  attachmentType: DefaultAttachmentType;
  channelType: DefaultChannelType;
  commandType: LiteralStringForUnion;
  eventType: UnknownType;
  messageType: DefaultMessageType;
  reactionType: UnknownType;
  userType: DefaultUserType;
};

export type DefaultMessageType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = UnknownType & {
  customType?: 'channel.intro' | 'message.date';
  date?: string | Date;
  errorStatusCode?: number;
  event?: Event<StreamChatGenerics>;
  unread?: boolean;
};

export type DefaultUserTypeInternal = {
  image?: string;
  status?: string;
};

export type DefaultUserType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = UnknownType &
  DefaultUserTypeInternal & {
    mutes?: Array<Mute<StreamChatGenerics>>;
  };
