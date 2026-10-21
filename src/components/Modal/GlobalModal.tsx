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
  DialogManagerProvider,
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
  /** Whether the modal is open. */
  open: boolean;
  /** Class applied to the modal root div. */
  className?: string;
  /** Stable ID for this modal instance. Generated when omitted. */
  dialogId?: string;
  /**
   * Props forwarded to the dialog surface div. `className` is merged; `onKeyDown` runs first, and
   * `preventDefault()` in it skips the built-in Escape and Enter handling.
   */
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
  /**
   * Whether the dialog surface (`'dialog'`) or its first focusable descendant (`'firstElement'`)
   * receives initial focus. Defaults to `'firstElement'`.
   */
  initialFocusStrategy?: ModalInitialFocusStrategy;
  /**
   * Returns the element to focus initially. It overrides `initialFocusStrategy`, and the dialog
   * surface is focused when it returns `null`.
   */
  getInitialFocusElement?: (dialogElement: HTMLDivElement) => HTMLElement | null;
  /** Close button component rendered on the overlay when provided. */
  CloseButtonOnOverlay?: ComponentType<ComponentProps<'button'>>;
  /**
   * Called when the modal closes itself (overlay click, close button, Escape or the modal
   * context's `close`), not when `open` turns false.
   */
  onClose?: (event: ModalCloseEvent) => void;
  /** Called before closing; return `false` to prevent closing and `onClose`. */
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
  dialogRootProps,
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
  const {
    className: dialogRootClassName,
    onKeyDown: dialogRootOnKeyDown,
    ...dialogRootPropsRest
  } = dialogRootProps ?? {};
  // The base for label and description IDs must be unique per modal: `resolvedDialogId` carries a
  // per-instance suffix, while the shared `modalDialogId` would collide across stacked modals.
  const dialogLabelingBaseId = resolvedDialogId;
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
    dialogRootOnKeyDown?.(event);
    if (event.defaultPrevented || !isTopmost) return;

    if (event.key === 'Escape') {
      maybeClose('escape', event);
      return;
    }

    // Initial focus can land on the dialog surface so the screen reader announces the dialog. Enter
    // there moves focus to the default field (`[data-autofocus]`); the target check ignores Enter
    // bubbling up from a control inside.
    if (event.key === 'Enter' && event.target === dialogRef.current) {
      const target = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }
  };

  // Syncs the `open` prop to dialog state. `closingRef` blocks a re-open after closing until the
  // parent sets `open` to false.
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
      // Only the topmost modal takes initial focus, so an inert stacked one does not pull it away.
      !isTopmost ||
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
  }, [getInitialFocusElement, isOpen, isTopmost, open, resolvedInitialFocusStrategy]);

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
              {...dialogRootPropsRest}
              aria-describedby={resolvedModalAriaProps['aria-describedby']}
              aria-label={resolvedModalAriaProps['aria-label']}
              aria-labelledby={resolvedModalAriaProps['aria-labelledby']}
              aria-modal={isTopmost ? 'true' : undefined}
              className={clsx('str-chat__modal__dialog', dialogRootClassName)}
              inert={isTopmost ? undefined : true}
              onKeyDown={handleDialogKeyDown}
              ref={dialogRef}
              role={role}
              tabIndex={isTopmost ? 0 : -1}
            >
              <DialogManagerProvider
                id={`${resolvedDialogId}-floating-dialog-manager`}
                portalDestinationProps={{
                  captureOutsideClicks: true,
                  className: 'str-chat__modal__floating-dialog-overlay',
                }}
              >
                {children}
                {/* The live-region outlet sits inside the active modal subtree (only the topmost
                  carries `aria-modal`) so assistive technologies do not suppress announcements. */}
                {isTopmost && <AriaLiveOutlet layer={1} />}
              </DialogManagerProvider>
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
