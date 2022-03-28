import React from 'react';

const appKey = import.meta.env.E2E_APP_KEY;
if (!appKey || typeof appKey !== 'string') {
  throw new Error('expected APP_KEY');
}
export const apiKey = appKey;

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

export const StyleFix = () => (
  <style>{`
    .str-chat {
      height: 700px
    }
  `}</style>
);
