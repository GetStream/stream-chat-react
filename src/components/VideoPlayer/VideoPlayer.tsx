import { useComponentContext } from '../../context';
import ReactPlayerImport from 'react-player';
import React from 'react';

// react-player ships as CJS with the component on `exports.default`. Some
// bundler/interop setups (e.g. Vite serving our built ESM as a linked workspace
// dependency) hand back the module namespace `{ default }` instead of the
// component itself, which makes React throw "Element type is invalid ... got:
// object". Unwrap the default defensively so it works regardless of interop.
const ReactPlayer =
  (ReactPlayerImport as unknown as { default?: typeof ReactPlayerImport }).default ??
  ReactPlayerImport;

export type VideoPlayerProps = {
  isPlaying?: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
};

export const VideoPlayer = ({ isPlaying, thumbnailUrl, videoUrl }: VideoPlayerProps) => {
  const { VideoPlayer: VideoPlayerContext } = useComponentContext();

  return VideoPlayerContext ? (
    <VideoPlayerContext thumbnailUrl={thumbnailUrl} videoUrl={videoUrl} />
  ) : (
    <ReactPlayer
      className='react-player'
      config={{ file: { attributes: { poster: thumbnailUrl } } }}
      controls
      height='100%'
      playing={isPlaying}
      url={videoUrl}
      width='100%'
    />
  );
};
