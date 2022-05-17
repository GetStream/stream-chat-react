import React, { useContext, useState } from 'react';

import { ModeOptions, ThemeOptions, useTheme } from '../hooks/useTheme';

export type ChatType = 'global' | 'main-event' | 'room' | 'direct' | 'qa';
export type TabOptions = 'overview' | 'main-event' | 'rooms';
export type UserActions = 'flag' | 'mute' | 'unmute';

type EventContextValue = {
  actionsModalOpen: boolean;
  chatType: ChatType;
  isFullScreen: boolean;
  searching: boolean;
  selected: TabOptions;
  setChatType: React.Dispatch<React.SetStateAction<ChatType>>;
  setActionsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEventName: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: React.Dispatch<React.SetStateAction<ModeOptions>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<React.SetStateAction<TabOptions>>;
  setShowChannelList: React.Dispatch<React.SetStateAction<boolean>>;
  setTheme: React.Dispatch<React.SetStateAction<ThemeOptions>>;
  setThemeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUserActionType: React.Dispatch<React.SetStateAction<UserActions | undefined>>;
  setVideoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showChannelList: boolean;
  themeModalOpen: boolean;
  videoOpen: boolean;
  eventName?: string;
  userActionType?: UserActions;
};

const EventContext = React.createContext({} as EventContextValue);

export const EventProvider = ({ children }: {children?: React.ReactNode}) => {
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [chatType, setChatType] = useState<ChatType>('global');
  const [eventName, setEventName] = useState<string | undefined>();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TabOptions>('overview');
  const [showChannelList, setShowChannelList] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [userActionType, setUserActionType] = useState<UserActions>();
  const [videoOpen, setVideoOpen] = useState(false);

  const { setMode, setTheme } = useTheme();

  const value: EventContextValue = {
    actionsModalOpen,
    chatType,
    eventName,
    isFullScreen,
    searching,
    selected,
    setActionsModalOpen,
    setChatType,
    setEventName,
    setIsFullScreen,
    setMode,
    setSearching,
    setSelected,
    setTheme,
    showChannelList,
    setShowChannelList,
    setThemeModalOpen,
    setUserActionType,
    setVideoOpen,
    themeModalOpen,
    userActionType,
    videoOpen,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventContext = () => useContext(EventContext);
