import React, { PropsWithChildren, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogIsOpen, useOpenedDialogCount } from './hooks';
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
    ></div>
  );
};

type DialogPortalEntryProps = {
  dialogId: string;
};

export const DialogPortalEntry = ({
  children,
  dialogId,
}: PropsWithChildren<DialogPortalEntryProps>) => {
  const { dialogManager } = useDialogManager();
  const dialogIsOpen = useDialogIsOpen(dialogId);
  const [portalDestination, setPortalDestination] = useState<Element | null>(null);
  useLayoutEffect(() => {
    const destination = document.querySelector(
      `div[data-str-chat__portal-id="${dialogManager.id}"]`,
    );
    if (!destination) return;
    setPortalDestination(destination);
  }, [dialogManager, dialogIsOpen]);

  if (!portalDestination) return null;

  return createPortal(children, portalDestination);
};
