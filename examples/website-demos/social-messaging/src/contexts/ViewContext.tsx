import React, { useContext, useState } from 'react';

export type ChatInfoItem = 'Pinned Messages' | 'Photos & Videos' | 'Files' | 'Shared Groups';

type ViewContextValue = {
  chatInfoItem?: ChatInfoItem;
  isChatInfoOpen: boolean;
  isListMentions: boolean;
  isSideDrawerOpen: boolean;
  isNewChat: boolean;
  setChatInfoItem: React.Dispatch<React.SetStateAction<ChatInfoItem | undefined>>;
  setChatInfoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setListMentions: React.Dispatch<React.SetStateAction<boolean>>;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ViewContext = React.createContext({} as ViewContextValue);

export const ViewProvider: React.FC = ({ children }) => {
  const [chatInfoItem, setChatInfoItem] = useState<ChatInfoItem>();
  const [isChatInfoOpen, setChatInfoOpen] = useState(false);
  const [isListMentions, setListMentions] = useState(false);
  const [isSideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [isNewChat, setNewChat] = useState(false);

  const contextValue: ViewContextValue = {
    chatInfoItem,
    isChatInfoOpen,
    isListMentions,
    isSideDrawerOpen,
    isNewChat,
    setChatInfoItem,
    setChatInfoOpen,
    setListMentions,
    setNewChat,
    setSideDrawerOpen,
  };

  return <ViewContext.Provider value={contextValue}>{children}</ViewContext.Provider>;
};

export const useViewContext = () => useContext(ViewContext);
