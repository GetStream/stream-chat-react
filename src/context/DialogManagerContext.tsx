import React, { useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { DialogManager } from '../components/Dialog/DialogManager';
import { DialogPortalDestination } from '../components/Dialog/DialogPortal';

type DialogManagerProviderContextValue = {
  dialogManager: DialogManager;
};

const DialogManagerProviderContext = React.createContext<
  DialogManagerProviderContextValue | undefined
>(undefined);

export const DialogManagerProvider = ({
  children,
  id,
}: PropsWithChildren<{ id?: string }>) => {
  const [dialogManager] = useState<DialogManager>(() => new DialogManager({ id }));

  return (
    <DialogManagerProviderContext.Provider value={{ dialogManager }}>
      {children}
      <DialogPortalDestination />
    </DialogManagerProviderContext.Provider>
  );
};

export const useDialogManager = () => {
  const value = useContext(DialogManagerProviderContext);
  return value as DialogManagerProviderContextValue;
};
