import clsx from 'clsx';
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import {
  THREAD_PANEL_MIN_WIDTH,
  updatePanelLayoutSettings,
  useAppSettingsSelector,
} from '../../AppSettings/state.ts';
import { MESSAGE_VIEW_MIN_WIDTH } from '../constants.ts';
import { PanelResizeHandle } from './PanelResizeHandle';
import {
  beginHorizontalResize,
  clamp,
  getAppLayoutElement,
  setPanelWidthCssVariable,
} from './utils';

// Resizes the secondary panel by dragging the divider before it; hidden while the panel is closed.
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
      const isRtl = getComputedStyle(appLayoutElement).direction === 'rtl';

      beginHorizontalResize({
        bodyClassName: 'app-chat-resizing-secondary',
        handle: event.currentTarget,
        onMove: (pointerEvent) => {
          const nextWidth = isRtl
            ? pointerEvent.clientX - containerBounds.left
            : containerBounds.right - pointerEvent.clientX;
          const maxWidth = containerBounds.width - MESSAGE_VIEW_MIN_WIDTH;
          const width = clamp(nextWidth, THREAD_PANEL_MIN_WIDTH, maxWidth);

          dragState.width = width;
          setPanelWidthCssVariable(
            appLayoutElement,
            '--app-secondary-panel-width',
            width,
          );
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
      className={clsx('app-chat-resize-handle--secondary', {
        'app-chat-resize-handle--secondary-hidden': !isOpen,
      })}
      onPointerDown={handlePointerDown}
    />
  );
};
