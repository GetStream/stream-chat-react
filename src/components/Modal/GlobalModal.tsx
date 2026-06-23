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

import { AriaLiveOutlet } from '../Accessibility';
import { NotificationList as DefaultNotificationList } from '../Notifications';
import {
  ModalContextProvider,
  modalDialogManagerId,
  useChatContext,
  useComponentContext,
} from '../../context';
import {
  DialogPortalEntry,
  modalDialogId,
  useModalDialog,
  useModalDialogIsOpen,
  useModalDialogIsTopmost,
} from '../Dialog';
import { useResolvedModalAriaProps } from '../../a11y/hooks/useResolvedModalAriaProps';
import { useStableId } from '../UtilityComponents/useStableId';

export type ModalCloseEvent =
  | KeyboardEvent
  | React.KeyboardEvent
  | React.MouseEvent<HTMLButtonElement | HTMLDivElement>;

export type ModalCloseSource = 'overlay' | 'button' | 'escape';
export type ModalInitialFocusStrategy = 'dialog' | 'firstElement';

export type ModalProps = {
  /** If true, modal is opened or visible. */
  open: boolean;
  /** Custom class to be applied to the modal root div */
  className?: string;
  /** Optional stable id for this modal instance. Generated automatically when omitted. */
  dialogId?: string;
  /** Accessible label for the modal dialog. Ignored when aria-labelledby is provided. */
  'aria-label'?: string;
  /** ID of the element that labels the modal dialog. */
  'aria-labelledby'?: string;
  /** ID of the element that describes the modal dialog. */
  'aria-describedby'?: string;
  /** ARIA role for the modal dialog surface. */
  role?: 'alertdialog' | 'dialog';
  /** Controls whether the dialog surface or the first focusable descendant receives initial focus. */
  initialFocusStrategy?: ModalInitialFocusStrategy;
  /** Resolves a custom initial focus element. When provided, it overrides `initialFocusStrategy` and falls back to the dialog surface when no element is returned. */
  getInitialFocusElement?: (dialogElement: HTMLDivElement) => HTMLElement | null;
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
  dialogId,
  getInitialFocusElement,
  initialFocusStrategy,
  onClose,
  onCloseAttempt,
  open,
  role = 'dialog',
}: PropsWithChildren<ModalProps>) => {
  const generatedDialogId = useStableId();
  const resolvedDialogId = dialogId ?? `${modalDialogId}-${generatedDialogId}`;
  const dialog = useModalDialog(resolvedDialogId);
  const isOpen = useModalDialogIsOpen(resolvedDialogId);
  const isTopmost = useModalDialogIsTopmost(resolvedDialogId);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);
  const { theme } = useChatContext();
  const { NotificationList = DefaultNotificationList } = useComponentContext();
  const dialogLabelingBaseId = dialogId ?? modalDialogId;
  const resolvedInitialFocusStrategy: ModalInitialFocusStrategy =
    initialFocusStrategy ?? 'firstElement';
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
    if (!isTopmost) return;
    const target = event.target as HTMLDivElement;
    if (overlayRef.current === target) {
      maybeClose('overlay', event);
    }
  };

  const handleCloseButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isTopmost) return;
    maybeClose('button', event);
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.key !== 'Escape' || !isTopmost) return;
    maybeClose('escape', event);
  };

  // Sync open prop to dialog state.
  // closingRef blocks re-open when we just closed and parent hasn't set open=false yet.
  useEffect(() => {
    if (!open) {
      closingRef.current = false;
      if (isOpen) {
        dialog.close();
      }
      return;
    }
    if (open && !isOpen && !closingRef.current) {
      dialog.open();
    }
  }, [dialog, isOpen, open]);

  useEffect(() => {
    if (
      !open ||
      !isOpen ||
      (!getInitialFocusElement && resolvedInitialFocusStrategy === 'firstElement')
    )
      return;

    const frame = requestAnimationFrame(() => {
      const dialogElement = dialogRef.current;
      if (!dialogElement) return;

      const target = getInitialFocusElement?.(dialogElement) ?? dialogElement;

      target.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [getInitialFocusElement, isOpen, open, resolvedInitialFocusStrategy]);

  if (!open || !isOpen) return null;

  return (
    <DialogPortalEntry dialogId={resolvedDialogId} dialogManagerId={modalDialogManagerId}>
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
          <FocusScope
            autoFocus={
              isTopmost &&
              !getInitialFocusElement &&
              resolvedInitialFocusStrategy === 'firstElement'
            }
            contain={isTopmost}
            restoreFocus
          >
            <div
              aria-describedby={resolvedModalAriaProps['aria-describedby']}
              aria-label={resolvedModalAriaProps['aria-label']}
              aria-labelledby={resolvedModalAriaProps['aria-labelledby']}
              aria-modal={isTopmost ? 'true' : undefined}
              className='str-chat__modal__dialog'
              inert={isTopmost ? undefined : true}
              onKeyDown={handleDialogKeyDown}
              ref={dialogRef}
              role={role}
              tabIndex={isTopmost ? 0 : -1}
            >
              {children}
              {/* Render the live-region outlet inside the active modal subtree
                  (only the topmost dialog carries `aria-modal`) so announcements
                  are not suppressed by assistive technologies. */}
              {isTopmost && <AriaLiveOutlet layer={1} />}
            </div>
          </FocusScope>
          <NotificationList
            className='str-chat__modal__notification-list'
            panel='modal'
            verticalAlignment='top'
          />
          {CloseButtonOnOverlay && (
            <CloseButtonOnOverlay onClick={handleCloseButtonClick} ref={closeButtonRef} />
          )}
        </div>
      </ModalContextProvider>
    </DialogPortalEntry>
  );
};
