import type { PropsWithChildren } from 'react';
import React, { useContext, useEffect, useMemo } from 'react';

import { DialogManager } from '../components/Dialog/DialogManager';
import { DialogPortalDestination } from '../components/Dialog/DialogPortal';
import type { PropsWithChildrenOnly } from '../types/types';

type DialogManagerId = string;

const dialogManagersStore: Record<DialogManagerId, DialogManager> = {};

const getDialogManager = (id: string): DialogManager | undefined =>
  dialogManagersStore[id];

const addDialogManager = (dialogManager: DialogManager) => {
  if (getDialogManager(dialogManager.id)) return;
  dialogManagersStore[dialogManager.id] = dialogManager;
};

const removeDialogManager = (id: string) => {
  if (!dialogManagersStore[id]) return;
  delete dialogManagersStore[id];
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

  useEffect(() => {
    addDialogManager(dialogManager);
    return () => {
      removeDialogManager(dialogManager.id);
    };
  }, [dialogManager]);

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

/**
 * Retrieves the nearest dialog manager or searches for the dialog manager by dialog manager id or dialog id.
 * Dialog id will take precedence over dialog manager id if both are provided and dialog manager is found by dialog id.
 */
export const useDialogManager = ({
  dialogId,
  dialogManagerId,
}: UseDialogManagerParams = {}) => {
  const nearestDialogManagerContext = useContext(DialogManagerProviderContext);

  const foundDialogManagerContext = useMemo(() => {
    const context: { dialogManager?: DialogManager } = { dialogManager: undefined };

    if (!dialogId && !dialogManagerId) return context;

    if (
      (dialogManagerId && !dialogId) ||
      (dialogManagerId && dialogId && dialogManagersStore[dialogManagerId].get(dialogId))
    ) {
      context.dialogManager = dialogManagersStore[dialogManagerId];
    }
    if (dialogId) {
      context.dialogManager = Object.values(dialogManagersStore).find(
        (dialogMng) => dialogId && dialogMng.get(dialogId),
      );
    }
    return context;
  }, [dialogId, dialogManagerId]);

  return (
    foundDialogManagerContext.dialogManager
      ? foundDialogManagerContext
      : nearestDialogManagerContext
  ) as DialogManagerProviderContextValue;
};

export const modalDialogManagerId = 'modal-dialog-manager' as const;

export const ModalDialogManagerProvider = ({ children }: PropsWithChildrenOnly) => (
  <DialogManagerProvider id={modalDialogManagerId}>{children}</DialogManagerProvider>
);

export const useModalDialogManager = () =>
  useMemo(() => getDialogManager(modalDialogManagerId), []);
