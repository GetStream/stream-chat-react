import clsx from 'clsx';
import type { PointerEvent as ReactPointerEvent } from 'react';

// The draggable divider both resize handles render.
export const PanelResizeHandle = ({
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
