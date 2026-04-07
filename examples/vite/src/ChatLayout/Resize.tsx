import clsx from 'clsx';
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useSidebar } from './SidebarContext.tsx';

import {
  type LeftPanelLayoutSettingsState,
  LEFT_PANEL_MIN_WIDTH,
  THREAD_PANEL_MIN_WIDTH,
  updatePanelLayoutSettings,
  useAppSettingsSelector,
} from '../AppSettings/state.ts';
import { DESKTOP_LAYOUT_BREAKPOINT, MESSAGE_VIEW_MIN_WIDTH } from './constants.ts';

const clamp = (value: number, min: number, max?: number) => {
  const safeMax = typeof max === 'number' ? Math.max(min, max) : undefined;
  const minClampedValue = Math.max(value, min);

  if (typeof safeMax !== 'number') return minClampedValue;

  return Math.min(minClampedValue, safeMax);
};

const beginHorizontalResize = ({
  bodyClassName,
  handle,
  onMove,
  onStop,
  pointerId,
}: {
  bodyClassName?: string;
  handle: HTMLDivElement;
  onMove: (event: PointerEvent) => void;
  onStop?: () => void;
  pointerId: number;
}) => {
  const originalCursor = document.body.style.cursor;
  const originalUserSelect = document.body.style.userSelect;

  const stopResize = () => {
    document.body.style.cursor = originalCursor;
    document.body.style.userSelect = originalUserSelect;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopResize);
    window.removeEventListener('pointercancel', stopResize);

    if (handle.hasPointerCapture(pointerId)) {
      handle.releasePointerCapture(pointerId);
    }

    if (bodyClassName) {
      document.body.classList.remove(bodyClassName);
    }

    onStop?.();
  };

  const handlePointerMove = (event: PointerEvent) => {
    onMove(event);
  };

  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  if (bodyClassName) {
    document.body.classList.add(bodyClassName);
  }
  handle.setPointerCapture(pointerId);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopResize);
  window.addEventListener('pointercancel', stopResize);
};

const getAppLayoutElement = (element?: HTMLElement | null) => {
  const appLayout = element?.closest('.app-chat-layout');

  return appLayout instanceof HTMLDivElement ? appLayout : null;
};

const setPanelWidthCssVariable = (
  appLayoutElement: HTMLDivElement,
  cssVariableName: '--app-left-panel-width' | '--app-thread-panel-width',
  width: number,
) => {
  appLayoutElement.style.setProperty(cssVariableName, `${width}px`);
};

const syncChatViewSelectorMobileWidth = (layoutElement: HTMLDivElement) => {
  const selectorElement = layoutElement.querySelector<HTMLDivElement>(
    '.str-chat__chat-view__selector',
  );

  if (!selectorElement) return;

  const nextWidth = Math.ceil(
    Math.max(selectorElement.getBoundingClientRect().width, selectorElement.scrollWidth),
  );

  layoutElement.style.setProperty(
    '--str-chat__chat-view-selector-mobile-width',
    `${nextWidth}px`,
  );
};

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
      '--app-thread-panel-width',
      panelLayout.threadPanel.width,
    );
  }, [layoutRef, panelLayout]);

  return null;
};

export const ChatViewSelectorWidthSync = ({
  iconOnly,
  layoutRef,
}: {
  iconOnly: boolean;
  layoutRef: RefObject<HTMLDivElement | null>;
}) => {
  useEffect(() => {
    const layoutElement = layoutRef.current;

    if (!layoutElement) return;

    const selectorElement = layoutElement.querySelector<HTMLDivElement>(
      '.str-chat__chat-view__selector',
    );

    if (!selectorElement) return;

    const sync = () => {
      syncChatViewSelectorMobileWidth(layoutElement);
    };

    sync();
    window.addEventListener('resize', sync);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', sync);
      };
    }

    const resizeObserver = new ResizeObserver(sync);

    resizeObserver.observe(selectorElement);

    return () => {
      window.removeEventListener('resize', sync);
      resizeObserver.disconnect();
    };
  }, [iconOnly, layoutRef]);

  return null;
};

const PanelResizeHandle = ({
  className,
  onPointerDown,
}: {
  className?: string;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) => (
  <div
    aria-orientation='vertical'
    className={clsx('app-chat-resize-handle', className)}
    onPointerDown={onPointerDown}
    role='separator'
  >
    <div className='app-chat-resize-handle__hitbox'>
      <div className='app-chat-resize-handle__line' />
    </div>
  </div>
);

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

      beginHorizontalResize({
        bodyClassName: 'app-chat-resizing-sidebar',
        handle: event.currentTarget,
        onMove: (pointerEvent) => {
          const nextWidth = pointerEvent.clientX - layoutBounds.left;
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

export const ThreadResizeHandle = ({ isOpen }: { isOpen: boolean }) => {
  const { width: threadPanelWidth } = useAppSettingsSelector(
    (state) => state.panelLayout.threadPanel,
  );
  const threadPanelWidthRef = useRef(threadPanelWidth);

  useEffect(() => {
    threadPanelWidthRef.current = threadPanelWidth;
  }, [threadPanelWidth]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !isOpen) return;

      const container = event.currentTarget.parentElement;
      const appLayoutElement = getAppLayoutElement(container);
      const containerBounds = container?.getBoundingClientRect();

      if (!container || !containerBounds || !appLayoutElement) return;

      event.preventDefault();
      const dragState = {
        width: threadPanelWidthRef.current,
      };

      beginHorizontalResize({
        bodyClassName: 'app-chat-resizing-thread',
        handle: event.currentTarget,
        onMove: (pointerEvent) => {
          const nextWidth = containerBounds.right - pointerEvent.clientX;
          const maxWidth = containerBounds.width - MESSAGE_VIEW_MIN_WIDTH;
          const width = clamp(nextWidth, THREAD_PANEL_MIN_WIDTH, maxWidth);

          dragState.width = width;
          setPanelWidthCssVariable(appLayoutElement, '--app-thread-panel-width', width);
        },
        onStop: () => {
          const previousWidth = threadPanelWidthRef.current;

          threadPanelWidthRef.current = dragState.width;

          if (previousWidth === dragState.width) return;

          updatePanelLayoutSettings((panelLayout) => ({
            ...panelLayout,
            threadPanel: {
              width: dragState.width,
            },
          }));
        },
        pointerId: event.pointerId,
      });
    },
    [isOpen],
  );

  return (
    <PanelResizeHandle
      className={clsx('app-chat-resize-handle--thread', {
        'app-chat-resize-handle--thread-hidden': !isOpen,
      })}
      onPointerDown={handlePointerDown}
    />
  );
};
