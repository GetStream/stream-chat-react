import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useDialogIsOpen, useOpenedDialogCount } from '../hooks';
import { Portal } from '../../Portal/Portal';
import { useDialogManager, useNearestDialogManagerContext } from '../../../context';

const shouldCloseOnOutsideClick = ({
  dialog,
  managerCloseOnClickOutside,
}: {
  dialog: { closeOnClickOutside?: boolean };
  managerCloseOnClickOutside: boolean;
}) => dialog.closeOnClickOutside ?? managerCloseOnClickOutside;

export const DialogPortalDestination = () => {
  const { dialogManager } = useNearestDialogManagerContext() ?? {};
  const openedDialogCount = useOpenedDialogCount({ dialogManagerId: dialogManager?.id });
  const [destinationRoot, setDestinationRoot] = useState<HTMLDivElement | null>(null);

  // Handle clicks outside the overlay-covered area.
  // Dismiss policy is manager-level (`dialogManager.closeOnClickOutside`).
  useEffect(() => {
    if (!destinationRoot || !dialogManager) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (destinationRoot.contains(event.target as Node)) return;
      // Defer so target onClick handlers (e.g. context-menu toggle buttons) can run first.
      setTimeout(() => {
        Object.values(dialogManager.state.getLatestValue().dialogsById).forEach(
          (dialog) => {
            if (!dialog.isOpen) return;
            if (
              !shouldCloseOnOutsideClick({
                dialog,
                managerCloseOnClickOutside: dialogManager.closeOnClickOutside,
              })
            )
              return;
            dialogManager.close(dialog.id);
          },
        );
      }, 0);
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, [destinationRoot, dialogManager]);

  if (!openedDialogCount) return null;

  return (
    <div
      className='str-chat__dialog-overlay'
      data-str-chat__portal-id={dialogManager?.id}
      data-testid='str-chat__dialog-overlay'
      onClick={(event) => {
        if (!dialogManager) return;
        if (event.target !== event.currentTarget) return;
        Object.values(dialogManager.state.getLatestValue().dialogsById).forEach(
          (dialog) => {
            if (!dialog.isOpen) return;
            if (
              !shouldCloseOnOutsideClick({
                dialog,
                managerCloseOnClickOutside: dialogManager.closeOnClickOutside,
              })
            )
              return;
            dialogManager.close(dialog.id);
          },
        );
      }}
      ref={setDestinationRoot}
      style={
        {
          '--str-chat__dialog-overlay-height': openedDialogCount > 0 ? '100%' : '0',
        } as React.CSSProperties
      }
    />
  );
};

type DialogPortalEntryProps = {
  dialogId: string;
  dialogManagerId?: string;
};

export const DialogPortalEntry = ({
  children,
  dialogId,
  dialogManagerId,
}: PropsWithChildren<DialogPortalEntryProps>) => {
  const { dialogManager } = useDialogManager({ dialogId, dialogManagerId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManagerId);

  const getPortalDestination = useCallback(
    () => document.querySelector(`div[data-str-chat__portal-id="${dialogManager.id}"]`),
    [dialogManager.id],
  );

  return (
    <Portal getPortalDestination={getPortalDestination} isOpen={dialogIsOpen}>
      {children}
    </Portal>
  );
};
