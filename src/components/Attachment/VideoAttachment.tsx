import type { VideoAttachment as VideoAttachmentType } from 'stream-chat';
import { useChannelStateContext } from '../../context';
import React, { type ComponentType, useLayoutEffect, useRef, useState } from 'react';
import type { VideoAttachmentConfiguration } from '../../types/types';
import { getCssDimensionsVariables } from './utils';
import type { VideoPlayerProps } from '../VideoPlayer';
import { VideoPlayer as DefaultVideoPlayer } from '../VideoPlayer';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';
import clsx from 'clsx';
import {
  getAttachmentPreviewUrl,
  hasPendingUploadState,
} from './hooks/useAttachmentUploadState';
import { useLocalVideoDimensions } from './hooks/useLocalVideoDimensions';

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
  // A video that mounted while uploading has been showing its player all along, so it stays on
  // the player once the upload lands. Falling back to the thumbnail would swap the rendered
  // element twice — once when `thumb_url` arrives, once when the user clicks play — and each swap
  // resizes the bubble, because the bubble is `fit-content` and the three renderings (local
  // `<video>`, CDN thumbnail `<img>`, CDN `<video>`) contribute different intrinsic widths.
  const [showVideo, setShowVideo] = React.useState(
    () => !shouldGenerateVideoThumbnail || hasPendingUploadState(attachment),
  );
  // Only a click on the thumbnail's play button asks for playback. Kept separate from
  // `showVideo`, which is also true for a video that never had a thumbnail to click.
  const [playbackRequested, setPlaybackRequested] = React.useState(false);
  // Structural: the bytes are not on the CDN, so there is nothing to play — independent of
  // whether a request happens to be running this instant.
  const isUploading = hasPendingUploadState(attachment);

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

  // While the upload is in flight there is no CDN `thumb_url` to read `oh`/`ow` from, so the box
  // would lay out from the 1000000x1000000 fallback and then resize once the real dimensions
  // arrive. The local file knows them already.
  const localDimensions = useLocalVideoDimensions(
    isUploading ? getAttachmentPreviewUrl(attachment) : undefined,
  );
  const dimensionVariables = localDimensions
    ? {
        '--original-height': localDimensions.height,
        '--original-width': localDimensions.width,
      }
    : getCssDimensionsVariables(attachment.thumb_url || '');

  // todo: handle failed thumbnail loading
  return (
    <div
      className={clsx('str-chat__player-wrapper', {
        // Only until the dimensions are known — the class lets the element lay out at its own
        // aspect ratio instead of the square the fallback would produce.
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
          // Playback stays available while the upload runs: the local blob plays, and every
          // message-list widget behaves this way (audio too), as does stream-chat-react-native.
          // The progress overlay is positioned clear of the transport controls.
          //
          // Autoplay only when the user asked for it by clicking the thumbnail. This used to be
          // `renderThumbnailFirst`, which stands for "a thumbnail exists" — so a video watched
          // from its local blob started playing again by itself the moment the upload finished
          // and `thumb_url` arrived.
          isPlaying={playbackRequested}
          thumbnailUrl={attachmentConfiguration?.thumbUrl}
          // Falls back to the local blob preview while the upload is still in flight.
          videoUrl={getAttachmentPreviewUrl(attachment, attachmentConfiguration?.url)}
        />
      )}
    </div>
  );
};
