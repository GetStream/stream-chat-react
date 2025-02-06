import type { PropsWithChildren } from 'react';
import React, { createContext, useContext } from 'react';

export type AttachmentSelectorContextValue = {
  fileInput: HTMLInputElement | null;
};

const AttachmentSelectorContext = createContext<AttachmentSelectorContextValue>({
  fileInput: null,
});

export const AttachmentSelectorContextProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: AttachmentSelectorContextValue }>) => (
  <AttachmentSelectorContext.Provider value={value}>
    {children}
  </AttachmentSelectorContext.Provider>
);

export const useAttachmentSelectorContext = () => useContext(AttachmentSelectorContext);
