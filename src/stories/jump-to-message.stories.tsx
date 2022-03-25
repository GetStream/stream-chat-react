/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Channel,
  Chat,
  MessageList,
  useChannelActionContext,
  VirtualizedMessageList,
  Window,
} from '../index';
import '@stream-io/stream-chat-css/dist/css/index.css';

void MessageList;
void VirtualizedMessageList;

const apiKey = import.meta.env.VITE_APP_KEY;
const userId = import.meta.env.VITE_TEST_USER_1;
const userToken = import.meta.env.VITE_TEST_USER_1_TOKEN;
const channelId = import.meta.env.VITE_JUMP_TO_MESSAGE_CHANNEL;

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
      onClick={async () => {
        const results = await chatClient.search(
          {
            id: { $eq: channelId },
          },
          'Message 29',
          { limit: 1, offset: 0 },
        );

        jumpToMessage(results.results[0].message.id);
      }}
    >
      Jump to message &apos;29&apos;
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
          <Window>
            <MessageList />
          </Window>
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
          <Window>
            <VirtualizedMessageList />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
};
