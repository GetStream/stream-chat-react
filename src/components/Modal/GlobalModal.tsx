import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
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
import type { ModalProps } from './Modal';

export const GlobalModal = ({
  children,
  className,
  onClose,
  open,
}: PropsWithChildren<ModalProps>) => {
  const { t } = useTranslationContext('Modal');

  const dialog = useModalDialog();
  const isOpen = useModalDialogIsOpen();
  const innerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (innerRef.current?.contains(event.target as HTMLButtonElement | HTMLDivElement))
      return;
    onClose?.(event);
    dialog.close();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.(event as unknown as React.KeyboardEvent);
        dialog.close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dialog, onClose, isOpen]);

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
            ref={closeRef}
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
