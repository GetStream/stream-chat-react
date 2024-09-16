import { useCallback, useEffect } from 'react';
import { useDialogManager } from '../../../context';
import { useStateStore } from '../../../store';

import type { DialogManagerState, GetOrCreateDialogParams } from '../DialogManager';

export const useDialog = ({ id }: GetOrCreateDialogParams) => {
  const { dialogManager } = useDialogManager();

  useEffect(
    () => () => {
      dialogManager.remove(id);
    },
    [dialogManager, id],
  );

  return dialogManager.getOrCreate({ id });
};

export const useDialogIsOpen = (id: string) => {
  const { dialogManager } = useDialogManager();
  const dialogIsOpenSelector = useCallback(
    ({ dialogsById }: DialogManagerState) => [!!dialogsById[id]?.isOpen] as const,
    [id],
  );
  return useStateStore(dialogManager.state, dialogIsOpenSelector)[0];
};

const openedDialogCountSelector = (nextValue: DialogManagerState) =>
  [
    Object.values(nextValue.dialogsById).reduce((count, dialog) => {
      if (dialog.isOpen) return count + 1;
      return count;
    }, 0),
  ] as const;

export const useOpenedDialogCount = () => {
  const { dialogManager } = useDialogManager();
  return useStateStore(dialogManager.state, openedDialogCountSelector)[0];
};
