import { useComponentContext } from '../../context';
import ReactPlayer from 'react-player';
import React from 'react';

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
