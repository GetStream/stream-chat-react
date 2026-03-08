import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

export type ModalContextValue = {
  close: () => void;
};

export const ModalContext = React.createContext<ModalContextValue | undefined>(undefined);

export const ModalContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ModalContextValue;
}>) => <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;

export const useModalContext = () => {
  const contextValue = useContext(ModalContext);

  if (!contextValue) {
    console.warn(
      `The useModalContext hook was called outside of the ModalContext provider. Make sure this hook is called within a child of the GlobalModal.`,
    );

    return { close: () => null } as ModalContextValue;
  }

  return contextValue;
};
