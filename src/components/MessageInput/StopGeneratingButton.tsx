import React from 'react';

export type StopGeneratingButtonProps = {
  onClick: () => void;
} & React.ComponentProps<'button'>;

export const StopGeneratingButton = ({ onClick }: StopGeneratingButtonProps) => (
  <button
    aria-label='Send'
    className='str-chat__stop-generating-button'
    data-testid='send-button'
    onClick={onClick}
    type='button'
  />
);
