import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Portal } from '../Portal/Portal';
import { VisuallyHidden } from '../VisuallyHidden';
import {
  type AriaLiveAnnounce,
  AriaLiveAnnouncerContext,
  type AriaLivePriority,
} from './useAriaLiveAnnouncer';

export type AriaLiveRegionProps = PropsWithChildren<{
  /**
   * When true, render the live region inline (as a sibling of `children`) instead
   * of portalling it to `document.body`. Use this when the consumer is rendered
   * inside an `aria-modal="true"` dialog, since most assistive technologies
   * suppress live regions outside such a modal subtree.
   */
  inline?: boolean;
}>;

type LiveAnnouncement = {
  id: number;
  message: string;
};

type AnnouncementsByPriority = {
  [key in AriaLivePriority]: LiveAnnouncement[];
};

const LIVE_ANNOUNCEMENT_TTL_MS = 1500;

export const AriaLiveRegion = ({ children, inline = false }: AriaLiveRegionProps) => {
  const [announcementsByPriority, setAnnouncementsByPriority] =
    useState<AnnouncementsByPriority>({
      assertive: [],
      polite: [],
    });
  const nextAnnouncementIdRef = useRef(0);
  const timeoutByAnnouncementIdRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const removeAnnouncement = useCallback((priority: AriaLivePriority, id: number) => {
    setAnnouncementsByPriority((currentAnnouncements) => ({
      ...currentAnnouncements,
      [priority]: currentAnnouncements[priority].filter(
        (announcement) => announcement.id !== id,
      ),
    }));

    const timeout = timeoutByAnnouncementIdRef.current.get(id);
    if (!timeout) return;

    clearTimeout(timeout);
    timeoutByAnnouncementIdRef.current.delete(id);
  }, []);

  const announce = useCallback<AriaLiveAnnounce>(
    (message, priority = 'polite') => {
      const announcementId = nextAnnouncementIdRef.current++;

      setAnnouncementsByPriority((currentAnnouncements) => ({
        ...currentAnnouncements,
        [priority]: [...currentAnnouncements[priority], { id: announcementId, message }],
      }));

      const timeout = setTimeout(() => {
        removeAnnouncement(priority, announcementId);
      }, LIVE_ANNOUNCEMENT_TTL_MS);

      timeoutByAnnouncementIdRef.current.set(announcementId, timeout);
    },
    [removeAnnouncement],
  );

  useEffect(
    () => () => {
      for (const timeout of timeoutByAnnouncementIdRef.current.values()) {
        clearTimeout(timeout);
      }
      timeoutByAnnouncementIdRef.current.clear();
    },
    [],
  );

  const contextValue = useMemo(() => ({ announce }), [announce]);

  const getPortalDestination = useCallback(() => document.body, []);

  const liveRegions = (
    <VisuallyHidden>
      <div
        aria-atomic='false'
        aria-live='polite'
        aria-relevant='additions'
        data-testid='str-chat__aria-live-region--polite'
        role='status'
      >
        {announcementsByPriority.polite.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
      <div
        aria-atomic='false'
        aria-live='assertive'
        aria-relevant='additions'
        data-testid='str-chat__aria-live-region--assertive'
        role='alert'
      >
        {announcementsByPriority.assertive.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
    </VisuallyHidden>
  );

  return (
    <AriaLiveAnnouncerContext.Provider value={contextValue}>
      {children}
      {inline ? (
        liveRegions
      ) : (
        <Portal getPortalDestination={getPortalDestination} isOpen>
          {liveRegions}
        </Portal>
      )}
    </AriaLiveAnnouncerContext.Provider>
  );
};
