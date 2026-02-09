import React from 'react';
import { Button } from '../../Button';
import clsx from 'clsx';

export type PlaybackRateButtonProps = React.ComponentProps<'button'>;

export const PlaybackRateButton = ({ children, onClick }: PlaybackRateButtonProps) => (
  <Button
    className={clsx('str-chat__message_attachment__playback-rate-button')}
    data-testid='playback-rate-button'
    onClick={onClick}
    type='button'
  >
    {children}
  </Button>
);
