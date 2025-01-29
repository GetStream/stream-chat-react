import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

import { getDisplayImage, getDisplayTitle, getGroupChannelDisplayInfo } from '../utils';
import { useChatContext } from '../../../context';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type ChannelPreviewInfoParams<
  StreamChatGenerics extends DefaultStreamChatGenerics,
> = {
  channel: Channel<StreamChatGenerics>;
  /** Manually set the image to render, defaults to the Channel image */
  overrideImage?: string;
  /** Set title manually */
  overrideTitle?: string;
};

export const useChannelPreviewInfo = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewInfoParams<StreamChatGenerics>,
) => {
  const { channel, overrideImage, overrideTitle } = props;

  const { client } = useChatContext<StreamChatGenerics>('useChannelPreviewInfo');
  const [displayTitle, setDisplayTitle] = useState(
    () => overrideTitle || getDisplayTitle(channel, client.user),
  );
  const [displayImage, setDisplayImage] = useState(
    () => overrideImage || getDisplayImage(channel, client.user),
  );

  const [groupChannelDisplayInfo, setGroupDisplayChannelInfo] = useState<
    ReturnType<typeof getGroupChannelDisplayInfo>
  >(() => getGroupChannelDisplayInfo(channel));

  useEffect(() => {
    if (overrideTitle && overrideImage) return;

    const updateInfo = () => {
      if (!overrideTitle) setDisplayTitle(getDisplayTitle(channel, client.user));
      if (!overrideImage) {
        setDisplayImage(getDisplayImage(channel, client.user));
        setGroupDisplayChannelInfo(getGroupChannelDisplayInfo(channel));
      }
    };

    updateInfo();

    client.on('user.updated', updateInfo);
    return () => {
      client.off('user.updated', updateInfo);
    };
  }, [channel, channel.data, client, overrideImage, overrideTitle]);

  return {
    displayImage: overrideImage || displayImage,
    displayTitle: overrideTitle || displayTitle,
    groupChannelDisplayInfo,
  };
};
