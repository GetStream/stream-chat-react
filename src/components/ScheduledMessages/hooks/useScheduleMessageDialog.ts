import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import type { ScheduleMessageDialogState } from '../types';

const hasFocusFallenToBody = () => {
  const { activeElement } = document;

  return !activeElement || activeElement === document.body;
};

export const useScheduleMessageDialog = (
  returnFocusRef: RefObject<HTMLElement | null>,
) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const shouldRestoreFocusRef = useRef(false);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);

  const closeDialog = useCallback(() => {
    shouldRestoreFocusRef.current = true;
    setIsDialogOpen(false);
  }, []);

  useEffect(() => {
    if (isDialogOpen || !shouldRestoreFocusRef.current) return;

    const frame = requestAnimationFrame(() => {
      shouldRestoreFocusRef.current = false;

      if (hasFocusFallenToBody()) returnFocusRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isDialogOpen, returnFocusRef]);

  const scheduleMessageDialog: ScheduleMessageDialogState = {
    closeDialog,
    isDialogOpen,
    openDialog,
  };

  return scheduleMessageDialog;
};
