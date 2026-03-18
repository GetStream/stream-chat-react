import React from 'react';
import { Button } from '../../Button';
import clsx from 'clsx';

export type PlaybackRateButtonProps = React.ComponentProps<'button'>;

export const PlaybackRateButton = ({
  children,
  className,
  ...rest
}: PlaybackRateButtonProps) => (
  <Button
    data-testid='playback-rate-button'
    {...rest}
    className={clsx('str-chat__playback-rate-button', className)}
  >
    {children}
  </Button>
);
