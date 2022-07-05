import React, { PropsWithChildren, useEffect, useRef } from 'react';

import { CloseIcon } from './icons';

export type ModalProps = {
  /** If true, modal is opened or visible. */
  open: boolean;
  /** Callback handler for closing of modal. */
  onClose?: () => void | ((event?: React.BaseSyntheticEvent) => void);
};

export const Modal = (props: PropsWithChildren<ModalProps>) => {
  const { children, onClose, open } = props;

  const innerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLButtonElement | HTMLDivElement;
    if (!innerRef.current || !closeRef.current) return;

    if (!innerRef.current.contains(target) || closeRef.current.contains(target)) onClose?.();
  };

  useEffect(() => {
    if (!open) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose, open]);

  const openClasses = open ? 'str-chat__modal--open' : 'str-chat__modal--closed';

  if (!open) return null;

  return (
    <div className={`str-chat__modal ${openClasses}`} onClick={handleClick}>
      <button className='str-chat__modal__close-button' ref={closeRef} title='Close'>
        <CloseIcon />
      </button>
      <div className='str-chat__modal__inner' ref={innerRef}>
        {children}
      </div>
    </div>
  );
};
