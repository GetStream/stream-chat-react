import React, { useContext, useState } from 'react';

import { ModeOptions, ThemeOptions, useTheme } from '../hooks/useTheme';

export type ChatType = 'global' | 'main-event' | 'room' | 'direct' | 'qa';
type TabOptions = 'overview' | 'main-event' | 'rooms';

type EventContextValue = {
  chatType: ChatType;
  isFullScreen: boolean;
  searching: boolean;
  selected: TabOptions;
  setChatType: React.Dispatch<React.SetStateAction<ChatType>>;
  setEventName: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: React.Dispatch<React.SetStateAction<ModeOptions>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<React.SetStateAction<TabOptions>>;
  setShowChannelList: React.Dispatch<React.SetStateAction<boolean>>;
  setTheme: React.Dispatch<React.SetStateAction<ThemeOptions>>;
  showChannelList: boolean;
  eventName?: string;
};

const EventContext = React.createContext({} as EventContextValue);

export const EventProvider: React.FC = ({ children }) => {
  const [chatType, setChatType] = useState<ChatType>('global');
  const [eventName, setEventName] = useState<string | undefined>();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TabOptions>('overview');
  const [showChannelList, setShowChannelList] = useState(false);

  const { setMode, setTheme } = useTheme();

  const value: EventContextValue = {
    chatType,
    eventName,
    isFullScreen,
    searching,
    selected,
    setChatType,
    setEventName,
    setIsFullScreen,
    setMode,
    setSearching,
    setSelected,
    setTheme,
    showChannelList,
    setShowChannelList,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventContext = () => useContext(EventContext);
