import type { Channel } from 'stream-chat';

import { useContextChannel } from './useContextChannel';

/** The nearest `Thread`'s channel, else the nearest `Channel`'s. Throws outside both. */
export const useChannel = (): Channel => {
  const channel = useContextChannel();

  if (!channel) {
    throw new Error(
      'The useChannel hook could not resolve a channel. Make sure this hook is called within a Thread subtree or within a child of Channel (ChannelInstanceContext provider).',
    );
  }

  return channel;
};
