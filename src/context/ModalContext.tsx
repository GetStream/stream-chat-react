import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

export type ModalContextValue = {
  close: () => void;
  dialogId?: string;
};

export const ModalContext = React.createContext<ModalContextValue | undefined>(undefined);

export const ModalContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ModalContextValue;
}>) => <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;

// module-level to keep a stable identity across renders
const NO_MODAL_FALLBACK: ModalContextValue = { close: () => undefined };

/**
 * Works outside a modal: `Alert`, `Prompt` and `Viewer` are usable standalone, reading only
 * `dialogId` for aria wiring, and get a no-op `close`.
 */
export const useModalContext = () => useContext(ModalContext) ?? NO_MODAL_FALLBACK;
