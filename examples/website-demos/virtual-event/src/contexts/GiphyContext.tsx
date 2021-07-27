import React, { useContext, useState } from 'react';

const GiphyContext = React.createContext(
  {} as { giphyState: boolean; setGiphyState: React.Dispatch<React.SetStateAction<boolean>> },
);

export const GiphyContextProvider: React.FC = ({ children }) => {
  const [giphyState, setGiphyState] = useState(false);

  const value = { giphyState, setGiphyState };
  return <GiphyContext.Provider value={value}>{children}</GiphyContext.Provider>;
};

export const useGiphyContext = () => useContext(GiphyContext);
