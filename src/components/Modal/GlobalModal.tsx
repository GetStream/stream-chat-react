import clsx from 'clsx';
import React, {
  type ComponentProps,
  type ComponentType,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { FocusScope } from '@react-aria/focus';

import {
  ModalContextProvider,
  modalDialogManagerId,
  useChatContext,
} from '../../context';
import {
  DialogPortalEntry,
  modalDialogId,
  useModalDialog,
  useModalDialogIsOpen,
} from '../Dialog';

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
  /** If provided, the close button is rendered on overlay */
  CloseButtonOnOverlay?: ComponentType<ComponentProps<'button'>>;
  /** Callback handler for closing of modal. */
  onClose?: (event: ModalCloseEvent) => void;
  /** Optional handler to intercept closing logic. Return false to prevent onClose. */
  onCloseAttempt?: (source: ModalCloseSource, event: ModalCloseEvent) => boolean;
};

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
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);
  const { theme } = useChatContext('GlobalModal');

  const maybeClose = useCallback(
    (source: ModalCloseSource, event: ModalCloseEvent) => {
      const allow = onCloseAttempt?.(source, event);
      if (allow !== false) {
        dialog.close();
        closingRef.current = true;
        onClose?.(event);
      }
    },
    [dialog, onClose, onCloseAttempt],
  );

  const modalContextValue = useMemo<{ close: () => void }>(
    () => ({
      close: () => maybeClose('button', {} as ModalCloseEvent),
    }),
    [maybeClose],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    const target = event.target as HTMLButtonElement | HTMLDivElement;
    if (closeButtonRef.current?.contains(target)) {
      maybeClose('button', event);
    } else if (overlayRef.current === target) {
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
      <ModalContextProvider value={modalContextValue}>
        <div
          className={clsx(
            'str-chat',
            theme,
            'str-chat__modal str-chat-react__modal str-chat__modal--open',
            className,
          )}
          onClick={handleClick}
          ref={overlayRef}
        >
          <FocusScope autoFocus contain>
            {children}
          </FocusScope>
          {CloseButtonOnOverlay && (
            <CloseButtonOnOverlay onClick={handleClick} ref={closeButtonRef} />
          )}
        </div>
      </ModalContextProvider>
    </DialogPortalEntry>
  );
};
