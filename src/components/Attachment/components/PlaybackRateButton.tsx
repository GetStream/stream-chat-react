import React from 'react';

export type PlaybackRateButtonProps = React.ComponentProps<'button'>;

export const PlaybackRateButton = ({ children, onClick }: PlaybackRateButtonProps) => (
  <button
    className='str-chat__message_attachment__playback-rate-button'
    data-testid='playback-rate-button'
    onClick={onClick}
    type='button'
  >
    {children}
  </button>
);
