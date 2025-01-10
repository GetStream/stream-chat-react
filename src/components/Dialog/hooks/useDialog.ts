import { useCallback, useEffect } from 'react';
import { useDialogManager } from '../../../context';
import { useStateStore } from '../../../store';

import type { DialogManagerState, GetOrCreateDialogParams } from '../DialogManager';

export const useDialog = ({ id }: GetOrCreateDialogParams) => {
  const { dialogManager } = useDialogManager();

  useEffect(
    () => () => {
      // Since this cleanup can run even if the component is still mounted
      // and dialog id is unchanged (e.g. in <StrictMode />), it's safer to
      // mark state as unused and only remove it after a timeout, rather than
      // to remove it immediately.
      dialogManager.markForRemoval(id);
    },
    [dialogManager, id],
  );

  return dialogManager.getOrCreate({ id });
};

export const useDialogIsOpen = (id: string) => {
  const { dialogManager } = useDialogManager();
  const dialogIsOpenSelector = useCallback(
    ({ dialogsById }: DialogManagerState) => ({ isOpen: !!dialogsById[id]?.isOpen }),
    [id],
  );
  return useStateStore(dialogManager.state, dialogIsOpenSelector).isOpen;
};

const openedDialogCountSelector = (nextValue: DialogManagerState) => ({
  openedDialogCount: Object.values(nextValue.dialogsById).reduce((count, dialog) => {
    if (dialog.isOpen) return count + 1;
    return count;
  }, 0),
});

export const useOpenedDialogCount = () => {
  const { dialogManager } = useDialogManager();
  return useStateStore(dialogManager.state, openedDialogCountSelector).openedDialogCount;
};
