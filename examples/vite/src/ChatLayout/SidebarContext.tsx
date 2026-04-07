import { createContext, useCallback, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';

type SidebarContextValue = {
  closeSidebar: () => void;
  openSidebar: () => void;
  sidebarOpen: boolean;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const useSidebar = () => {
  const value = useContext(SidebarContext);
  if (!value) throw new Error('useSidebar must be used within a SidebarProvider');
  return value;
};

export const SidebarProvider = ({
  children,
  initialOpen = true,
}: PropsWithChildren<{ initialOpen?: boolean }>) => {
  const [sidebarOpen, setSidebarOpen] = useState(initialOpen);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setTimeout(() => setSidebarOpen(true), 100), []);

  return (
    <SidebarContext.Provider value={{ closeSidebar, openSidebar, sidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};
