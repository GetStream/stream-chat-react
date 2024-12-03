import uniqBy from 'lodash.uniqby';
import type { Channel, ChannelSort, ExtendableGenerics } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelListProps } from './ChannelList';

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
    if (!isChannelPinned(channel)) break;

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
  sort: ChannelSort<SCG>;
  /**
   * If the index of the channel within `channels` list which is being moved upwards
   * (`channelToMove`) is known, you can supply it to skip extra calculation.
   */
  channelToMoveIndexWithinChannels?: number;
};

/**
 * This function should not be used to move pinned already channels.
 */
export const moveChannelUpwards = <
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channels,
  channelToMove,
  channelToMoveIndexWithinChannels,
  sort,
}: MoveChannelUpwardsParams<SCG>) => {
  // get index of channel to move up
  const targetChannelIndex =
    channelToMoveIndexWithinChannels ??
    channels.findIndex((channel) => channel.cid === channelToMove.cid);

  const targetChannelExistsWithinList = targetChannelIndex >= 0;
  const targetChannelAlreadyAtTheTop = targetChannelIndex === 0;

  // pinned channels should not move within the list based on recent activity, channels which
  // receive messages and are not pinned should move upwards but only under the last pinned channel
  // in the list
  const considerPinnedChannels = shouldConsiderPinnedChannels(sort);

  if (targetChannelAlreadyAtTheTop) return channels;

  const newChannels = [...channels];

  // target channel index is known, remove it from the list
  if (targetChannelExistsWithinList) {
    newChannels.splice(targetChannelIndex, 1);
  }

  // as position of pinned channels has to stay unchanged, we need to
  // find last pinned channel in the list to move the target channel after
  let lastPinnedChannelIndex: number | null = null;
  if (considerPinnedChannels) {
    lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
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
 * Returns true only if `{ pinned_at: -1 }` or `{ pinned_at: 1 }` option is first within the `sort` array.
 */
export const shouldConsiderPinnedChannels = <SCG extends ExtendableGenerics>(
  sort: ChannelListProps<SCG>['sort'],
) => {
  if (!sort) return false;

  if (!Array.isArray(sort)) return false;

  const [option] = sort;

  if (!option?.pinned_at) return false;

  return Math.abs(option.pinned_at) === 1;
};

/**
 * Returns `true` only if `archived` property is set to `false` within `filters`.
 */
export const shouldConsiderArchivedChannels = <SCG extends ExtendableGenerics>(
  filters: ChannelListProps<SCG>['filters'],
) => {
  if (!filters) return false;

  return !filters.archived;
};

export const isChannelPinned = <SCG extends ExtendableGenerics>(channel: Channel<SCG>) => {
  if (!channel) return false;

  const member = channel.state.membership;

  return !!member?.pinned_at;
};

export const isChannelArchived = <SCG extends ExtendableGenerics>(channel: Channel<SCG>) => {
  if (!channel) return false;

  const member = channel.state.membership;

  return !!member?.archived_at;
};
