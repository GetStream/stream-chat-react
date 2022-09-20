/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  VirtualizedMessageList,
  Window,
} from '../index';
import { ConnectedUser } from './utils';

const channelId = import.meta.env.E2E_ADD_MESSAGE_CHANNEL;
const userId = import.meta.env.E2E_TEST_USER_1 as string;
const token = import.meta.env.E2E_TEST_USER_1_TOKEN as string;

if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected ADD_MESSAGE_CHANNEL');
}

// Sort in reverse order to avoid auto-selecting unread channel
const sort: ChannelSort = { last_updated: 1 };
const filters: ChannelFilters = { members: { $in: [userId] }, type: 'messaging' };
const options: ChannelOptions = { limit: 10, presence: true, state: true };

export const BasicSetup = () => (
  <ConnectedUser token={token} userId={userId}>
    <ChannelList filters={filters} options={options} showChannelSearch sort={sort} />
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageInput focus />
      </Window>
      <Thread />
    </Channel>
  </ConnectedUser>
);

// basic setup with virtualized list
export const VirtualizedSetup = () => (
  <ConnectedUser token={token} userId={userId}>
    <ChannelList filters={filters} options={options} showChannelSearch sort={sort} />
    <Channel>
      <Window>
        <ChannelHeader />
        <VirtualizedMessageList disableDateSeparator={false} messageLimit={50} />
        <MessageInput focus />
      </Window>
      <Thread />
    </Channel>
  </ConnectedUser>
);
