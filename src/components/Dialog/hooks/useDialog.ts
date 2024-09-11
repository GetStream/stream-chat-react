import { useEffect, useState } from 'react';
import { useDialogManager } from '../../../context/DialogManagerContext';
import type { GetOrCreateParams } from '../DialogManager';

export const useDialog = ({ id }: GetOrCreateParams) => {
  const { dialogManager } = useDialogManager();

  useEffect(
    () => () => {
      dialogManager.remove(id);
    },
    [dialogManager, id],
  );

  return dialogManager.getOrCreate({ id });
};

export const useDialogIsOpen = (id: string, source?: string) => {
  const { dialogManager } = useDialogManager();
  const [open, setOpen] = useState<boolean>(false);

  useEffect(
    () =>
      dialogManager.state.subscribeWithSelector<boolean[]>(
        ({ dialogs }) => [!!dialogs[id]?.isOpen],
        ([isOpen]) => {
          setOpen(isOpen);
        },
        // id,
      ),
    [dialogManager, id, source],
  );

  return open;
};
