import type { PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type AnnouncementsByPriority,
  AriaLiveOutletContext,
} from './AriaLiveOutletContext';
import {
  type AriaLiveAnnounce,
  AriaLiveAnnouncerContext,
  type AriaLivePriority,
} from './useAriaLiveAnnouncer';

// How long an announcement node stays in the DOM. With `aria-relevant="additions"` a lingering node
// is never re-announced, so a long value only costs a few hidden nodes. It must outlast verbose
// screen-reader speech (e.g. typing echo) that a polite message can be queued behind; ~1.5s drops
// those messages.
const LIVE_ANNOUNCEMENT_TTL_MS = 7000;

type RegisteredOutlet = {
  id: symbol;
  layer: number;
};

/**
 * Owns the aria-live announcement state and the `announce()` API; `Chat` mounts one. It renders no
 * live region itself: the highest-layer registered {@link AriaLiveOutlet} paints the messages.
 * State is per provider instance, so several `Chat` instances on a page never share announcements.
 */
export const AriaLiveAnnouncerProvider = ({ children }: PropsWithChildren) => {
  const [announcementsByPriority, setAnnouncementsByPriority] =
    useState<AnnouncementsByPriority>({
      assertive: [],
      polite: [],
    });
  const nextAnnouncementIdRef = useRef(0);
  const timeoutByAnnouncementIdRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // Pending `delayMs` timers, cleared on unmount.
  const delayTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  // Messages emitted within their `dedupeMs` window (message -> expiry timer); an identical repeat
  // inside the window is suppressed.
  const dedupeTimersByMessageRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // Text last rendered into a live region. Screen readers (notably VoiceOver) skip an update whose
  // text equals the previous one.
  const lastRenderedMessageRef = useRef('');

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

  const emit = useCallback(
    (message: string, priority: AriaLivePriority) => {
      const announcementId = nextAnnouncementIdRef.current++;

      // A repeat gets a trailing zero-width space (U+200B), so consecutive identical messages
      // alternate between `X` and `X` + U+200B and are each voiced.
      const ZERO_WIDTH_SPACE = '\u200B';
      const renderedMessage =
        message === lastRenderedMessageRef.current
          ? `${message}${ZERO_WIDTH_SPACE}`
          : message;
      lastRenderedMessageRef.current = renderedMessage;

      setAnnouncementsByPriority((currentAnnouncements) => ({
        ...currentAnnouncements,
        [priority]: [
          ...currentAnnouncements[priority],
          { id: announcementId, message: renderedMessage },
        ],
      }));

      const timeout = setTimeout(() => {
        removeAnnouncement(priority, announcementId);
      }, LIVE_ANNOUNCEMENT_TTL_MS);

      timeoutByAnnouncementIdRef.current.set(announcementId, timeout);
    },
    [removeAnnouncement],
  );

  const announce = useCallback<AriaLiveAnnounce>(
    (message, options) => {
      const { dedupeMs, delayMs, priority = 'polite' } = options ?? {};

      // The dedupe check runs at emit time, so a delayed announcement cancelled before it fires
      // never opens the window.
      const emitMessage = () => {
        if (dedupeMs) {
          const recent = dedupeTimersByMessageRef.current;
          if (recent.has(message)) return; // Identical message within the window.
          recent.set(
            message,
            setTimeout(() => recent.delete(message), dedupeMs),
          );
        }
        emit(message, priority);
      };

      if (!delayMs) {
        emitMessage();
        return () => undefined;
      }

      const delayTimers = delayTimersRef.current;
      const delayTimer = setTimeout(() => {
        delayTimers.delete(delayTimer);
        emitMessage();
      }, delayMs);
      delayTimers.add(delayTimer);

      return () => {
        clearTimeout(delayTimer);
        delayTimers.delete(delayTimer);
      };
    },
    [emit],
  );

  useEffect(() => {
    const timeoutById = timeoutByAnnouncementIdRef.current;
    const delayTimers = delayTimersRef.current;
    const dedupeTimers = dedupeTimersByMessageRef.current;
    return () => {
      for (const timeout of timeoutById.values()) {
        clearTimeout(timeout);
      }
      timeoutById.clear();
      for (const timeout of delayTimers) {
        clearTimeout(timeout);
      }
      delayTimers.clear();
      for (const timeout of dedupeTimers.values()) {
        clearTimeout(timeout);
      }
      dedupeTimers.clear();
    };
  }, []);

  const [outlets, setOutlets] = useState<RegisteredOutlet[]>([]);

  const registerOutlet = useCallback((id: symbol, layer: number) => {
    setOutlets((currentOutlets) => [...currentOutlets, { id, layer }]);
  }, []);

  const unregisterOutlet = useCallback((id: symbol) => {
    setOutlets((currentOutlets) => currentOutlets.filter((outlet) => outlet.id !== id));
  }, []);

  // Innermost wins: the highest layer, and among equal layers the most recently registered.
  const activeOutlet = useMemo(() => {
    let active: RegisteredOutlet | null = null;
    for (const outlet of outlets) {
      if (!active || outlet.layer >= active.layer) {
        active = outlet;
      }
    }
    return active;
  }, [outlets]);
  const activeOutletId = activeOutlet?.id ?? null;

  // Drops the rendered announcements when the active outlet falls back to a lower layer (a dialog
  // closed): they would re-render into the lower outlet and be voiced again. A higher outlet
  // mounting drops nothing, so an announcement made as a dialog opens still renders in it.
  const previousActiveLayerRef = useRef(activeOutlet?.layer ?? -1);
  useEffect(() => {
    const currentLayer = activeOutlet?.layer ?? -1;
    const previousLayer = previousActiveLayerRef.current;
    previousActiveLayerRef.current = currentLayer;
    if (currentLayer >= previousLayer) return;

    for (const timeout of timeoutByAnnouncementIdRef.current.values()) {
      clearTimeout(timeout);
    }
    timeoutByAnnouncementIdRef.current.clear();
    lastRenderedMessageRef.current = '';
    setAnnouncementsByPriority({ assertive: [], polite: [] });
  }, [activeOutlet]);

  const announcerValue = useMemo(() => ({ announce }), [announce]);
  const outletValue = useMemo(
    () => ({
      activeOutletId,
      announcementsByPriority,
      registerOutlet,
      unregisterOutlet,
    }),
    [activeOutletId, announcementsByPriority, registerOutlet, unregisterOutlet],
  );

  return (
    <AriaLiveAnnouncerContext.Provider value={announcerValue}>
      <AriaLiveOutletContext.Provider value={outletValue}>
        {children}
      </AriaLiveOutletContext.Provider>
    </AriaLiveAnnouncerContext.Provider>
  );
};
