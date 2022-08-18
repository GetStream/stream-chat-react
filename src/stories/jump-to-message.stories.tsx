/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Channel,
  ChannelList,
  MessageList,
  useChannelActionContext,
  useChatContext,
  VirtualizedMessageList,
  Window,
} from '../index';
import { ConnectedUser } from './utils';

void MessageList;
void VirtualizedMessageList;

const userId = import.meta.env.E2E_TEST_USER_1;
const userToken = import.meta.env.E2E_TEST_USER_1_TOKEN;
const channelId = import.meta.env.E2E_JUMP_TO_MESSAGE_CHANNEL;

const JumpToMessage = () => {
  const { jumpToMessage } = useChannelActionContext();
  const { client: chatClient } = useChatContext();

  return (
    <button
      data-testid='jump-to-message'
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

export const JumpInRegularMessageList = () => (
  <div>
    <ConnectedUser token={userToken} userId={userId}>
      <ChannelList filters={{ id: { $eq: channelId } }} />
      <Channel>
        <JumpToMessage />
        <Window>
          <MessageList />
        </Window>
      </Channel>
    </ConnectedUser>
  </div>
);

export const JumpInVirtualizedMessageList = () => (
  <div>
    <ConnectedUser token={userToken} userId={userId}>
      <ChannelList filters={{ id: { $eq: channelId } }} />
      <Channel>
        <JumpToMessage />
        <Window>
          <VirtualizedMessageList />
        </Window>
      </Channel>
    </ConnectedUser>
  </div>
);
