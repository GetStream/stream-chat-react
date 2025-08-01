import type { PropsWithChildren } from 'react';
import React, { useCallback } from 'react';
import { useDialogIsOpen, useOpenedDialogCount } from './hooks';
import { Portal } from '../Portal/Portal';
import { useDialogManager } from '../../context';

export const DialogPortalDestination = () => {
  const { dialogManager } = useDialogManager();
  const openedDialogCount = useOpenedDialogCount();

  return (
    <div
      className='str-chat__dialog-overlay'
      data-str-chat__portal-id={dialogManager.id}
      data-testid='str-chat__dialog-overlay'
      onClick={() => dialogManager.closeAll()}
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
};

export const DialogPortalEntry = ({
  children,
  dialogId,
}: PropsWithChildren<DialogPortalEntryProps>) => {
  const { dialogManager } = useDialogManager({ dialogId });
  const dialogIsOpen = useDialogIsOpen(dialogId, dialogManager.id);

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
