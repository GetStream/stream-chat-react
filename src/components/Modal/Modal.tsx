import clsx from 'clsx';
import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { CloseIconRound } from './icons';

import { useChatContext, useTranslationContext } from '../../context';

export type ModalProps = {
  /** If true, modal is opened or visible. */
  open: boolean;
  /** Custom classes for modal elements */
  className?: { content?: string; overlay?: string };
  /** If true, the close button will not be rendered */
  hideCloseButton?: boolean;
  /** Additional props for the div element wrapping the modal content */
  innerContainerProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Callback handler for closing of modal. */
  onClose?: (
    event: React.KeyboardEvent | React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ) => void;
  /** Allows to set reference to the inner container for the parent components */
  setInnerContainer?: Dispatch<SetStateAction<HTMLDivElement | null>>;
};

export const Modal = ({
  children,
  className,
  hideCloseButton,
  innerContainerProps = {},
  onClose,
  open,
  setInnerContainer,
}: PropsWithChildren<ModalProps>) => {
  const { t } = useTranslationContext('Modal');
  const { themeVersion } = useChatContext('Modal');

  const [innerContainer, setInnerContainerInternally] = useState<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    const target = event.target as HTMLButtonElement | HTMLDivElement;

    if (!innerContainer?.contains(target) || closeRef?.current?.contains(target)) onClose?.(event);
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.((event as unknown) as React.KeyboardEvent);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className={clsx('str-chat__modal', 'str-chat__modal--open', className?.overlay)}
      data-testid='modal-overlay'
      onClick={handleClick}
    >
      {!hideCloseButton && (
        <button className='str-chat__modal__close-button' ref={closeRef} title={t<string>('Close')}>
          {themeVersion === '2' && <CloseIconRound />}
          {themeVersion === '1' && (
            <>
              {t<string>('Close')}
              <svg height='10' width='10' xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z'
                  fillRule='evenodd'
                />
              </svg>
            </>
          )}
        </button>
      )}
      <div
        className={clsx('str-chat__modal__inner str-chat-react__modal__inner', className?.content)}
        {...innerContainerProps}
        ref={(instance) => {
          setInnerContainerInternally(instance);
          setInnerContainer?.(instance);
        }}
      >
        {children}
      </div>
    </div>
  );
};
