import React, { useContext, useState } from 'react';

type ViewContextValue = {
  isListMentions: boolean;
  isSideDrawerOpen: boolean;
  isNewChat: boolean;
  setListMentions: React.Dispatch<React.SetStateAction<boolean>>;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ViewContext = React.createContext({} as ViewContextValue);

export const ViewProvider: React.FC = ({ children }) => {
  const [isListMentions, setListMentions] = useState(false);
  const [isSideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [isNewChat, setNewChat] = useState(false);

  const contextValue: ViewContextValue = {
    isListMentions,
    isSideDrawerOpen,
    isNewChat,
    setListMentions,
    setNewChat,
    setSideDrawerOpen
  };

  return <ViewContext.Provider value={contextValue}>{children}</ViewContext.Provider>;
};

export const useViewContext = () => useContext(ViewContext);