/* eslint-disable @typescript-eslint/no-explicit-any */
import '@stream-io/stream-chat-css/dist/css/index.css';
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Channel,
  Chat,
  MessageList,
  useChannelActionContext,
  VirtualizedMessageList,
} from '../index';

void MessageList;
void VirtualizedMessageList;

const apiKey = import.meta.env.VITE_APP_KEY;
const userId = import.meta.env.VITE_TEST_USER_1;
const userToken = import.meta.env.VITE_TEST_USER_1_TOKEN;
const channelId = import.meta.env.VITE_JUMP_TO_MESSAGE_CHANNEL;
if (!apiKey || typeof apiKey !== 'string') {
  throw new Error('Expected VITE_APP_KEY');
}
if (!userId || typeof userId !== 'string') {
  throw new Error('Expected VITE_TEST_USER_1');
}
if (!userToken || typeof userToken !== 'string') {
  throw new Error('Expected VITE_TEST_USER_1_TOKEN');
}
if (!channelId || typeof channelId !== 'string') {
  throw new Error('Expected VITE_JUMP_TO_MESSAGE_CHANNEL');
}

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

const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);

chatClient.connectUser({ id: userId }, userToken);

const JumpToMessage = () => {
  const { jumpToMessage } = useChannelActionContext();

  return (
    <button
      data-testid='jump-to-message'
      onClick={async () => {
        const results = await chatClient.search(
          {
            id: { $eq: channelId },
          },
          'Message',
          { limit: 1, offset: 120 },
        );

        jumpToMessage(results.results[0].message.id);
      }}
    >
      Jump to message 29
    </button>
  );
};

const StyleFix = () => (
  <style>{`
    .str-chat {
      height: 700px
    }
  `}</style>
);

const useTheJumpChannel = () => {
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const channels = await chatClient.queryChannels({ id: { $eq: channelId } });
      setChannel(channels[0]);
    })();
  }, []);
  return channel;
};

export const JumpInRegularMessageList = () => {
  const channel = useTheJumpChannel();
  if (!channel) {
    return null;
  }
  return (
    <div>
      <StyleFix />
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <JumpToMessage />
          <MessageList />
        </Channel>
      </Chat>
    </div>
  );
};

export const JumpInVirtualizedMessageList = () => {
  const channel = useTheJumpChannel();

  if (!channel) {
    return null;
  }

  return (
    <div>
      <StyleFix />
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <JumpToMessage />
          <VirtualizedMessageList />
        </Channel>
      </Chat>
    </div>
  );
};
