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

// Module-level so the fallback keeps a stable identity across renders — standalone dialog
// primitives (Alert, Prompt, Viewer) render outside a modal and would otherwise see a new `close`
// on every render.
const NO_MODAL_FALLBACK: ModalContextValue = { close: () => undefined };

/**
 * Deliberately does not throw: `Alert`, `Prompt` and `Viewer` are usable standalone, reading only
 * `dialogId` for aria wiring, and degrade to a no-op `close`.
 */
export const useModalContext = () => useContext(ModalContext) ?? NO_MODAL_FALLBACK;
