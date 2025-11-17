import React from 'react';
import { PauseIcon, PlayTriangleIcon } from '../icons';

type PlayButtonProps = {
  isPlaying: boolean;
  onClick: () => void;
};

export const PlayButton = ({ isPlaying, onClick }: PlayButtonProps) => (
  <button
    className='str-chat__message-attachment-audio-widget--play-button'
    data-testid={isPlaying ? 'pause-audio' : 'play-audio'}
    onClick={onClick}
    type='button'
  >
    {isPlaying ? <PauseIcon /> : <PlayTriangleIcon />}
  </button>
);
