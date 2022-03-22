import React from 'react';
import { StreamChat } from 'stream-chat';

const appKey = import.meta.env.VITE_APP_KEY;
if (!appKey || typeof appKey !== 'string') {
  throw new Error('expected APP_KEY');
}
export const apiKey = appKey;
const userId = import.meta.env.VITE_TEST_USER_1;
const userToken = import.meta.env.VITE_TEST_USER_1_TOKEN;
if (!userId || typeof userId !== 'string') {
  throw new Error('expected TEST_USER_1');
}
if (!userToken || typeof userToken !== 'string') {
  throw new Error('expected TEST_USER_1_TOKEN');
}
export const testUser1Id = userId;

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

export type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

export const chatClient = StreamChat.getInstance<StreamChatGenerics>(appKey);
chatClient.connectUser({ id: userId }, userToken);

export const StyleFix = () => (
  <style>{`
    .str-chat {
      height: 700px
    }
  `}</style>
);
