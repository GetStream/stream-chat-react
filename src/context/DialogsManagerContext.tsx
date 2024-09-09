import React, { PropsWithChildren, useContext, useState } from 'react';
import { DialogsManager } from '../components/Dialog/DialogsManager';
import { DialogPortalDestination } from '../components/Dialog/DialogPortal';

type DialogsManagerProviderContextValue = {
  dialogsManager: DialogsManager;
};

const DialogsManagerProviderContext = React.createContext<
  DialogsManagerProviderContextValue | undefined
>(undefined);

export const DialogsManagerProvider = ({ children, id }: PropsWithChildren<{ id?: string }>) => {
  const [dialogsManager] = useState<DialogsManager>(() => new DialogsManager({ id }));

  return (
    <DialogsManagerProviderContext.Provider value={{ dialogsManager }}>
      {children}
      <DialogPortalDestination />
    </DialogsManagerProviderContext.Provider>
  );
};

export const useDialogsManager = () => {
  const value = useContext(DialogsManagerProviderContext);
  return value as DialogsManagerProviderContextValue;
};
