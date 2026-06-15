import { useCallback, useEffect } from 'react';
import {
  modalDialogManagerId,
  useDialogManager,
  useNearestDialogManagerContext,
} from '../../../context';
import { useStateStore } from '../../../store';

import type {
  DialogManagerState,
  GetOrCreateDialogParams,
} from '../service/DialogManager';

export type UseDialogParams = GetOrCreateDialogParams & {
  dialogManagerId?: string;
};

export const useDialog = ({
  closeOnClickOutside,
  dialogManagerId,
  id,
}: UseDialogParams) => {
  const { dialogManager } = useDialogManager({ dialogManagerId });

  useEffect(() => {
    dialogManager.cancelPendingRemoval(id);

    return () => {
      // Since this cleanup can run even if the component is still mounted
      // and dialog id is unchanged (e.g. in <StrictMode />), it's safer to
      // mark state as unused and only remove it after a timeout, rather than
      // to remove it immediately.
      dialogManager.markForRemoval(id);
    };
  }, [dialogManager, id]);

  return dialogManager.getOrCreate({ closeOnClickOutside, id });
};

export const useDialogOnNearestManager = ({ id }: Pick<UseDialogParams, 'id'>) => {
  const { dialogManager } = useNearestDialogManagerContext() ?? {};
  const dialog = useDialog({ dialogManagerId: dialogManager?.id, id });

  return {
    dialog,
    dialogManager,
  };
};

export const modalDialogId = 'modal-dialog' as const;

export const useModalDialog = (id: string = modalDialogId) =>
  useDialog({ dialogManagerId: modalDialogManagerId, id });

export const useDialogIsOpen = (id: string, dialogManagerId?: string) => {
  const { dialogManager } = useDialogManager({ dialogManagerId });
  const dialogIsOpenSelector = useCallback(
    ({ dialogsById }: DialogManagerState) => ({ isOpen: !!dialogsById[id]?.isOpen }),
    [id],
  );
  return useStateStore(dialogManager.state, dialogIsOpenSelector).isOpen;
};

export const useModalDialogIsOpen = (id: string = modalDialogId) =>
  useDialogIsOpen(id, modalDialogManagerId);

export const useDialogIsTopmost = (id: string, dialogManagerId?: string) => {
  const { dialogManager } = useDialogManager({ dialogManagerId });
  const dialogIsTopmostSelector = useCallback(
    ({ openedDialogIds }: DialogManagerState) => ({
      isTopmost: openedDialogIds[openedDialogIds.length - 1] === id,
    }),
    [id],
  );
  return useStateStore(dialogManager.state, dialogIsTopmostSelector).isTopmost;
};

export const useModalDialogIsTopmost = (id: string = modalDialogId) =>
  useDialogIsTopmost(id, modalDialogManagerId);

const openedDialogCountSelector = (nextValue: DialogManagerState) => ({
  openedDialogCount: nextValue.openedDialogIds.length,
});

export const useOpenedDialogCount = ({
  dialogManagerId,
}: { dialogManagerId?: string } = {}) => {
  const { dialogManager } = useDialogManager({ dialogManagerId });
  return useStateStore(dialogManager.state, openedDialogCountSelector).openedDialogCount;
};
