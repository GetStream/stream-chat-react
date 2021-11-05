import React, { useEffect, useRef } from 'react';

export type ModalProps = {
  open: boolean;
  onClose?: () => void | ((event?: React.BaseSyntheticEvent) => void);
};

export const SocialModal: React.FC<ModalProps> = (props) => {
  const { children, onClose, open } = props;

  const innerRef = useRef<HTMLDivElement | null>(null);
  const xRef = useRef<HTMLButtonElement | null>(null);
  const xInnerRef = useRef<SVGPathElement | null>(null);

  const handleClick = (
    event: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (
      event.target instanceof HTMLButtonElement &&
      xRef.current?.contains(event.target) &&
      onClose
    ) {
      onClose();
    }

    if (
      event.target instanceof SVGPathElement &&
      xInnerRef.current?.contains(event.target) &&
      onClose
    ) {
      onClose();
    }

    if (
      event.target instanceof HTMLDivElement &&
      !innerRef.current?.contains(event.target) &&
      onClose
    ) {
      onClose();
    }
  };

  useEffect(() => {
    const closeModal: EventListener = (event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', closeModal);
    return () => window.removeEventListener('keydown', closeModal);
  }, [onClose, open]);

  const openClasses = open ? 'str-chat__modal--open' : 'str-chat__modal--closed';

  return (
    <div className={`str-chat__modal ${openClasses}`} onClick={handleClick}>
      <div className='str-chat__modal__close-button'>
        Close
        <svg height='10' width='10' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z'
            fillRule='evenodd'
          />
        </svg>
      </div>
      <div className='str-chat__modal__inner' ref={innerRef}>
        <div className='edit-header'>
          <div>Edit Message</div>
          <button ref={xRef} className='str-chat__square-button' onClick={handleClick}>
            <svg height='10' width='10' xmlns='http://www.w3.org/2000/svg'>
              <path
                ref={xInnerRef}
                d='M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z'
                fillRule='evenodd'
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
