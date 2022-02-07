import React, { useEffect, useRef } from 'react';

import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';

export type ModalProps = {
  /** If true, modal is opened or visible. */
  open: boolean;
  /** Callback handler for closing of modal. */
  onClose?: () => void | ((event?: React.BaseSyntheticEvent) => void);
};

export const Modal: React.FC<ModalProps> = (props) => {
  const { children, onClose, open } = props;

  const { modalRef, sendButtonRef, setTriggerFocus, triggerFocus } = useChannelStateContext(
    'Modal',
  );
  const { t } = useTranslationContext('Modal');

  const innerRef = useRef<HTMLDivElement | null>(null);

  const handleEvent = (event: React.MouseEvent | KeyboardEvent) => {
    if (
      (event.target instanceof HTMLDivElement && !innerRef.current?.contains(event.target)) ||
      (event.target instanceof HTMLButtonElement && event.type === 'click') ||
      (event instanceof KeyboardEvent && event.key === 'Escape')
    ) {
      if (onClose && setTriggerFocus) {
        onClose();
        setTriggerFocus(!triggerFocus);
      }
      /**
       * Prevent focus from leaving modal
       */
    } else if (event instanceof KeyboardEvent && event.key === 'Tab') {
      if (
        !event.shiftKey &&
        (sendButtonRef?.current === event.target ||
          (event.target as HTMLButtonElement).classList.contains('image-gallery-fullscreen-button'))
      ) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && modalRef?.current?.children[0] === event.target) {
        event.preventDefault();
        return;
      }
    }
  };

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEvent);
    }
    return () => {
      document.removeEventListener('keydown', handleEvent);
    };
  }, [open]);

  const openClasses = open ? 'str-chat__modal--open' : 'str-chat__modal--closed';

  return (
    <div
      className={`str-chat__modal ${openClasses}`}
      onClick={handleEvent}
      ref={open ? modalRef : null}
    >
      <button className='str-chat__modal__close-button' onClick={handleEvent} title='Close'>
        {t('Close')}
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
