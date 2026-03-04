import { useContext } from 'react';

import { useThreadContext } from '../components/Threads';

import { ChannelStateContext } from './ChannelStateContext';

import type { Channel } from 'stream-chat';

export const useChannel = (): Channel => {
  const thread = useThreadContext();
  const channelFromThread = thread?.channel;
  const channelFromState = useContext(ChannelStateContext)?.channel;
  const channel = channelFromThread ?? channelFromState;

  if (!channel) {
    throw new Error('The useChannel hook could not resolve a channel.');
  }

  return channel;
};
