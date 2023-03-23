import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';

import type { Attachment } from 'stream-chat';
import type { DefaultStreamChatGenerics, VideoAttachmentConfiguration } from '../../types/types';
import { useChannelStateContext } from '../../context';
import { getCssDimensionsVariables } from './AttachmentContainer';

export type VideoPlayerProps = {
  className?: string;
  url?: string;
};

export type VideoProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachment: Attachment<StreamChatGenerics>;
  // todo: deprecate the use of ReactPlayerProps
  VideoPlayer: React.ComponentType<ReactPlayerProps>;
  /** A boolean flag to signal whether the attachment will be rendered inside the quoted reply. */
  isQuoted?: boolean;
};

export const Video = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  attachment,
  VideoPlayer = ReactPlayer,
}: VideoProps<StreamChatGenerics>) => {
  const { shouldGenerateVideoThumbnail, videoAttachmentSizeHandler } = useChannelStateContext();
  const videoElement = useRef<HTMLDivElement>(null);
  const [
    attachmentConfiguration,
    setAttachmentConfiguration,
  ] = useState<VideoAttachmentConfiguration>();

  useLayoutEffect(() => {
    if (videoElement.current && videoAttachmentSizeHandler) {
      const config = videoAttachmentSizeHandler(
        attachment,
        videoElement.current,
        shouldGenerateVideoThumbnail,
      );
      setAttachmentConfiguration(config);
    }
  }, [videoElement, videoAttachmentSizeHandler, attachment]);

  return (
    <div
      className='str-chat__player-wrapper'
      data-testid='video-wrapper'
      ref={videoElement}
      style={getCssDimensionsVariables(attachment.thumb_url || '')}
    >
      <VideoPlayer
        className='react-player'
        config={{ file: { attributes: { poster: attachmentConfiguration?.thumbUrl } } }}
        controls
        height='100%'
        url={attachmentConfiguration?.url}
        width='100%'
      />
    </div>
  );
};
