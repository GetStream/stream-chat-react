import React, {
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StateStore } from 'stream-chat';

import { DialogManager } from '../components/Dialog/DialogManager';
import { DialogPortalDestination } from '../components/Dialog/DialogPortal';
import type { PropsWithChildrenOnly } from '../types/types';

type DialogManagerId = string;

type DialogManagersState = Record<DialogManagerId, DialogManager | undefined>;
const dialogManagersStore: StateStore<DialogManagersState> = new StateStore({});

const getDialogManager = (id: string): DialogManager | undefined =>
  dialogManagersStore.getLatestValue()[id];

const addDialogManager = (dialogManager: DialogManager) => {
  if (getDialogManager(dialogManager.id)) return;
  dialogManagersStore.partialNext({ [dialogManager.id]: dialogManager });
};

const removeDialogManager = (id: string) => {
  if (!getDialogManager(id)) return;
  dialogManagersStore.partialNext({ [id]: undefined });
};

type DialogManagerProviderContextValue = {
  dialogManager: DialogManager;
};

const DialogManagerProviderContext = React.createContext<
  DialogManagerProviderContextValue | undefined
>(undefined);

/**
 * Marks the portal location
 * @param children
 * @param id
 * @constructor
 */
export const DialogManagerProvider = ({
  children,
  id,
}: PropsWithChildren<{ id?: string }>) => {
  const dialogManager = useMemo<DialogManager>(
    () => (id && getDialogManager(id)) || new DialogManager({ id }),
    [id],
  );

  addDialogManager(dialogManager);
  useEffect(
    () => () => {
      removeDialogManager(dialogManager.id);
    },
    [dialogManager],
  );

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
      newState: dialogManagersStore.getLatestValue(),
      previousState: undefined,
    });
    return managerInNewState
      ? { dialogManager: managerInNewState }
      : nearestDialogManagerContext;
  });

  useEffect(() => {
    if (!dialogId && !dialogManagerId) return;
    const unsubscribe = dialogManagersStore.subscribeWithSelector(
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
