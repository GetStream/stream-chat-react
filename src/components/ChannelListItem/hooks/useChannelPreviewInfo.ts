import { useMemo } from 'react';
import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import {
  channelDisplayStateSelector,
  deriveChannelDisplayImage,
  deriveGroupChannelDisplayInfo,
} from '../channelDisplayState';
import type { GroupChannelDisplayInfo } from '../utils';
import { useChannelDisplayName } from './useChannelDisplayName';

const emptyGroupInfo: GroupChannelDisplayInfo = {
  members: [],
  overflowCount: undefined,
};

export type ChannelPreviewInfoParams = {
  /** Channel to read display info from. Without one, only the overrides give a title and image. */
  channel?: Channel;
  /** Image to render instead of the channel image. */
  overrideImage?: string;
  /** Title to render instead of the channel display name. */
  overrideTitle?: string;
};

/**
 * The title, image and group members a channel preview shows. Derived from the channel's `data`
 * and `members`, so a preview re-renders only when its own channel changes.
 */
export const useChannelPreviewInfo = (props: ChannelPreviewInfoParams) => {
  const { channel, overrideImage, overrideTitle } = props;
  const { client } = useChatContext();

  const channelDisplayName = useChannelDisplayName(channel);
  const displayTitle = overrideTitle ?? channelDisplayName;

  const displayState = useStateStore(channel?.state, channelDisplayStateSelector);
  const currentUserId = client.userID ?? undefined;

  const displayImage = useMemo(
    () =>
      overrideImage ??
      (displayState ? deriveChannelDisplayImage(displayState, currentUserId) : undefined),
    [currentUserId, displayState, overrideImage],
  );
  const groupChannelDisplayInfo = useMemo(
    () => (displayState && deriveGroupChannelDisplayInfo(displayState)) ?? emptyGroupInfo,
    [displayState],
  );

  return useMemo(
    () => ({ displayImage, displayTitle, groupChannelDisplayInfo }),
    [displayImage, displayTitle, groupChannelDisplayInfo],
  );
};
