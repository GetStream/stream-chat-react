import uniqBy from 'lodash.uniqby';
import type { Channel, ExtendableGenerics } from 'stream-chat';

import { isChannelPinned } from './hooks';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { ChannelListProps } from './ChannelList';

export const MAX_QUERY_CHANNELS_LIMIT = 30;

type MoveChannelUpParams<SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  channels: Array<Channel<SCG>>;
  cid: string;
  activeChannel?: Channel<SCG>;
};

/**
 * @deprecated
 */
export const moveChannelUp = <SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>({
  activeChannel,
  channels,
  cid,
}: MoveChannelUpParams<SCG>) => {
  // get index of channel to move up
  const channelIndex = channels.findIndex((channel) => channel.cid === cid);

  if (!activeChannel && channelIndex <= 0) return channels;

  // get channel to move up
  const channel = activeChannel || channels[channelIndex];

  return uniqBy([channel, ...channels], 'cid');
};

/**
 * Expects channel array sorted by `{ pinned_at: -1 }`.
 *
 * TODO: add support for the `{ pinned_at: 1 }`
 */
export function findLastPinnedChannelIndex<SCG extends ExtendableGenerics>({
  channels,
}: {
  channels: Channel<SCG>[];
}) {
  let lastPinnedChannelIndex: number | null = null;

  for (const channel of channels) {
    if (!isChannelPinned({ channel })) break;

    if (typeof lastPinnedChannelIndex === 'number') {
      lastPinnedChannelIndex++;
    } else {
      lastPinnedChannelIndex = 0;
    }
  }

  return lastPinnedChannelIndex;
}

type MoveChannelUpwardsParams<SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  channels: Array<Channel<SCG>>;
  channelToMove: Channel<SCG>;
  /**
   * If the index of the channel within `channels` list which is being moved upwards
   * (`channelToMove`) is known, you can supply it to skip extra calculation.
   */
  channelToMoveIndexWithinChannels?: number;
  /**
   * Pinned channels should not move within the list based on recent activity, channels which
   * receive messages and are not pinned should move upwards but only under the last pinned channel
   * in the list. Property defaults to `false` and should be calculated based on existence of
   * the `pinned_at` sort option.
   */
  considerPinnedChannels?: boolean;
};

export const moveChannelUpwards = <
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channels,
  channelToMove,
  channelToMoveIndexWithinChannels,
  considerPinnedChannels = false,
}: MoveChannelUpwardsParams<SCG>) => {
  // get index of channel to move up
  const targetChannelIndex =
    channelToMoveIndexWithinChannels ??
    channels.findIndex((channel) => channel.cid === channelToMove.cid);

  const targetChannelExistsWithinList = targetChannelIndex >= 0;
  const targetChannelAlreadyAtTheTop = targetChannelIndex === 0;

  if (targetChannelAlreadyAtTheTop) return channels;

  // as position of pinned channels has to stay unchanged, we need to
  // find last pinned channel in the list to move the target channel after
  let lastPinnedChannelIndex: number | null = null;
  if (considerPinnedChannels) {
    lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels });
  }

  const newChannels = [...channels];

  // target channel index is known, remove it from the list
  if (targetChannelExistsWithinList) {
    newChannels.splice(targetChannelIndex, 1);
  }

  // re-insert it at the new place (to specific index if pinned channels are considered)
  newChannels.splice(
    typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0,
    0,
    channelToMove,
  );

  return newChannels;
};

/**
 * Set to true only if `{ pinned_at: -1 }` option is first within the `sort` array.
 */
export const shouldConsiderPinnedChannels = (sort: ChannelListProps['sort']) => {
  if (!sort) return false;

  if (!Array.isArray(sort)) return false;

  const [option] = sort;

  return option?.pinned_at === -1;
};
