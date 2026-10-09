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
  /** Channel to read display info from; when undefined, returns undefined display title/image */
  channel?: Channel;
  /** Manually set the image to render, defaults to the Channel image */
  overrideImage?: string;
  /** Set title manually */
  overrideTitle?: string;
};

/**
 * The title, image and group members a channel preview shows. Derived from the channel's `data`
 * and `members`, so a preview re-renders only when its own channel changes: an updated user reaches
 * the channels that contain them through the member the client replaces.
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
