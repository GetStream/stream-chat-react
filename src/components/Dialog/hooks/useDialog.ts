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

  useEffect(
    () =>
      dialogsManager.state.subscribeWithSelector<boolean[]>(
        ({ dialogs }) => [!!dialogs[id]?.isOpen],
        ([isOpen]) => {
          setOpen(isOpen);
        },
        // id,
      ),
    [dialogsManager, id, source],
  );

  return open;
};
