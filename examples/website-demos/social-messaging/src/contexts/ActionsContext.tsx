import React, { useContext, useState } from 'react';

export type UserActions =
  | 'copy'
  | 'delete'
  | 'flag'
  | 'mute'
  | 'muteChannel'
  | 'pin'
  | 'reply'
  | 'unmute'
  | 'unmuteChannel'
  | 'unpin';

type ActionsContextValue = {
  actionsModalOpenId: string;
  reactionsOpenId: string;
  setActionsModalOpenId: React.Dispatch<React.SetStateAction<string>>;
  setReactionsOpenId: React.Dispatch<React.SetStateAction<string>>;
  setSnackbar: React.Dispatch<React.SetStateAction<boolean>>;
  setUserActionType: React.Dispatch<React.SetStateAction<UserActions | undefined>>;
  snackbar: boolean;
  userActionType?: UserActions;
};

const ActionsContext = React.createContext({} as ActionsContextValue);

export const ActionsProvider: React.FC = ({ children }) => {
  const [actionsModalOpenId, setActionsModalOpenId] = useState('');
  const [reactionsOpenId, setReactionsOpenId] = useState('');
  const [snackbar, setSnackbar] = useState(false);
  const [userActionType, setUserActionType] = useState<UserActions>();

  const contextValue: ActionsContextValue = {
    actionsModalOpenId,
    reactionsOpenId,
    setActionsModalOpenId,
    setReactionsOpenId,
    setSnackbar,
    setUserActionType,
    snackbar,
    userActionType,
  };

  return <ActionsContext.Provider value={contextValue}>{children}</ActionsContext.Provider>;
};

export const useActionsContext = () => useContext(ActionsContext);
