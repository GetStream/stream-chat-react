import React, { useContext, useState } from 'react';

export type UserActions = 'reply' | 'flag' | 'mute' | 'unmute';

type ViewContextValue = {
  chatsUnreadCount: number;
  isListMentions: boolean;
  isSideDrawerOpen: boolean;
  isNewChat: boolean;
  mentionsUnreadCount: number;
  messageActionsOpen: boolean;
  reactionsOpenId: string;
  setChatsUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setListMentions: React.Dispatch<React.SetStateAction<boolean>>;
  setMentionsUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setMessageActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  setReactionsOpenId: React.Dispatch<React.SetStateAction<string>>;
  setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUserActionType: React.Dispatch<React.SetStateAction<UserActions | undefined>>;
  userActionType?: UserActions;
};

const ViewContext = React.createContext({} as ViewContextValue);

export const ViewProvider: React.FC = ({ children }) => {
  const [chatsUnreadCount, setChatsUnreadCount] = useState(0);
  const [isListMentions, setListMentions] = useState(false);
  const [isSideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [isNewChat, setNewChat] = useState(false);
  const [mentionsUnreadCount, setMentionsUnreadCount] = useState(0);
  const [messageActionsOpen, setMessageActionsOpen] = useState(false);
  const [reactionsOpenId, setReactionsOpenId] = useState('');
  const [userActionType, setUserActionType] = useState<UserActions>();

  const contextValue: ViewContextValue = {
    chatsUnreadCount,
    isListMentions,
    isSideDrawerOpen,
    isNewChat,
    mentionsUnreadCount,
    messageActionsOpen,
    reactionsOpenId,
    setChatsUnreadCount,
    setListMentions,
    setMentionsUnreadCount,
    setMessageActionsOpen,
    setNewChat,
    setReactionsOpenId,
    setSideDrawerOpen,
    setUserActionType,
    userActionType,
  };

  return <ViewContext.Provider value={contextValue}>{children}</ViewContext.Provider>;
};

export const useViewContext = () => useContext(ViewContext);
