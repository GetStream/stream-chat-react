import React, { PropsWithChildren, useEffect, useRef } from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export type ModalProps = {
  /** If true, modal is opened or visible. */
  open: boolean;
  /** Callback handler for closing of modal. */
  onClose?: () => void | ((event?: React.BaseSyntheticEvent) => void);
};

export const Modal = (props: PropsWithChildren<ModalProps>) => {
  const { children, onClose, open } = props;

  const { t } = useTranslationContext('Modal');

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

  return (
    <div className={`str-chat__modal ${openClasses}`} onClick={handleClick}>
      <button className='str-chat__modal__close-button' ref={closeRef} title='Close'>
        {t<string>('Close')}
        <svg height='10' width='10' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z'
            fillRule='evenodd'
          />
        </svg>
      </button>
      <div className='str-chat__modal__inner' ref={innerRef}>
        {children}
      </div>
    </div>
  );
};
