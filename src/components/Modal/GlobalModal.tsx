import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import React, { useEffect, useRef } from 'react';
import { FocusScope } from '@react-aria/focus';

import { CloseIconRound } from './icons';

import { useTranslationContext } from '../../context';
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
  onClose,
  onCloseAttempt,
  open,
}: PropsWithChildren<ModalProps>) => {
  const { t } = useTranslationContext('Modal');

  const dialog = useModalDialog();
  const isOpen = useModalDialogIsOpen();
  const innerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const maybeClose = useCallback(
    (source: ModalCloseSource, event: ModalCloseEvent) => {
      const allow = onCloseAttempt?.(source, event);
      if (allow !== false) {
        onClose?.(event);
        dialog.close();
      }
    },
    [dialog, onClose, onCloseAttempt],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    const target = event.target as HTMLButtonElement | HTMLDivElement;
    if (!innerRef.current || !closeButtonRef.current) return;
    if (innerRef.current?.contains(target)) return;

    if (closeButtonRef.current.contains(target)) {
      maybeClose('button', event);
    } else if (!innerRef.current.contains(target)) {
      maybeClose('overlay', event);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') maybeClose('escape', event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, maybeClose]);

  useEffect(() => {
    if (open && !dialog.isOpen) {
      dialog.open();
    }
  }, [dialog, open]);

  if (!open || !isOpen) return null;

  return (
    <DialogPortalEntry dialogId={modalDialogId}>
      <div
        className={clsx(
          'str-chat str-chat__modal str-chat-react__modal str-chat__modal--open',
          className,
        )}
        onClick={handleClick}
      >
        <FocusScope autoFocus contain>
          <button
            className='str-chat__modal__close-button'
            ref={closeButtonRef}
            title={t('Close')}
            type='button'
          >
            <CloseIconRound />
          </button>
          <div
            className='str-chat__modal__inner str-chat-react__modal__inner'
            ref={innerRef}
          >
            {children}
          </div>
        </FocusScope>
      </div>
    </DialogPortalEntry>
  );
};
