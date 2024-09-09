import React, { PropsWithChildren, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DialogsManager } from './DialogsManager';
import { useDialogIsOpen } from './hooks';
import { useDialogsManager } from '../../context';

export const DialogPortalDestination = () => {
  const { dialogsManager } = useDialogsManager();
  const [shouldRender, setShouldRender] = useState(!!dialogsManager.openDialogCount);
  useEffect(
    () =>
      dialogsManager.on('openCountChange', {
        listener: (dm: DialogsManager) => {
          setShouldRender(dm.openDialogCount > 0);
        },
      }),
    [dialogsManager],
  );

  return (
    <div
      className='str-chat__dialog-overlay'
      data-str-chat__portal-id={dialogsManager.id}
      data-testid='str-chat__dialog-overlay'
      onClick={() => dialogsManager.closeAll()}
      style={
        {
          '--str-chat__dialog-overlay-height': shouldRender ? '100%' : '0',
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
  const { dialogsManager } = useDialogsManager();
  const dialogIsOpen = useDialogIsOpen(dialogId);
  const [portalDestination, setPortalDestination] = useState<Element | null>(null);
  useLayoutEffect(() => {
    const destination = document.querySelector(
      `div[data-str-chat__portal-id="${dialogsManager.id}"]`,
    );
    if (!destination) return;
    setPortalDestination(destination);
  }, [dialogsManager, dialogIsOpen]);

  if (!portalDestination) return null;

  return createPortal(children, portalDestination);
};
