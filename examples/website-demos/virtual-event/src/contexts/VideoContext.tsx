import React, { useContext, useState } from 'react';

type VideoContextValue = {
  setLabel: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPresenters: React.Dispatch<React.SetStateAction<number | undefined>>;
  setTitle: React.Dispatch<React.SetStateAction<string | undefined>>;
  setViewers: React.Dispatch<React.SetStateAction<number | undefined>>;
  label?: string;
  presenters?: number;
  title?: string;
  viewers?: number;
};

const VideoContext = React.createContext({} as VideoContextValue);

export const VideoProvider: React.FC = ({ children }) => {
  const [label, setLabel] = useState<string | undefined>();
  const [presenters, setPresenters] = useState<number | undefined>();
  const [title, setTitle] = useState<string | undefined>();
  const [viewers, setViewers] = useState<number | undefined>();

  const value: VideoContextValue = {
    label,
    presenters,
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
