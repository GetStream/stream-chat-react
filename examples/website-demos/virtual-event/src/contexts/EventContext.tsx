import React, { useContext, useState } from 'react';

import { ModeOptions, ThemeOptions, useTheme } from '../hooks/useTheme';

export type ChatType = 'global' | 'main-event' | 'room' | 'direct' | 'qa';
export type TabOptions = 'overview' | 'main-event' | 'rooms';
export type UserActions = 'block' | 'mute' | 'report' | 'unmute';

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
  setLabel: React.Dispatch<React.SetStateAction<string | undefined>>;
  setMode: React.Dispatch<React.SetStateAction<ModeOptions>>;
  setPresenters: React.Dispatch<React.SetStateAction<number | undefined>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<React.SetStateAction<TabOptions>>;
  setShowChannelList: React.Dispatch<React.SetStateAction<boolean>>;
  setTheme: React.Dispatch<React.SetStateAction<ThemeOptions>>;
  setTitle: React.Dispatch<React.SetStateAction<string | undefined>>;
  setUserActionType: React.Dispatch<React.SetStateAction<UserActions | undefined>>;
  setViewers: React.Dispatch<React.SetStateAction<number | undefined>>;
  showChannelList: boolean;
  eventName?: string;
  label?: string;
  presenters?: number;
  title?: string;
  userActionType?: UserActions;
  viewers?: number;
};

const EventContext = React.createContext({} as EventContextValue);

export const EventProvider: React.FC = ({ children }) => {
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [chatType, setChatType] = useState<ChatType>('global');
  const [eventName, setEventName] = useState<string | undefined>();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [label, setLabel] = useState<string | undefined>();
  const [presenters, setPresenters] = useState<number | undefined>();
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TabOptions>('overview');
  const [showChannelList, setShowChannelList] = useState(false);
  const [title, setTitle] = useState<string | undefined>();
  const [userActionType, setUserActionType] = useState<UserActions>();
  const [viewers, setViewers] = useState<number | undefined>();

  const { setMode, setTheme } = useTheme();

  const value: EventContextValue = {
    actionsModalOpen,
    chatType,
    eventName,
    label,
    isFullScreen,
    presenters,
    searching,
    selected,
    setActionsModalOpen,
    setChatType,
    setEventName,
    setIsFullScreen,
    setLabel,
    setMode,
    setSearching,
    setSelected,
    setTheme,
    showChannelList,
    setPresenters,
    setShowChannelList,
    setTitle,
    setUserActionType,
    setViewers,
    title,
    userActionType,
    viewers,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventContext = () => useContext(EventContext);
