import { type RefObject, useEffect } from 'react';

import { useAppSettingsSelector } from '../../AppSettings/state.ts';
import { setPanelWidthCssVariable } from './utils';

// Applies the saved sidebar and secondary-panel widths to the app layout's CSS variables.
export const PanelLayoutStyleSync = ({
  layoutRef,
}: {
  layoutRef: RefObject<HTMLDivElement | null>;
}) => {
  const panelLayout = useAppSettingsSelector((state) => state.panelLayout);

  useEffect(() => {
    const layoutElement = layoutRef.current;

    if (!layoutElement) return;

    setPanelWidthCssVariable(
      layoutElement,
      '--app-left-panel-width',
      panelLayout.leftPanel.width,
    );
    setPanelWidthCssVariable(
      layoutElement,
      '--app-secondary-panel-width',
      panelLayout.threadPanel.width,
    );
  }, [layoutRef, panelLayout]);

  return null;
};
