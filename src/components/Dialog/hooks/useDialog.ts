import { useCallback, useEffect } from 'react';
import { modalDialogManagerId, useDialogManager } from '../../../context';
import { useStateStore } from '../../../store';

import type { DialogManagerState, GetOrCreateDialogParams } from '../DialogManager';

export type UseDialogParams = GetOrCreateDialogParams & {
  dialogManagerId?: string;
};

export const useDialog = ({ dialogManagerId, id }: UseDialogParams) => {
  const { dialogManager } = useDialogManager({ dialogManagerId });

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

export const modalDialogId = 'modal-dialog' as const;

export const useModalDialog = () =>
  useDialog({ dialogManagerId: modalDialogManagerId, id: modalDialogId });

export const useDialogIsOpen = (id: string, dialogManagerId?: string) => {
  const { dialogManager } = useDialogManager({ dialogManagerId });
  const dialogIsOpenSelector = useCallback(
    ({ dialogsById }: DialogManagerState) => ({ isOpen: !!dialogsById[id]?.isOpen }),
    [id],
  );
  return useStateStore(dialogManager.state, dialogIsOpenSelector).isOpen;
};

export const useModalDialogIsOpen = () =>
  useDialogIsOpen(modalDialogId, modalDialogManagerId);

const openedDialogCountSelector = (nextValue: DialogManagerState) => ({
  openedDialogCount: Object.values(nextValue.dialogsById).reduce((count, dialog) => {
    if (dialog.isOpen) return count + 1;
    return count;
  }, 0),
});

export const useOpenedDialogCount = ({
  dialogManagerId,
}: { dialogManagerId?: string } = {}) => {
  const { dialogManager } = useDialogManager({ dialogManagerId });
  return useStateStore(dialogManager.state, openedDialogCountSelector).openedDialogCount;
};
