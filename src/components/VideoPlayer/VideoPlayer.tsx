import { useComponentContext } from '../../context';
import ReactPlayer from 'react-player';
import React from 'react';

export type VideoPlayerProps = {
  url: string;
  thumbnailUrl?: string;
};

export const VideoPlayer = ({ thumbnailUrl, url }: VideoPlayerProps) => {
  const { VideoPlayer: VideoPlayerContext } = useComponentContext();

  return VideoPlayerContext ? (
    <VideoPlayerContext thumbnailUrl={thumbnailUrl} url={url} />
  ) : (
    <ReactPlayer
      className='react-player'
      config={{
        file: { attributes: { poster: thumbnailUrl } },
      }}
      controls
      height='100%'
      url={url}
      width='100%'
    />
  );
};
