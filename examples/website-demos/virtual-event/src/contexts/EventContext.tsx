import React, { useContext, useState } from 'react';

import { ModeOptions, ThemeOptions, useTheme } from '../hooks/useTheme';

type TabOptions = 'overview' | 'main-event' | 'rooms';

type EventContextValue = {
  event: string;
  isFullScreen: boolean;
  selected: TabOptions;
  setEvent: React.Dispatch<React.SetStateAction<string>>;
  setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: React.Dispatch<React.SetStateAction<ModeOptions>>;
  setSelected: React.Dispatch<React.SetStateAction<TabOptions>>;
  setTheme: React.Dispatch<React.SetStateAction<ThemeOptions>>;
};

const EventContext = React.createContext({} as EventContextValue);

export const EventProvider: React.FC = ({ children }) => {
  const [event, setEvent] = useState('global');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selected, setSelected] = useState<TabOptions>('overview');

  const { setMode, setTheme } = useTheme();

  const value: EventContextValue = {
    event,
    isFullScreen,
    setEvent,
    setIsFullScreen,
    selected,
    setSelected,
    setMode,
    setTheme,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

export const useEventContext = () => useContext(EventContext);
