import React, { useContext, useState } from 'react';

type UnreadContextValue = {
  chatsUnreadCount: number;
  mentionsUnreadCount: number;
  setChatsUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setMentionsUnreadCount: React.Dispatch<React.SetStateAction<number>>;
};

const UnreadContext = React.createContext({} as UnreadContextValue);

export const UnreadProvider: React.FC = ({ children }) => {
  const [chatsUnreadCount, setChatsUnreadCount] = useState(0);
  const [mentionsUnreadCount, setMentionsUnreadCount] = useState(0);

  const contextValue: UnreadContextValue = {
    chatsUnreadCount,
    mentionsUnreadCount,
    setChatsUnreadCount,
    setMentionsUnreadCount,
  };

  return <UnreadContext.Provider value={contextValue}>{children}</UnreadContext.Provider>;
};

export const useUnreadContext = () => useContext(UnreadContext);
