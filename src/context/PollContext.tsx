import React, { useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import type { Poll } from 'stream-chat';
import type { TranslationView } from './MessageTranslationViewContext';
import { requireContext } from './requireContext';

export type PollContextValue = {
  poll: Poll;
  translationView?: TranslationView;
};

export type PollProviderProps = PropsWithChildren<PollContextValue>;

export const PollContext = React.createContext<PollContextValue | undefined>(undefined);

export const PollProvider = ({ children, poll, translationView }: PollProviderProps) => {
  const value = useMemo(() => ({ poll, translationView }), [poll, translationView]);

  return poll ? (
    <PollContext.Provider value={value}>{children}</PollContext.Provider>
  ) : null;
};

export const usePollContext = () =>
  requireContext(useContext(PollContext), 'usePollContext', 'PollProvider');
