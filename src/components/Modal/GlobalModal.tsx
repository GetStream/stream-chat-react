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
import { useResolvedModalAriaProps } from '../../a11y/hooks/useResolvedModalAriaProps';

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
  /** Properties forwarded to the root div within which the dialog content is rendered */
  dialogRootProps?: Omit<
    ComponentProps<'div'>,
    'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'role'
  >;
  /** Accessible label for the modal dialog. Ignored when aria-labelledby is provided. */
  'aria-label'?: string;
  /** ID of the element that labels the modal dialog. */
  'aria-labelledby'?: string;
  /** ID of the element that describes the modal dialog. */
  'aria-describedby'?: string;
  /** ARIA role for the modal dialog surface. */
  role?: 'alertdialog' | 'dialog';
  /** If provided, the close button is rendered on overlay */
  CloseButtonOnOverlay?: ComponentType<ComponentProps<'button'>>;
  /** Callback handler for closing of modal. */
  onClose?: (event: ModalCloseEvent) => void;
  /** Optional handler to intercept closing logic. Return false to prevent onClose. */
  onCloseAttempt?: (source: ModalCloseSource, event: ModalCloseEvent) => boolean;
};

export const GlobalModal = ({
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  children,
  className,
  CloseButtonOnOverlay,
  dialogRootProps,
  onClose,
  onCloseAttempt,
  open,
  role = 'dialog',
}: PropsWithChildren<ModalProps>) => {
  const dialog = useModalDialog();
  const isOpen = useModalDialogIsOpen();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);
  const { theme } = useChatContext();
  const {
    className: dialogRootClassName,
    onKeyDown: dialogRootOnKeyDown,
    ...dialogRootPropsRest
  } = dialogRootProps ?? {};
  const dialogLabelingBaseId = dialog.id;
  const resolvedModalAriaProps = useResolvedModalAriaProps({
    ariaDescribedby,
    ariaLabel,
    ariaLabelledby,
    dialogId: dialogLabelingBaseId,
  });

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

  const modalContextValue = useMemo<{ close: () => void; dialogId?: string }>(
    () => ({
      close: () => maybeClose('button', {} as ModalCloseEvent),
      dialogId: dialogLabelingBaseId,
    }),
    [dialogLabelingBaseId, maybeClose],
  );

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    if (overlayRef.current === target) {
      maybeClose('overlay', event);
    }
  };

  const handleCloseButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    maybeClose('button', event);
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    dialogRootOnKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Escape') return;
    maybeClose('escape', event);
  };

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
          onClick={handleOverlayClick}
          ref={overlayRef}
        >
          <FocusScope autoFocus contain restoreFocus>
            <div
              tabIndex={-1}
              {...dialogRootPropsRest}
              aria-describedby={resolvedModalAriaProps['aria-describedby']}
              aria-label={resolvedModalAriaProps['aria-label']}
              aria-labelledby={resolvedModalAriaProps['aria-labelledby']}
              aria-modal='true'
              className={clsx('str-chat__modal__dialog', dialogRootClassName)}
              onKeyDown={handleDialogKeyDown}
              role={role}
            >
              {children}
            </div>
          </FocusScope>
          {CloseButtonOnOverlay && (
            <CloseButtonOnOverlay onClick={handleCloseButtonClick} ref={closeButtonRef} />
          )}
        </div>
      </ModalContextProvider>
    </DialogPortalEntry>
  );
};
