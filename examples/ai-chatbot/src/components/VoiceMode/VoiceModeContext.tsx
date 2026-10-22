'use client';

import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

type VoiceModeContextValue = {
  close: () => void;
  isOpen: boolean;
  open: () => void;
};

const VoiceModeContext = createContext<VoiceModeContextValue | undefined>(undefined);

export const useVoiceMode = () => {
  const context = useContext(VoiceModeContext);
  if (!context) {
    throw new Error('useVoiceMode must be used within VoiceModeProvider');
  }
  return context;
};

export const VoiceModeProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      close: () => setIsOpen(false),
      isOpen,
      open: () => setIsOpen(true),
    }),
    [isOpen],
  );

  return <VoiceModeContext.Provider value={value}>{children}</VoiceModeContext.Provider>;
};
