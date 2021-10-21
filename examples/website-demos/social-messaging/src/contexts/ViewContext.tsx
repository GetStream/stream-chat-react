import React, { useContext, useState } from 'react';

export type UserActions =
  | 'copy'
  | 'delete'
  | 'flag'
  | 'mute'
  | 'pin'
  | 'reply'
  | 'unmute'
  | 'unpin';

type ViewContextValue = {
  actionsModalOpenId: string;
  chatsUnreadCount: number;
  isListMentions: boolean;
  isSideDrawerOpen: boolean;
  isNewChat: boolean;
  mentionsUnreadCount: number;
  reactionsOpenId: string;
  setActionsModalOpenId: React.Dispatch<React.SetStateAction<string>>;
  setChatsUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setListMentions: React.Dispatch<React.SetStateAction<boolean>>;
  setMentionsUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  setReactionsOpenId: React.Dispatch<React.SetStateAction<string>>;
  setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSnackbar: React.Dispatch<React.SetStateAction<boolean>>;
  setUserActionType: React.Dispatch<React.SetStateAction<UserActions | undefined>>;
  snackbar: boolean;
  userActionType?: UserActions;
};

const ViewContext = React.createContext({} as ViewContextValue);

export const ViewProvider: React.FC = ({ children }) => {
  const [actionsModalOpenId, setActionsModalOpenId] = useState('');
  const [chatsUnreadCount, setChatsUnreadCount] = useState(0);
  const [isListMentions, setListMentions] = useState(false);
  const [isSideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [isNewChat, setNewChat] = useState(false);
  const [mentionsUnreadCount, setMentionsUnreadCount] = useState(0);
  const [reactionsOpenId, setReactionsOpenId] = useState('');
  const [snackbar, setSnackbar] = useState(false);
  const [userActionType, setUserActionType] = useState<UserActions>();

  const contextValue: ViewContextValue = {
    actionsModalOpenId,
    chatsUnreadCount,
    isListMentions,
    isSideDrawerOpen,
    isNewChat,
    mentionsUnreadCount,
    reactionsOpenId,
    setActionsModalOpenId,
    setChatsUnreadCount,
    setListMentions,
    setMentionsUnreadCount,
    setNewChat,
    setReactionsOpenId,
    setSideDrawerOpen,
    setSnackbar,
    setUserActionType,
    snackbar,
    userActionType,
  };

  return <ViewContext.Provider value={contextValue}>{children}</ViewContext.Provider>;
};

export const useViewContext = () => useContext(ViewContext);
