import React, { useContext, useState } from 'react';
import { PropsWithChildrenOnly } from '../types/types';
import { DialogsManager } from '../components/Dialog/DialogsManager';
import { DialogPortalDestination } from '../components/Dialog/DialogPortal';

type DialogsManagerProviderContextValue = {
  dialogsManager: DialogsManager;
};

const DialogsManagerProviderContext = React.createContext<
  DialogsManagerProviderContextValue | undefined
>(undefined);

export const DialogsManagerProvider = ({ children }: PropsWithChildrenOnly) => {
  const [dialogsManager] = useState<DialogsManager>(() => new DialogsManager());

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
