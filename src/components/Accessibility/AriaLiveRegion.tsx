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

const runInMicrotask = (callback: () => void) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
    return;
  }

  Promise.resolve().then(callback);
};

export const AriaLiveRegion = ({ children }: PropsWithChildren) => {
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const [politeMessage, setPoliteMessage] = useState('');
  const sequenceByPriorityRef = useRef<SequenceByPriority>({
    assertive: 0,
    polite: 0,
  });
  const unmountedRef = useRef(false);

  const announce = useCallback<AriaLiveAnnounce>((message, priority = 'polite') => {
    const setAnnouncement =
      priority === 'assertive' ? setAssertiveMessage : setPoliteMessage;
    const sequence = sequenceByPriorityRef.current[priority] + 1;

    sequenceByPriorityRef.current[priority] = sequence;
    setAnnouncement('');
    runInMicrotask(() => {
      if (unmountedRef.current) return;
      if (sequenceByPriorityRef.current[priority] !== sequence) return;
      setAnnouncement(message);
    });
  }, []);

  useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    [],
  );

  const contextValue = useMemo(() => ({ announce }), [announce]);

  const getPortalDestination = useCallback(() => document.body, []);

  return (
    <AriaLiveAnnouncerContext.Provider value={contextValue}>
      {children}
      <Portal getPortalDestination={getPortalDestination} isOpen>
        <VisuallyHidden>
          <span
            aria-atomic='true'
            aria-live='polite'
            data-testid='str-chat__aria-live-region--polite'
            role='status'
          >
            {politeMessage}
          </span>
          <span
            aria-atomic='true'
            aria-live='assertive'
            data-testid='str-chat__aria-live-region--assertive'
            role='alert'
          >
            {assertiveMessage}
          </span>
        </VisuallyHidden>
      </Portal>
    </AriaLiveAnnouncerContext.Provider>
  );
};
