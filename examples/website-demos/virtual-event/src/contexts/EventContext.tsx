import React, { useContext, useState } from 'react';

import { ModeOptions, ThemeOptions, useTheme } from '../hooks/useTheme';

import type { Channel as StreamChannel } from 'stream-chat';

export type ChatType = 'global' | 'main-event' | 'room' | 'direct' | 'qa';
type TabOptions = 'overview' | 'main-event' | 'rooms';

type EventContextValue = {
  chatType: ChatType;
  dmChannel: StreamChannel | undefined;
  isFullScreen: boolean;
  selected: TabOptions;
  setChatType: React.Dispatch<React.SetStateAction<ChatType>>;
  setDmChannel: React.Dispatch<React.SetStateAction<StreamChannel | undefined>>;
  setEventName: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: React.Dispatch<React.SetStateAction<ModeOptions>>;
  setSelected: React.Dispatch<React.SetStateAction<TabOptions>>;
  setShowChannelList: React.Dispatch<React.SetStateAction<boolean>>;
  setTheme: React.Dispatch<React.SetStateAction<ThemeOptions>>;
  showChannelList: boolean;
  eventName?: string;
};

const EventContext = React.createContext({} as EventContextValue);

export const EventProvider: React.FC = ({ children }) => {
  const [chatType, setChatType] = useState<ChatType>('global');
  const [dmChannel, setDmChannel] = useState<StreamChannel>();
  const [eventName, setEventName] = useState<string | undefined>();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selected, setSelected] = useState<TabOptions>('overview');
  const [showChannelList, setShowChannelList] = useState(false);

  const { setMode, setTheme } = useTheme();

  const value: EventContextValue = {
    chatType,
    dmChannel,
    eventName,
    isFullScreen,
    selected,
    setChatType,
    setDmChannel,
    setEventName,
    setIsFullScreen,
    setMode,
    setSelected,
    setTheme,
    showChannelList,
    setShowChannelList,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventContext = () => useContext(EventContext);
