import React, { MouseEventHandler, PropsWithChildren } from 'react';

export type IconButtonProps = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

/**
 * This is simply a button wrapper, adds a div with `role="button"` and a onClick
 */
export const IconButton = ({ children, onClick }: PropsWithChildren<IconButtonProps>) => (
  <button
    aria-label='Cancel upload'
    className='rfu-icon-button'
    data-testid='cancel-upload-button'
    onClick={onClick}
    type='button'
  >
    {children}
  </button>
);
