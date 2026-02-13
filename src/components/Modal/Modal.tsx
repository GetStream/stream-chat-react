import clsx from 'clsx';
import React, { type PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { FocusScope } from '@react-aria/focus';

export type ModalCloseEvent =
  | KeyboardEvent
  | React.KeyboardEvent
  | React.MouseEvent<HTMLButtonElement | HTMLDivElement>;

export type ModalCloseSource = 'overlay' | 'button' | 'escape';

export type ModalProps = {
  /** If true, modal is opened or visible. */
  open: boolean;
  /** Custom class to be applied to the modal root div */
  className?: string;
  /** Callback handler for closing of modal. */
  onClose?: (event: ModalCloseEvent) => void;
  /** Optional handler to intercept closing logic. Return false to prevent onClose. */
  onCloseAttempt?: (source: ModalCloseSource, event: ModalCloseEvent) => boolean;
};

export const Modal = ({
  children,
  className,
  onClose,
  onCloseAttempt,
  open,
}: PropsWithChildren<ModalProps>) => {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const maybeClose = useCallback(
    (source: ModalCloseSource, event: ModalCloseEvent) => {
      const allow = onCloseAttempt?.(source, event);
      if (allow !== false) {
        onClose?.(event);
      }
    },
    [onClose, onCloseAttempt],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    const target = event.target as HTMLButtonElement | HTMLDivElement;
    if (!innerRef.current || !closeButtonRef.current) return;

    if (closeButtonRef.current.contains(target)) {
      maybeClose('button', event);
    } else if (!innerRef.current.contains(target)) {
      maybeClose('overlay', event);
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') maybeClose('escape', event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [maybeClose, open]);

  if (!open) return null;

  return (
    <div
      className={clsx('str-chat__modal str-chat__modal--open', className)}
      onClick={handleClick}
    >
      <FocusScope autoFocus contain>
        <div
          className='str-chat__modal__inner str-chat-react__modal__inner'
          ref={innerRef}
        >
          {children}
        </div>
      </FocusScope>
    </div>
  );
};
