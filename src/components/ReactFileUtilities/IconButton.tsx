import React, { MouseEventHandler, PropsWithChildren } from 'react';
import { useTranslationContext } from '../../context';

export type IconButtonProps = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

/**
 * This is simply a button wrapper, adds a div with `role="button"` and a onClick
 */
export const IconButton = ({ children, onClick }: PropsWithChildren<IconButtonProps>) => {
  const { t } = useTranslationContext('IconButton');
  return (
    <button
      aria-label={t('aria/Cancel upload')}
      className='rfu-icon-button'
      data-testid='cancel-upload-button'
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  );
};
