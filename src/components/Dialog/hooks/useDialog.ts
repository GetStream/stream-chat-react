import { useEffect, useState } from 'react';
import { useDialogsManager } from '../../../context/DialogsManagerContext';
import type { GetOrCreateParams } from '../DialogsManager';

export const useDialog = ({ id }: GetOrCreateParams) => {
  const { dialogsManager } = useDialogsManager();

  useEffect(
    () => () => {
      dialogsManager.remove(id);
    },
    [dialogsManager, id],
  );

  return dialogsManager.getOrCreate({ id });
};

export const useDialogIsOpen = (id: string, source?: string) => {
  const { dialogsManager } = useDialogsManager();
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribeOpen = dialogsManager.on('open', { id, listener: () => setOpen(true) });
    const unsubscribeClose = dialogsManager.on('close', { id, listener: () => setOpen(false) });
    return () => {
      unsubscribeOpen();
      unsubscribeClose();
    };
  }, [dialogsManager, id, source]);

  return open;
};
