import React, { useContext, useState } from 'react';

export type UserInfoItem = 'pinned' | 'photos' | 'files' | 'sharedGroups';

type ViewContextValue = {
  isChatInfoOpen: boolean;
  isListMentions: boolean;
  isSideDrawerOpen: boolean;
  isNewChat: boolean;
  setChatInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setListMentions: React.Dispatch<React.SetStateAction<boolean>>;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ViewContext = React.createContext({} as ViewContextValue);

export const ViewProvider: React.FC = ({ children }) => {
  const [isChatInfoOpen, setChatInfoOpen] = useState(false);
  const [isListMentions, setListMentions] = useState(false);
  const [isSideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [isNewChat, setNewChat] = useState(false);

  const contextValue: ViewContextValue = {
    isChatInfoOpen,
    isListMentions,
    isSideDrawerOpen,
    isNewChat,
    setChatInfoOpen,
    setListMentions,
    setNewChat,
    setSideDrawerOpen,
  };

  return <ViewContext.Provider value={contextValue}>{children}</ViewContext.Provider>;
};

export const useViewContext = () => useContext(ViewContext);
