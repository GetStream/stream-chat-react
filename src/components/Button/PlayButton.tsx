import { Button } from './Button';
import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { IconPause, IconPlaySolid } from '../Icons';

export type PlayButtonProps = ComponentProps<'button'> & {
  isPlaying: boolean;
};

export const PlayButton = ({ className, isPlaying, ...props }: PlayButtonProps) => (
  <Button
    appearance='outline'
    circular
    className={clsx('str-chat__button-play', className)}
    data-testid={isPlaying ? 'pause-audio' : 'play-audio'}
    size='sm'
    variant='secondary'
    {...props}
  >
    {isPlaying ? <IconPause /> : <IconPlaySolid />}
  </Button>
);
