import React, { useContext, useState } from 'react';

type VideoContextValue = {
  setEventNumber: React.Dispatch<React.SetStateAction<number | undefined>>;
  setLabel: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPresenters: React.Dispatch<React.SetStateAction<number | undefined>>;
  setTitle: React.Dispatch<React.SetStateAction<string | undefined>>;
  setViewers: React.Dispatch<React.SetStateAction<number | undefined>>;
  eventNumber?: number;
  label?: string;
  presenters?: number;
  title?: string;
  viewers?: number;
};

const VideoContext = React.createContext({} as VideoContextValue);

export const VideoProvider = ({ children }: {children?: React.ReactNode}) => {
  const [eventNumber, setEventNumber] = useState<number>();
  const [label, setLabel] = useState<string>();
  const [presenters, setPresenters] = useState<number>();
  const [title, setTitle] = useState<string>();
  const [viewers, setViewers] = useState<number>();

  const value: VideoContextValue = {
    eventNumber,
    label,
    presenters,
    setEventNumber,
    setLabel,
    setPresenters,
    setTitle,
    setViewers,
    title,
    viewers,
  };

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
};

export const useVideoContext = () => useContext(VideoContext);
