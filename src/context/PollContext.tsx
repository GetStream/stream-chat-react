import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { Poll } from 'stream-chat';
import { requireContext } from './requireContext';

export type PollContextValue = {
  poll: Poll;
};

export const PollContext = React.createContext<PollContextValue | undefined>(undefined);

export const PollProvider = ({
  children,
  poll,
}: PropsWithChildren<{
  poll: Poll;
}>) =>
  poll ? (
    <PollContext.Provider value={{ poll } as unknown as PollContextValue}>
      {children}
    </PollContext.Provider>
  ) : null;

export const usePollContext = () =>
  requireContext(useContext(PollContext), 'usePollContext', 'PollProvider');
