import React, { useEffect, useState } from 'react';
import { Channel as StreamChannel, StreamChat } from 'stream-chat';

const apiKey = import.meta.env.VITE_APP_KEY;
const userId = import.meta.env.VITE_TEST_USER_1;
const userToken = import.meta.env.VITE_TEST_USER_1_TOKEN;
if (!apiKey || typeof apiKey !== 'string') {
  throw new Error('expected APP_KEY');
}
if (!userId || typeof userId !== 'string') {
  throw new Error('expected TEST_USER_1');
}
if (!userToken || typeof userToken !== 'string') {
  throw new Error('expected TEST_USER_1_TOKEN');
}
export const testUserId = userId;

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

export const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);

chatClient.connectUser({ id: userId }, userToken);

export const useQueryChannels = (id: string) => {
  const [channel, setChannel] = useState<StreamChannel | null>(null);

  useEffect(() => {
    (async () => {
      const channels = await chatClient.queryChannels({ id: { $eq: id } });
      setChannel(channels[0]);
    })();
  }, []);
  return channel;
};

export const StyleFix = () => (
  <style>{`
    .str-chat {
      height: 700px
    }
  `}</style>
);
