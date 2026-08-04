import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { DialogAnchor, ModalContextProvider, Prompt } from 'stream-chat-react';

const VIEWPORT_MARGIN = 8;

const clamp = (value: number, min: number, max: number) => {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
};

export const DraggableDialog = ({
  children,
  closeOnClickOutside,
  dialogClassName,
  dialogId,
  dialogIsOpen,
  dialogManagerId,
  dragHandleClassName,
  onClose,
  promptClassName,
  referenceElement,
  shellClassName,
  title,
}: {
  children: ReactNode;
  /** Per-dialog override for outside-click dismissal (defaults to the manager's policy). Pass
   *  `false` for a persistent draggable window that should only close via its own control. */
  closeOnClickOutside?: boolean;
  dialogClassName: string;
  dialogId: string;
  dialogIsOpen: boolean;
  dialogManagerId?: string;
  dragHandleClassName: string;
  onClose: () => void;
  promptClassName: string;
  referenceElement: HTMLElement | null;
  shellClassName: string;
  title: ReactNode;
}) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const shellRef = useRef<HTMLDivElement | null>(null);
  const modalContextValue = {
    close: onClose,
    dialogId,
  };

  useEffect(() => {
    if (dialogIsOpen) return;
    setDragOffset({ x: 0, y: 0 });
  }, [dialogIsOpen]);

  useEffect(() => {
    if (!dialogIsOpen) return;

    const clampToViewport = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      const nextLeft = clamp(
        rect.left,
        VIEWPORT_MARGIN,
        window.innerWidth - rect.width - VIEWPORT_MARGIN,
      );
      const nextTop = clamp(
        rect.top,
        VIEWPORT_MARGIN,
        window.innerHeight - rect.height - VIEWPORT_MARGIN,
      );

      if (nextLeft === rect.left && nextTop === rect.top) return;

      setDragOffset((current) => ({
        x: current.x + (nextLeft - rect.left),
        y: current.y + (nextTop - rect.top),
      }));
    };

    window.addEventListener('resize', clampToViewport);

    return () => {
      window.removeEventListener('resize', clampToViewport);
    };
  }, [dialogIsOpen]);

  const handleHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target.closest('button')) return;

      const shell = shellRef.current;
      if (!shell) return;

      event.preventDefault();

      const startClientX = event.clientX;
      const startClientY = event.clientY;
      const startOffset = dragOffset;
      const startRect = shell.getBoundingClientRect();

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextLeft = clamp(
          startRect.left + (moveEvent.clientX - startClientX),
          VIEWPORT_MARGIN,
          window.innerWidth - startRect.width - VIEWPORT_MARGIN,
        );
        const nextTop = clamp(
          startRect.top + (moveEvent.clientY - startClientY),
          VIEWPORT_MARGIN,
          window.innerHeight - startRect.height - VIEWPORT_MARGIN,
        );

        setDragOffset({
          x: startOffset.x + (nextLeft - startRect.left),
          y: startOffset.y + (nextTop - startRect.top),
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [dragOffset],
  );

  const shellStyle: CSSProperties = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
  };

  return (
    <DialogAnchor
      allowFlip
      className={dialogClassName}
      closeOnClickOutside={closeOnClickOutside}
      dialogManagerId={dialogManagerId}
      id={dialogId}
      placement='right-start'
      referenceElement={referenceElement}
      tabIndex={-1}
      trapFocus
      updatePositionOnContentResize
    >
      <div className={shellClassName} ref={shellRef} style={shellStyle}>
        <ModalContextProvider value={modalContextValue}>
          <Prompt.Root className={promptClassName}>
            <div className={dragHandleClassName} onPointerDown={handleHeaderPointerDown}>
              <Prompt.Header close={onClose} title={title} />
            </div>
            {children}
          </Prompt.Root>
        </ModalContextProvider>
      </div>
    </DialogAnchor>
  );
};
