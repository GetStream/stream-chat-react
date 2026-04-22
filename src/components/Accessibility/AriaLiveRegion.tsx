import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Portal } from '../Portal/Portal';
import { VisuallyHidden } from '../VisuallyHidden';
import {
  type AriaLiveAnnounce,
  AriaLiveAnnouncerContext,
  type AriaLivePriority,
} from './useAriaLiveAnnouncer';

type SequenceByPriority = {
  [key in AriaLivePriority]: number;
};

type TimeoutByPriority = {
  [key in AriaLivePriority]: ReturnType<typeof setTimeout> | undefined;
};

export const AriaLiveRegion = ({ children }: PropsWithChildren) => {
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const [politeMessage, setPoliteMessage] = useState('');
  const sequenceByPriorityRef = useRef<SequenceByPriority>({
    assertive: 0,
    polite: 0,
  });
  const timeoutByPriorityRef = useRef<TimeoutByPriority>({
    assertive: undefined,
    polite: undefined,
  });
  const unmountedRef = useRef(false);

  const clearPendingTimeout = useCallback((priority: AriaLivePriority) => {
    if (!timeoutByPriorityRef.current[priority]) return;
    clearTimeout(timeoutByPriorityRef.current[priority]);
    timeoutByPriorityRef.current[priority] = undefined;
  }, []);

  const clearPendingTimeouts = useCallback(() => {
    clearPendingTimeout('assertive');
    clearPendingTimeout('polite');
  }, [clearPendingTimeout]);

  const announce = useCallback<AriaLiveAnnounce>(
    (message, priority = 'polite') => {
      const setAnnouncement =
        priority === 'assertive' ? setAssertiveMessage : setPoliteMessage;
      const sequence = sequenceByPriorityRef.current[priority] + 1;

      sequenceByPriorityRef.current[priority] = sequence;
      clearPendingTimeout(priority);
      setAnnouncement('');
      timeoutByPriorityRef.current[priority] = setTimeout(() => {
        if (unmountedRef.current) return;
        if (sequenceByPriorityRef.current[priority] !== sequence) return;
        setAnnouncement(message);
        timeoutByPriorityRef.current[priority] = undefined;
      }, 50);
    },
    [clearPendingTimeout],
  );

  useEffect(() => {
    unmountedRef.current = false;

    return () => {
      unmountedRef.current = true;
      clearPendingTimeouts();
    };
  }, [clearPendingTimeouts]);

  const contextValue = useMemo(() => ({ announce }), [announce]);

  const getPortalDestination = useCallback(() => document.body, []);

  return (
    <AriaLiveAnnouncerContext.Provider value={contextValue}>
      {children}
      <Portal getPortalDestination={getPortalDestination} isOpen>
        <VisuallyHidden>
          <div
            aria-atomic='true'
            aria-live='polite'
            aria-relevant='additions text'
            data-testid='str-chat__aria-live-region--polite'
            role='status'
          >
            {politeMessage}
          </div>
          <div
            aria-atomic='true'
            aria-live='assertive'
            aria-relevant='additions text'
            data-testid='str-chat__aria-live-region--assertive'
            role='alert'
          >
            {assertiveMessage}
          </div>
        </VisuallyHidden>
      </Portal>
    </AriaLiveAnnouncerContext.Provider>
  );
};
