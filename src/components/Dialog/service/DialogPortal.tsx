import type { PropsWithChildren } from 'react';
import React, { useCallback } from 'react';
import { useDialogIsOpen, useOpenedDialogCount } from '../hooks';
import { Portal } from '../../Portal/Portal';
import { useDialogManager, useNearestDialogManagerContext } from '../../../context';

export const DialogPortalDestination = () => {
  const { dialogManager } = useNearestDialogManagerContext() ?? {};
  const openedDialogCount = useOpenedDialogCount({ dialogManagerId: dialogManager?.id });
  // const [destinationRoot, setDestinationRoot] = useState<HTMLDivElement | null>(null);

  // todo: allow to configure and then enable
  // useEffect(() => {
  //   if (!destinationRoot) return;
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (!destinationRoot?.contains(event.target as Node)) {
  //       dialogManager?.closeAll();
  //     }
  //   };
  //   document.addEventListener('click', handleClickOutside, { capture: true });
  //   return () => {
  //     document.removeEventListener('click', handleClickOutside, { capture: true });
  //   };
  // }, [destinationRoot, dialogManager]);

  if (!openedDialogCount) return null;

  return (
    <div
      className='str-chat__dialog-overlay'
      data-str-chat__portal-id={dialogManager?.id}
      data-testid='str-chat__dialog-overlay'
      onClick={() => dialogManager?.closeAll()}
      // ref={setDestinationRoot}
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
