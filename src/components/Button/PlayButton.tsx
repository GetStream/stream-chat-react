import React from 'react';
import { Button } from './Button';
import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { IconPauseFill, IconPlayFill } from '../Icons';
import { useTranslationContext } from '../../context';

export type PlayButtonProps = ComponentProps<'button'> & {
  isPlaying: boolean;
};

export const PlayButton = ({ className, isPlaying, ...props }: PlayButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <Button
      appearance='outline'
      aria-label={
        isPlaying
          ? t('common.pause.ariaLabel', 'Pause')
          : t('common.play.ariaLabel', 'Play')
      }
      circular
      className={clsx('str-chat__button-play', className)}
      data-testid={isPlaying ? 'pause-audio' : 'play-audio'}
      size='sm'
      variant='secondary'
      {...props}
    >
      {isPlaying ? <IconPauseFill /> : <IconPlayFill />}
    </Button>
  );
};
