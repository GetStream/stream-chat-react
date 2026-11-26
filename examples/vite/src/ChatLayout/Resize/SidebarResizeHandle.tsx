import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import {
  LEFT_PANEL_MIN_WIDTH,
  type LeftPanelLayoutSettingsState,
  updatePanelLayoutSettings,
  useAppSettingsSelector,
} from '../../AppSettings/state.ts';
import { useSidebar } from '../../Sidebar/SidebarContext.tsx';
import { MESSAGE_VIEW_MIN_WIDTH } from '../constants.ts';
import { PanelResizeHandle } from './PanelResizeHandle';
import {
  beginHorizontalResize,
  clamp,
  getAppLayoutElement,
  setPanelWidthCssVariable,
} from './utils';

// Resizes the sidebar by dragging its edge; dragging it below the minimum width collapses it.
export const SidebarResizeHandle = ({
  layoutRef,
}: {
  layoutRef: RefObject<HTMLDivElement | null>;
}) => {
  const { closeSidebar, openSidebar } = useSidebar();
  const leftPanel = useAppSettingsSelector((state) => state.panelLayout.leftPanel);
  const isSidebarCollapsedRef = useRef(leftPanel.collapsed);
  const leftPanelStateRef = useRef(leftPanel);

  useEffect(() => {
    isSidebarCollapsedRef.current = leftPanel.collapsed;
    leftPanelStateRef.current = leftPanel;
  }, [leftPanel]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      const layoutElement = layoutRef.current;
      const appLayoutElement = getAppLayoutElement(layoutElement);
      const layoutBounds = layoutElement?.getBoundingClientRect();

      if (!layoutBounds || !appLayoutElement) return;

      event.preventDefault();
      const dragState: LeftPanelLayoutSettingsState = {
        ...leftPanelStateRef.current,
      };

      document.body.dataset.appSidebarResizeState = dragState.collapsed
        ? 'collapsed'
        : 'expanded';

      const isRtl = getComputedStyle(appLayoutElement).direction === 'rtl';

      beginHorizontalResize({
        bodyClassName: 'app-chat-resizing-sidebar',
        handle: event.currentTarget,
        onMove: (pointerEvent) => {
          const nextWidth = isRtl
            ? layoutBounds.right - pointerEvent.clientX
            : pointerEvent.clientX - layoutBounds.left;
          const maxWidth = layoutBounds.width - MESSAGE_VIEW_MIN_WIDTH;
          const shouldCollapse = nextWidth < LEFT_PANEL_MIN_WIDTH;

          document.body.dataset.appSidebarResizeState = shouldCollapse
            ? 'collapsed'
            : 'expanded';

          if (shouldCollapse) {
            if (!dragState.collapsed) {
              dragState.previousWidth = dragState.width;
              dragState.collapsed = true;
            }
          } else {
            const clampedWidth = clamp(nextWidth, LEFT_PANEL_MIN_WIDTH, maxWidth);
            const expandedWidth = dragState.collapsed
              ? Math.max(dragState.previousWidth, clampedWidth)
              : clampedWidth;

            dragState.collapsed = false;
            dragState.previousWidth = expandedWidth;
            dragState.width = expandedWidth;

            setPanelWidthCssVariable(
              appLayoutElement,
              '--app-left-panel-width',
              expandedWidth,
            );
          }

          if (shouldCollapse !== isSidebarCollapsedRef.current) {
            isSidebarCollapsedRef.current = shouldCollapse;

            if (shouldCollapse) {
              closeSidebar();
            } else {
              openSidebar();
            }
          }
        },
        onStop: () => {
          delete document.body.dataset.appSidebarResizeState;

          const previousPanelState = leftPanelStateRef.current;

          leftPanelStateRef.current = dragState;

          if (
            previousPanelState.collapsed === dragState.collapsed &&
            previousPanelState.previousWidth === dragState.previousWidth &&
            previousPanelState.width === dragState.width
          ) {
            return;
          }

          updatePanelLayoutSettings((panelLayout) => ({
            ...panelLayout,
            leftPanel: dragState,
          }));
        },
        pointerId: event.pointerId,
      });
    },
    [closeSidebar, layoutRef, openSidebar],
  );

  return (
    <PanelResizeHandle
      className='app-chat-resize-handle--sidebar'
      onPointerDown={handlePointerDown}
    />
  );
};
