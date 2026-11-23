import type { Channel } from 'stream-chat';

import { useThreadContext } from '../components/Threads';
import { useChannelInstanceContext } from './ChannelInstanceContext';

/** The nearest `Thread`'s channel, else the nearest `Channel`'s; `undefined` outside both. */
export const useContextChannel = (): Channel | undefined => {
  const channelFromThread = useThreadContext()?.channel;
  const { channel: channelFromInstanceContext } = useChannelInstanceContext();

  return channelFromThread ?? channelFromInstanceContext;
};

/** `channel` when given, else the channel in context. Throws when there is neither. */
export const useResolvedChannel = (channel?: Channel): Channel => {
  const contextChannel = useContextChannel();
  const resolvedChannel = channel ?? contextChannel;

  if (!resolvedChannel) {
    throw new Error(
      'Could not resolve a channel. Call this hook within a Thread subtree or within a child of Channel (ChannelInstanceContext provider), or pass it a channel.',
    );
  }

  return resolvedChannel;
};
