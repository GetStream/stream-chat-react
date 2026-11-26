// Helpers shared by the resize handles and the panel-width sync.

export const clamp = (value: number, min: number, max?: number) => {
  const safeMax = typeof max === 'number' ? Math.max(min, max) : undefined;
  const minClampedValue = Math.max(value, min);

  if (typeof safeMax !== 'number') return minClampedValue;

  return Math.min(minClampedValue, safeMax);
};

export const beginHorizontalResize = ({
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

export const getAppLayoutElement = (element?: HTMLElement | null) => {
  const appLayout = element?.closest('.app-chat-layout');

  return appLayout instanceof HTMLDivElement ? appLayout : null;
};

export const setPanelWidthCssVariable = (
  appLayoutElement: HTMLDivElement,
  cssVariableName: '--app-left-panel-width' | '--app-secondary-panel-width',
  width: number,
) => {
  appLayoutElement.style.setProperty(cssVariableName, `${width}px`);
};
