import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import clsx from 'clsx';
import { DialogAnchor, ModalContextProvider, Prompt } from 'stream-chat-react';

const VIEWPORT_MARGIN = 8;

const clamp = (value: number, min: number, max: number) => {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
};

/**
 * Stable classes applied alongside whatever the caller passes, so one stylesheet rule can
 * govern pointer behaviour for every draggable dialog.
 */
export const DRAGGABLE_DIALOG_ANCHOR_CLASS = 'app__draggable-dialog';
export const DRAGGABLE_DIALOG_SHELL_CLASS = 'app__draggable-dialog__shell';

/**
 * A floating, draggable, **non-modal** dialog.
 *
 * The defaults below deliberately differ from a normal prompt: these panels exist to be kept
 * open while you use the app — trigger an event, watch what happens, trigger another — so they
 * do not trap focus, do not steal focus on open, and dismiss only via their close button.
 * Callers can opt back in per dialog.
 */
export const DraggableDialog = ({
  children,
  closeOnClickOutside = false,
  closeOnEscape = false,
  dialogClassName,
  dialogId,
  dialogIsOpen,
  dialogManagerId,
  dragHandleClassName,
  focus = false,
  onClose,
  promptClassName,
  referenceElement,
  shellClassName,
  title,
  trapFocus = false,
}: {
  children: ReactNode;
  /** @default false — dismiss via the close button only. */
  closeOnClickOutside?: boolean;
  /** @default false — dismiss via the close button only. */
  closeOnEscape?: boolean;
  dialogClassName: string;
  dialogId: string;
  dialogIsOpen: boolean;
  dialogManagerId?: string;
  dragHandleClassName: string;
  /** Whether the dialog grabs focus when it opens. @default false */
  focus?: boolean;
  onClose: () => void;
  promptClassName: string;
  referenceElement: HTMLElement | null;
  shellClassName: string;
  title: string;
  /**
   * Contain focus within the dialog. `true` also makes DialogAnchor render `role="dialog"`
   * with `aria-modal`, telling assistive tech the rest of the app is inert — correct for a
   * prompt, wrong for a panel meant to stay open while the user works elsewhere.
   * @default false
   */
  trapFocus?: boolean;
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
      className={clsx(DRAGGABLE_DIALOG_ANCHOR_CLASS, dialogClassName)}
      closeOnClickOutside={closeOnClickOutside}
      closeOnEscape={closeOnEscape}
      dialogManagerId={dialogManagerId}
      focus={focus}
      id={dialogId}
      placement='right-start'
      referenceElement={referenceElement}
      tabIndex={-1}
      trapFocus={trapFocus}
      updatePositionOnContentResize
    >
      <div
        className={clsx(DRAGGABLE_DIALOG_SHELL_CLASS, shellClassName)}
        ref={shellRef}
        style={shellStyle}
      >
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
