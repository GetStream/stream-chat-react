import { Button } from './Button';
import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { IconPause, IconPlaySolid } from '../Icons';

export type PlayButtonProps = ComponentProps<'button'> & {
  isPlaying: boolean;
};

export const PlayButton = ({ className, isPlaying, ...props }: PlayButtonProps) => (
  <Button
    {...props}
    className={clsx(
      'str-chat__button-play',
      'str-chat__button--secondary',
      'str-chat__button--outline',
      'str-chat__button--size-sm',
      'str-chat__button--circular',
      className,
    )}
    data-testid={isPlaying ? 'pause-audio' : 'play-audio'}
  >
    {isPlaying ? <IconPause /> : <IconPlaySolid />}
  </Button>
);
