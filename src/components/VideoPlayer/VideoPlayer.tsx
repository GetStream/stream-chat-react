import React from 'react';

import { useComponentContext } from '../../context';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading/LoadingIndicator';

// `react-player` (~2 MB) is loaded lazily, so it stays out of the eager import graph and is
// fetched only when a default video player renders. A `VideoPlayer` override from
// `ComponentContext` never loads it.
const ReactPlayer = React.lazy(() => import('./ReactPlayerWrapper'));

export type VideoPlayerProps = {
  /**
   * Whether the native playback controls render. Set to `false` for a video that cannot be played
   * yet, such as one whose upload is in flight.
   * @default true
   */
  controls?: boolean;
  isPlaying?: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
};

export const VideoPlayer = ({
  controls = true,
  isPlaying,
  thumbnailUrl,
  videoUrl,
}: VideoPlayerProps) => {
  const { LoadingIndicator = DefaultLoadingIndicator, VideoPlayer: VideoPlayerContext } =
    useComponentContext();

  return VideoPlayerContext ? (
    <VideoPlayerContext
      controls={controls}
      isPlaying={isPlaying}
      thumbnailUrl={thumbnailUrl}
      videoUrl={videoUrl}
    />
  ) : (
    <React.Suspense
      fallback={
        <div className='str-chat__video-player-loading'>
          <LoadingIndicator />
        </div>
      }
    >
      <ReactPlayer
        controls={controls}
        isPlaying={isPlaying}
        thumbnailUrl={thumbnailUrl}
        videoUrl={videoUrl}
      />
    </React.Suspense>
  );
};
