import clsx from 'clsx';
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useChatContext } from 'stream-chat-react';

import {
  LEFT_PANEL_MIN_WIDTH,
  THREAD_PANEL_MIN_WIDTH,
  updatePanelLayoutSettings,
  useAppSettingsState,
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
  const { navOpen = true } = useChatContext();
  const {
    panelLayout: { leftPanel },
  } = useAppSettingsState();

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < DESKTOP_LAYOUT_BREAKPOINT) {
      return;
    }

    const shouldBeCollapsed = !navOpen;

    if (shouldBeCollapsed === leftPanel.collapsed) return;

    updatePanelLayoutSettings((panelLayout) => ({
      ...panelLayout,
      leftPanel: {
        ...panelLayout.leftPanel,
        collapsed: shouldBeCollapsed,
      },
    }));
  }, [leftPanel.collapsed, navOpen]);

  return null;
};

export const SidebarResizeHandle = ({
  layoutRef,
}: {
  layoutRef: RefObject<HTMLDivElement | null>;
}) => {
  const { closeMobileNav, openMobileNav } = useChatContext('SidebarResizeHandle');
  const {
    panelLayout: { leftPanel },
  } = useAppSettingsState();
  const isSidebarCollapsedRef = useRef(leftPanel.collapsed);

  useEffect(() => {
    isSidebarCollapsedRef.current = leftPanel.collapsed;
  }, [leftPanel.collapsed]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      event.preventDefault();
      document.body.dataset.appSidebarResizeState = leftPanel.collapsed
        ? 'collapsed'
        : 'expanded';

      beginHorizontalResize({
        bodyClassName: 'app-chat-resizing-sidebar',
        handle: event.currentTarget,
        onMove: (pointerEvent) => {
          const layoutBounds = layoutRef.current?.getBoundingClientRect();

          if (!layoutBounds) return;

          const nextWidth = pointerEvent.clientX - layoutBounds.left;
          const maxWidth = layoutBounds.width - MESSAGE_VIEW_MIN_WIDTH;
          const shouldCollapse = nextWidth < LEFT_PANEL_MIN_WIDTH;

          document.body.dataset.appSidebarResizeState = shouldCollapse
            ? 'collapsed'
            : 'expanded';

          if (shouldCollapse !== isSidebarCollapsedRef.current) {
            isSidebarCollapsedRef.current = shouldCollapse;

            if (shouldCollapse) {
              closeMobileNav();
            } else {
              openMobileNav();
            }
          }

          updatePanelLayoutSettings((panelLayout) => {
            if (shouldCollapse) {
              return {
                ...panelLayout,
                leftPanel: {
                  ...panelLayout.leftPanel,
                  collapsed: true,
                  previousWidth: panelLayout.leftPanel.collapsed
                    ? panelLayout.leftPanel.previousWidth
                    : panelLayout.leftPanel.width,
                },
              };
            }

            const clampedWidth = clamp(nextWidth, LEFT_PANEL_MIN_WIDTH, maxWidth);
            const expandedWidth = panelLayout.leftPanel.collapsed
              ? Math.max(panelLayout.leftPanel.previousWidth, clampedWidth)
              : clampedWidth;

            return {
              ...panelLayout,
              leftPanel: {
                collapsed: false,
                previousWidth: expandedWidth,
                width: expandedWidth,
              },
            };
          });
        },
        onStop: () => {
          delete document.body.dataset.appSidebarResizeState;
        },
        pointerId: event.pointerId,
      });
    },
    [closeMobileNav, layoutRef, leftPanel.collapsed, openMobileNav],
  );

  return (
    <PanelResizeHandle
      className='app-chat-resize-handle--sidebar'
      onPointerDown={handlePointerDown}
    />
  );
};

export const ThreadResizeHandle = ({ isOpen }: { isOpen: boolean }) => {
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !isOpen) return;

      const container = event.currentTarget.parentElement;

      if (!container) return;

      event.preventDefault();

      beginHorizontalResize({
        bodyClassName: 'app-chat-resizing-thread',
        handle: event.currentTarget,
        onMove: (pointerEvent) => {
          const containerBounds = container.getBoundingClientRect();
          const nextWidth = containerBounds.right - pointerEvent.clientX;
          const maxWidth = containerBounds.width - MESSAGE_VIEW_MIN_WIDTH;

          updatePanelLayoutSettings((panelLayout) => ({
            ...panelLayout,
            threadPanel: {
              width: clamp(nextWidth, THREAD_PANEL_MIN_WIDTH, maxWidth),
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
