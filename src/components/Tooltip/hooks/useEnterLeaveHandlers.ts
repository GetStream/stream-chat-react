import React, { useCallback, useState } from 'react';

export const useEnterLeaveHandlers = <T extends HTMLElement>({
  onMouseEnter,
  onMouseLeave,
}: Partial<Record<'onMouseEnter' | 'onMouseLeave', React.MouseEventHandler<T>>> = {}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const handleEnter: React.MouseEventHandler<T> = useCallback(
    (e) => {
      setTooltipVisible(true);
      onMouseEnter?.(e);
    },
    [onMouseEnter],
  );

  const handleLeave: React.MouseEventHandler<T> = useCallback(
    (e) => {
      setTooltipVisible(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  return { handleEnter, handleLeave, tooltipVisible };
};
