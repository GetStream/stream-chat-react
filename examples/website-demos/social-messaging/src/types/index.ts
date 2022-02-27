import { LiteralStringForUnion } from 'stream-chat';

export type SocialAttachmentType = { file_size?: number };
export type SocialChannelType = {};
export type SocialCommandType = LiteralStringForUnion;
export type SocialEventType = {};
export type SocialMessageType = {};
export type SocialReactionType = {};
export type SocialUserType = { image?: string };

export type StreamChatGenerics = {
  attachmentType: SocialAttachmentType;
  channelType: SocialChannelType;
  commandType: SocialCommandType;
  eventType: SocialEventType;
  messageType: SocialMessageType;
  reactionType: SocialReactionType;
  userType: SocialUserType;
};
