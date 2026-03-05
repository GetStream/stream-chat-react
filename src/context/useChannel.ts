import { useThreadContext } from '../components/Threads';
import { useChannelInstanceContext } from './ChannelInstanceContext';

import type { Channel } from 'stream-chat';

export const useChannel = (): Channel => {
  const thread = useThreadContext();
  const channelFromThread = thread?.channel;
  const { channel: channelFromInstanceContext } = useChannelInstanceContext();
  const channel = channelFromThread ?? channelFromInstanceContext;

  if (!channel) {
    console.warn(
      'The useChannel hook could not resolve a channel. Make sure this hook is called within a Thread subtree or within a child of Channel (ChannelInstanceContext provider).',
    );
    throw new Error('The useChannel hook could not resolve a channel.');
  }

  return channel;
};
