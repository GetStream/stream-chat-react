import { useEffect } from 'react';

import {
  updatePanelLayoutSettings,
  useAppSettingsSelector,
} from '../../AppSettings/state.ts';
import { useSidebar } from '../../Sidebar/SidebarContext.tsx';
import { DESKTOP_LAYOUT_BREAKPOINT } from '../constants.ts';

// Saves the sidebar's open or collapsed state to the panel-layout settings on desktop widths.
export const SidebarLayoutSync = () => {
  const { sidebarOpen } = useSidebar();
  const { collapsed: leftPanelCollapsed } = useAppSettingsSelector(
    (state) => state.panelLayout.leftPanel,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < DESKTOP_LAYOUT_BREAKPOINT) {
      return;
    }

    if (document.body.classList.contains('app-chat-resizing-sidebar')) return;

    const shouldBeCollapsed = !sidebarOpen;

    if (shouldBeCollapsed === leftPanelCollapsed) return;

    updatePanelLayoutSettings((panelLayout) => ({
      ...panelLayout,
      leftPanel: {
        ...panelLayout.leftPanel,
        collapsed: shouldBeCollapsed,
      },
    }));
  }, [leftPanelCollapsed, sidebarOpen]);

  return null;
};
