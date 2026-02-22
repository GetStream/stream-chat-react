import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { FocusScope } from '@react-aria/focus';

import { modalDialogManagerId } from '../../context';
import {
  DialogPortalEntry,
  modalDialogId,
  useModalDialog,
  useModalDialogIsOpen,
} from '../Dialog';
import type { ModalCloseEvent, ModalCloseSource, ModalProps } from './Modal';

export const GlobalModal = ({
  children,
  className,
  CloseButtonOnOverlay,
  onClose,
  onCloseAttempt,
  open,
}: PropsWithChildren<ModalProps>) => {
  const dialog = useModalDialog();
  const isOpen = useModalDialogIsOpen();
  const innerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);

  const maybeClose = useCallback(
    (source: ModalCloseSource, event: ModalCloseEvent) => {
      const allow = onCloseAttempt?.(source, event);
      if (allow !== false) {
        onClose?.(event);
        dialog.close();
        closingRef.current = true;
      }
    },
    [dialog, onClose, onCloseAttempt],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    // Prevent DialogPortalDestination overlay from handling any click (closeAll).
    // Ensures overlay/button close is fully controlled by onCloseAttempt/onClose.
    event.stopPropagation();

    const target = event.target as HTMLButtonElement | HTMLDivElement;
    if (innerRef.current?.contains(target)) return;

    if (closeButtonRef.current?.contains(target)) {
      maybeClose('button', event);
    } else if (!innerRef.current?.contains(target)) {
      maybeClose('overlay', event);
    }
  };

  useEffect(() => {
    if (!open || !isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') maybeClose('escape', event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, maybeClose, open]);

  // Sync open prop → dialog open. Don't close here (dialog ref changes after close → effect loop).
  // closingRef blocks re-open when we just closed and parent hasn't set open=false yet.
  useEffect(() => {
    if (!open) {
      closingRef.current = false;
    }
    if (open && !isOpen && !closingRef.current) {
      dialog.open();
    }
  }, [dialog, isOpen, open]);

  if (!open || !isOpen) return null;

  return (
    <DialogPortalEntry dialogId={modalDialogId} dialogManagerId={modalDialogManagerId}>
      <div
        className={clsx(
          'str-chat str-chat__modal str-chat-react__modal str-chat__modal--open',
          className,
        )}
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
        {CloseButtonOnOverlay && (
          <CloseButtonOnOverlay onClick={handleClick} ref={closeButtonRef} />
        )}
      </div>
    </DialogPortalEntry>
  );
};
