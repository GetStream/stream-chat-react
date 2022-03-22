/* eslint-disable @typescript-eslint/no-explicit-any */
import '@stream-io/stream-chat-css/dist/css/index.css';
import React from 'react';
import type { ChannelFilters } from 'stream-chat';
import { Channel, ChannelList, Chat, MessageList, useChannelStateContext } from '../index';
import { chatClient, StyleFix, testUser1Id } from './utils';

const channelId = import.meta.env.VITE_ADD_MESSAGE_CHANNEL;
if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected ADD_MESSAGE_CHANNEL');
}

const Controls = () => {
  const { channel } = useChannelStateContext();

  return (
    <div>
      <button data-testid='truncate' onClick={() => channel.truncate()}>
        Truncate
      </button>
      <button
        data-testid='add-message'
        onClick={() =>
          channel.sendMessage({
            text: 'Hello world!',
          })
        }
      >
        Add message
      </button>
    </div>
  );
};

const filters: ChannelFilters = {
  members: { $in: [testUser1Id] },
};

export const SendMessageInMessageList = () => (
  <>
    <StyleFix />
    <Chat client={chatClient}>
      <ChannelList filters={filters} />
      <Channel>
        <Controls />
        <MessageList />
      </Channel>
    </Chat>
  </>
);
