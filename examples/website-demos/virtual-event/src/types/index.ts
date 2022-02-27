import { LiteralStringForUnion } from 'stream-chat';

export type AttachmentType = { file_size?: number };
export type ChannelType = {};
export type CommandType = LiteralStringForUnion;
export type EventType = {};
export type MessageType = { up_votes?: string[] };
export type ReactionType = {};
export type UserType = { image?: string; title?: string };

export type StreamChatGenerics = {
  attachmentType: AttachmentType;
  channelType: ChannelType;
  commandType: CommandType;
  eventType: EventType;
  messageType: MessageType;
  reactionType: ReactionType;
  userType: UserType;
};
