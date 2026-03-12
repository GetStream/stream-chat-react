import { useEffect, useMemo, useState } from 'react';
import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../context';
import {
  getChannelDisplayImage,
  getGroupChannelDisplayInfo,
  type GroupChannelDisplayInfo,
} from '../utils';
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

export const useChannelPreviewInfo = (props: ChannelPreviewInfoParams) => {
  const { channel, overrideImage, overrideTitle } = props;
  const { client } = useChatContext();

  const channelDisplayName = useChannelDisplayName(channel);
  const displayTitle = overrideTitle ?? channelDisplayName;

  const [displayImage, setDisplayImage] = useState<string | undefined>(() =>
    channel ? (overrideImage ?? getChannelDisplayImage(channel)) : undefined,
  );
  const [groupChannelDisplayInfo, setGroupChannelDisplayInfo] =
    useState<GroupChannelDisplayInfo>(() =>
      channel ? (getGroupChannelDisplayInfo(channel) ?? emptyGroupInfo) : emptyGroupInfo,
    );

  useEffect(() => {
    if (!channel) return;
    if (overrideImage) return;

    const updateInfo = () => {
      setDisplayImage(getChannelDisplayImage(channel));
      setGroupChannelDisplayInfo(getGroupChannelDisplayInfo(channel) ?? emptyGroupInfo);
    };

    updateInfo();
    client.on('user.updated', updateInfo);
    return () => {
      client.off('user.updated', updateInfo);
    };
  }, [channel, channel?.data, client, overrideImage]);

  return useMemo(
    () => ({
      displayImage: overrideImage ?? displayImage,
      displayTitle,
      groupChannelDisplayInfo,
    }),
    [displayImage, displayTitle, groupChannelDisplayInfo, overrideImage],
  );
};
