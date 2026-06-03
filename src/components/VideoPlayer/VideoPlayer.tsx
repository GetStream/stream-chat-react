import React from 'react';

import { useComponentContext } from '../../context';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading/LoadingIndicator';

// `react-player` (~2 MB) is loaded lazily so it stays out of the SDK's eager
// import graph; the consumer's bundler emits it as a separate chunk that is
// fetched only when a default video player renders. Consumers who override
// `VideoPlayer` via `ComponentContext` never load it at all.
const ReactPlayer = React.lazy(() => import('./ReactPlayerWrapper'));

export type VideoPlayerProps = {
  isPlaying?: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
};

export const VideoPlayer = ({ isPlaying, thumbnailUrl, videoUrl }: VideoPlayerProps) => {
  const { LoadingIndicator = DefaultLoadingIndicator, VideoPlayer: VideoPlayerContext } =
    useComponentContext();

  return VideoPlayerContext ? (
    <VideoPlayerContext thumbnailUrl={thumbnailUrl} videoUrl={videoUrl} />
  ) : (
    <React.Suspense
      fallback={
        <div className='str-chat__video-player-loading'>
          <LoadingIndicator />
        </div>
      }
    >
      <ReactPlayer
        isPlaying={isPlaying}
        thumbnailUrl={thumbnailUrl}
        videoUrl={videoUrl}
      />
    </React.Suspense>
  );
};
