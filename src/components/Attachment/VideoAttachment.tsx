import type { VideoAttachment as VideoAttachmentType } from 'stream-chat';
import React, { type ComponentType, useLayoutEffect, useRef, useState } from 'react';
import { getCssDimensionsVariables } from './utils';
import type { VideoPlayerProps } from '../VideoPlayer';
import { VideoPlayer as DefaultVideoPlayer } from '../VideoPlayer';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';
import clsx from 'clsx';
import { useLocalVideoDimensions } from './hooks/useLocalVideoDimensions';
import { getAttachmentPreviewUrl, isPendingUpload } from 'stream-chat';
import {
  useAttachmentContext,
  type VideoAttachmentConfiguration,
} from '../../context/AttachmentContext';

export type VideoAttachmentProps = {
  attachment: VideoAttachmentType;
  VideoPlayer?: ComponentType<VideoPlayerProps>;
};

export const VideoAttachment = ({
  attachment,
  VideoPlayer = DefaultVideoPlayer,
}: VideoAttachmentProps) => {
  const { shouldGenerateVideoThumbnail, videoAttachmentSizeHandler } =
    useAttachmentContext();
  const videoElement = useRef<HTMLDivElement>(null);
  const [attachmentConfiguration, setAttachmentConfiguration] =
    useState<VideoAttachmentConfiguration>();
  // A video that mounts while uploading stays on the player after the upload lands: switching to
  // the thumbnail would swap the rendered element when `thumb_url` arrives and again on play, and
  // each swap resizes the `fit-content` bubble (local `<video>`, CDN `<img>` and CDN `<video>`
  // have different intrinsic widths).
  const [showVideo, setShowVideo] = React.useState(
    () => !shouldGenerateVideoThumbnail || isPendingUpload(attachment),
  );
  // Only a click on the thumbnail's play button requests playback; `showVideo` is also true for
  // videos that never had a thumbnail to click.
  const [playbackRequested, setPlaybackRequested] = React.useState(false);
  // Whether the upload is still pending: the bytes are not on the CDN yet, whether or not a
  // request is running right now.
  const isUploading = isPendingUpload(attachment);
  // While the upload is pending there is no CDN `thumb_url` to read `oh`/`ow` from, so the box
  // would lay out from the 1000000x1000000 fallback and resize later. The local file knows them.
  const localDimensions = useLocalVideoDimensions(
    isUploading ? getAttachmentPreviewUrl(attachment) : undefined,
  );
  const dimensionVariables = localDimensions
    ? {
        '--original-height': localDimensions.height,
        '--original-width': localDimensions.width,
      }
    : getCssDimensionsVariables(attachment.thumb_url || '');

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
      className={clsx('str-chat__player-wrapper', {
        // Only until the dimensions are known: lets the element use its own aspect ratio instead
        // of the fallback square.
        'str-chat__player-wrapper--uploading': isUploading && !localDimensions,
      })}
      data-testid='video-wrapper'
      ref={videoElement}
      style={dimensionVariables}
    >
      {renderThumbnailFirst && !showVideo ? (
        <VideoThumbnail
          alt={attachment.title}
          data-testid='image-test'
          onPlay={() => {
            setPlaybackRequested(true);
            setShowVideo(true);
          }}
          src={attachment.thumb_url}
          title={attachment.title}
        />
      ) : (
        <VideoPlayer
          // Playback stays available while the upload runs (the local blob plays); the progress
          // overlay sits clear of the transport controls. Autoplay only after a click on the
          // thumbnail: `renderThumbnailFirst` only says a thumbnail exists, so using it would
          // restart a video watched from its local blob once `thumb_url` arrives.
          isPlaying={playbackRequested}
          thumbnailUrl={attachmentConfiguration?.thumbUrl}
          // Falls back to the local blob preview while the upload is still in flight.
          videoUrl={getAttachmentPreviewUrl(attachment, attachmentConfiguration?.url)}
        />
      )}
    </div>
  );
};
