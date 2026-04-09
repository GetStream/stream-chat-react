import React, {
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StateStore } from 'stream-chat';

import { DialogManager } from '../components/Dialog/service/DialogManager';
import { DialogPortalDestination } from '../components/Dialog/service/DialogPortal';
import type { PropsWithChildrenOnly } from '../types/types';

type DialogManagerId = string;

type DialogManagersState = Record<DialogManagerId, DialogManager | undefined>;
const dialogManagersRegistry: StateStore<DialogManagersState> = new StateStore({});
const pendingDialogManagersById: Partial<Record<DialogManagerId, DialogManager>> = {};
const dialogManagerMountCountsById: Partial<Record<DialogManagerId, number>> = {};

const getDialogManager = (id: string): DialogManager | undefined =>
  dialogManagersRegistry.getLatestValue()[id];

const removeDialogManager = (id: string) => {
  if (!getDialogManager(id)) return;
  dialogManagersRegistry.partialNext({ [id]: undefined });
};

type DialogManagerProviderContextValue = {
  dialogManager: DialogManager;
};

const DialogManagerProviderContext = React.createContext<
  DialogManagerProviderContextValue | undefined
>(undefined);

type DialogManagerProviderProps = PropsWithChildren<{
  /**
   * Manager-level outside click policy.
   * When `true`, clicking overlay or outside overlay-covered area closes all dialogs
   * in this manager. When `false`, outside clicks do not dismiss dialogs.
   */
  closeOnClickOutside?: boolean;
  id?: string;
}>;

/**
 * Creates/provides a dialog manager and its portal destination.
 */
export const DialogManagerProvider = ({
  children,
  closeOnClickOutside,
  id,
}: DialogManagerProviderProps) => {
  const [dialogManager, setDialogManager] = useState<DialogManager>(() => {
    if (id) {
      const manager =
        getDialogManager(id) ??
        pendingDialogManagersById[id] ??
        new DialogManager({ closeOnClickOutside, id });

      pendingDialogManagersById[id] = manager;
      return manager;
    }
    return new DialogManager({ closeOnClickOutside }); // will not be included in the registry
  });

  useEffect(() => {
    if (!id) return;
    const manager =
      getDialogManager(id) ??
      pendingDialogManagersById[id] ??
      new DialogManager({ closeOnClickOutside, id });

    if (typeof closeOnClickOutside === 'boolean') {
      manager.closeOnClickOutside = closeOnClickOutside;
    }

    if (!getDialogManager(id)) {
      dialogManagersRegistry.partialNext({ [id]: manager });
    }
    delete pendingDialogManagersById[id];

    setDialogManager((prev) => (prev === manager ? prev : manager));
    dialogManagerMountCountsById[id] = (dialogManagerMountCountsById[id] ?? 0) + 1;

    return () => {
      const nextMountCount = (dialogManagerMountCountsById[id] ?? 1) - 1;
      if (nextMountCount > 0) {
        dialogManagerMountCountsById[id] = nextMountCount;
        return;
      }

      delete dialogManagerMountCountsById[id];
      removeDialogManager(id);
    };
  }, [closeOnClickOutside, id]);

  return (
    <DialogManagerProviderContext.Provider value={{ dialogManager }}>
      {children}
      <DialogPortalDestination />
    </DialogManagerProviderContext.Provider>
  );
};

export type UseDialogManagerParams = {
  dialogId?: string;
  dialogManagerId?: string;
};

const getManagerFromStore = ({
  dialogId,
  dialogManagerId,
  newState,
  previousState,
}: UseDialogManagerParams & {
  newState: DialogManagersState;
  previousState: DialogManagersState | undefined;
}) => {
  let managerInNewState: DialogManager | undefined;
  let managerInPrevState: DialogManager | undefined;
  if (dialogManagerId) {
    if (!dialogId) {
      managerInNewState = newState[dialogManagerId];
      managerInPrevState = previousState?.[dialogManagerId];
    } else {
      if (newState[dialogManagerId]?.get(dialogId)) {
        managerInNewState = newState[dialogManagerId];
      }
      if (previousState?.[dialogManagerId]?.get(dialogId)) {
        managerInPrevState = previousState[dialogManagerId];
      }
    }
  } else if (dialogId) {
    managerInNewState = Object.values(newState).find(
      (dialogMng) => dialogId && dialogMng?.get(dialogId),
    );
    managerInPrevState =
      previousState &&
      Object.values(previousState).find(
        (dialogMng) => dialogId && dialogMng?.get(dialogId),
      );
  }

  return { managerInNewState, managerInPrevState };
};

/**
 * Retrieves the nearest dialog manager or searches for the dialog manager by dialog manager id or dialog id.
 * Dialog id will take precedence over dialog manager id if both are provided and dialog manager is found by dialog id.
 */
export const useDialogManager = ({
  dialogId,
  dialogManagerId,
}: UseDialogManagerParams = {}) => {
  const nearestDialogManagerContext = useContext(DialogManagerProviderContext);

  const [dialogManagerContext, setDialogManagerContext] = useState<
    DialogManagerProviderContextValue | undefined
  >(() => {
    const { managerInNewState } = getManagerFromStore({
      dialogId,
      dialogManagerId,
      newState: dialogManagersRegistry.getLatestValue(),
      previousState: undefined,
    });
    return managerInNewState
      ? { dialogManager: managerInNewState }
      : nearestDialogManagerContext;
  });

  useEffect(() => {
    if (!dialogId && !dialogManagerId) return;
    const unsubscribe = dialogManagersRegistry.subscribeWithSelector(
      (state) => state,
      (newState, previousState) => {
        const { managerInNewState, managerInPrevState } = getManagerFromStore({
          dialogId,
          dialogManagerId,
          newState,
          previousState,
        });

        if (!managerInPrevState || managerInNewState?.id !== managerInPrevState.id) {
          setDialogManagerContext((prevState) => {
            if (prevState?.dialogManager === managerInNewState) return prevState;
            // fixme: need to handle the possibility that the dialogManager is undefined
            return {
              dialogManager:
                managerInNewState || nearestDialogManagerContext?.dialogManager,
            } as DialogManagerProviderContextValue;
          });
        }
      },
    );
    return () => {
      unsubscribe();
    };
  }, [dialogId, dialogManagerId, nearestDialogManagerContext?.dialogManager]);

  if (!dialogManagerContext?.dialogManager) {
    console.warn(
      `Dialog manager (manager id: ${dialogManagerId}, dialog id: ${dialogId}) is not available`,
    );
  }

  return dialogManagerContext as DialogManagerProviderContextValue;
};

export const modalDialogManagerId = 'modal-dialog-manager' as const;

export const ModalDialogManagerProvider = ({ children }: PropsWithChildrenOnly) => (
  <DialogManagerProvider id={modalDialogManagerId}>{children}</DialogManagerProvider>
);

export const useModalDialogManager = () =>
  useMemo(() => getDialogManager(modalDialogManagerId), []);

export const useNearestDialogManagerContext = () =>
  useContext(DialogManagerProviderContext);
