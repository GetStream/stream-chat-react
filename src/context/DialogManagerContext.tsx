import React, {
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StateStore } from '@stream-io/state-store';

import { DialogManager } from '../components/Dialog/service/DialogManager';
import {
  DialogPortalDestination,
  type DialogPortalDestinationProps,
} from '../components/Dialog/service/DialogPortal';
import type { PropsWithChildrenOnly } from '../types/types';

type DialogManagerId = string;

type DialogManagersState = Record<DialogManagerId, DialogManager | undefined>;
const dialogManagersRegistry: StateStore<DialogManagersState> = new StateStore({});

const getDialogManager = (id: string): DialogManager | undefined =>
  dialogManagersRegistry.getLatestValue()[id];

const getOrCreateDialogManager = ({
  closeOnClickOutside,
  id,
}: {
  closeOnClickOutside?: boolean;
  id: string;
}) => {
  let manager = getDialogManager(id);
  if (!manager) {
    manager = new DialogManager({ closeOnClickOutside, id });
    dialogManagersRegistry.partialNext({ [id]: manager });
  } else if (typeof closeOnClickOutside === 'boolean') {
    manager.closeOnClickOutside = closeOnClickOutside;
  }
  return manager;
};

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
   * Closes open dialogs on a click on the overlay or outside it, unless a dialog sets its own.
   * Defaults to `true`.
   */
  closeOnClickOutside?: boolean;
  portalDestinationProps?: DialogPortalDestinationProps;
  id?: string;
}>;

/**
 * Provides a dialog manager and its portal destination. With `id` the manager is registered under
 * it until unmount, otherwise it is local to the provider.
 */
export const DialogManagerProvider = ({
  children,
  closeOnClickOutside,
  id,
  portalDestinationProps,
}: DialogManagerProviderProps) => {
  const [dialogManager, setDialogManager] = useState<DialogManager | null>(() => {
    if (id) return getDialogManager(id) ?? null;
    return new DialogManager({ closeOnClickOutside }); // will not be included in the registry
  });

  useEffect(() => {
    if (!id) return;
    setDialogManager(getOrCreateDialogManager({ closeOnClickOutside, id }));
    return () => {
      removeDialogManager(id);
      setDialogManager(null);
    };
  }, [closeOnClickOutside, id]);

  // Renders nothing while the manager registered under `id` is being (re)created.
  if (!dialogManager) return null;

  return (
    <DialogManagerProviderContext.Provider value={{ dialogManager }}>
      {children}
      <DialogPortalDestination {...portalDestinationProps} />
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
 * Resolves a registered dialog manager by `dialogManagerId` (which must hold `dialogId` when both
 * are given) or by `dialogId` alone. Falls back to the nearest `DialogManagerProvider`'s manager
 * and throws when none resolves.
 *
 * @param params.dialogId - ID of a dialog the manager holds.
 * @param params.dialogManagerId - ID of a registered dialog manager.
 * @returns The context value holding the resolved `dialogManager`.
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
            if (prevState?.dialogManager.id === managerInNewState?.id) return prevState;
            // an unresolved manager is caught by the guard below
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
    throw new Error(
      `useDialogManager could not resolve a dialog manager (manager id: ${dialogManagerId}, dialog id: ${dialogId}). Make sure the caller is rendered within <DialogManagerProvider>.`,
    );
  }

  return dialogManagerContext;
};

export const modalDialogManagerId = 'modal-dialog-manager' as const;

export const ModalDialogManagerProvider = ({ children }: PropsWithChildrenOnly) => (
  <DialogManagerProvider id={modalDialogManagerId}>{children}</DialogManagerProvider>
);

export const useModalDialogManager = () =>
  useMemo(() => getDialogManager(modalDialogManagerId), []);

export const useNearestDialogManagerContext = () =>
  useContext(DialogManagerProviderContext);
