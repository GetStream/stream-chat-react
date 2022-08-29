import React, { useCallback, useState } from 'react';

export const useEnterLeaveHandlers = <T extends HTMLElement>({
  onMouseEnter,
  onMouseLeave,
}: Partial<Record<'onMouseEnter' | 'onMouseLeave', React.MouseEventHandler<T>>> = {}) => {
  const [popperVisible, setPopperVisible] = useState(false);

  const handleEnter: React.MouseEventHandler<T> = useCallback(
    (e) => {
      setPopperVisible(true);
      onMouseEnter?.(e);
    },
    [onMouseEnter],
  );

  const handleLeave: React.MouseEventHandler<T> = useCallback(
    (e) => {
      setPopperVisible(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  return { handleEnter, handleLeave, popperVisible };
};
