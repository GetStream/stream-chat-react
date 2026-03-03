import type { VideoAttachment as VideoAttachmentType } from 'stream-chat';
import { useChannelStateContext } from '../../context';
import React, { type ComponentType, useLayoutEffect, useRef, useState } from 'react';
import type { VideoAttachmentConfiguration } from '../../types/types';
import { getCssDimensionsVariables } from './utils';
import type { VideoPlayerProps } from '../VideoPlayer';
import { VideoPlayer as DefaultVideoPlayer } from '../VideoPlayer';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';

export type VideoAttachmentProps = {
  attachment: VideoAttachmentType;
  VideoPlayer?: ComponentType<VideoPlayerProps>;
};

export const VideoAttachment = ({
  attachment,
  VideoPlayer = DefaultVideoPlayer,
}: VideoAttachmentProps) => {
  const { shouldGenerateVideoThumbnail, videoAttachmentSizeHandler } =
    useChannelStateContext();
  const videoElement = useRef<HTMLDivElement>(null);
  const [attachmentConfiguration, setAttachmentConfiguration] =
    useState<VideoAttachmentConfiguration>();
  const [showVideo, setShowVideo] = React.useState(!shouldGenerateVideoThumbnail);

  useLayoutEffect(() => {
    if (videoElement.current && videoAttachmentSizeHandler) {
      const config = videoAttachmentSizeHandler(
        attachment,
        videoElement.current,
        shouldGenerateVideoThumbnail,
      );
      setAttachmentConfiguration(config);
    }
  }, [
    videoElement,
    videoAttachmentSizeHandler,
    attachment,
    shouldGenerateVideoThumbnail,
  ]);

  const renderThumbnailFirst = Boolean(
    attachment.thumb_url && shouldGenerateVideoThumbnail,
  );

  // todo: handle failed thumbnail loading
  return (
    <div
      className='str-chat__player-wrapper'
      data-testid='video-wrapper'
      ref={videoElement}
      style={getCssDimensionsVariables(attachment.thumb_url || '')}
    >
      {renderThumbnailFirst && !showVideo ? (
        <VideoThumbnail
          alt={attachment.title}
          data-testid='image-test'
          onPlay={() => setShowVideo(true)}
          src={attachment.thumb_url}
          title={attachment.title}
        />
      ) : (
        <VideoPlayer
          isPlaying={renderThumbnailFirst}
          thumbnailUrl={attachmentConfiguration?.thumbUrl}
          videoUrl={attachmentConfiguration?.url}
        />
      )}
    </div>
  );
};
