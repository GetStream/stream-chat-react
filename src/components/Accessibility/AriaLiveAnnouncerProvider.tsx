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

// How long an announcement node stays in the DOM before cleanup. This is NOT how long the
// message is "valid" — with `aria-relevant="additions"` a lingering node is never re-announced;
// the only cost of a longer value is a few extra (visually hidden) nodes transiently. It must be
// long enough that a polite message queued BEHIND verbose screen-reader speech (e.g. the typing
// echo + a focused-field re-announcement) is still present when the reader reaches it — a short
// window (~1.5s) drops those. 7s comfortably covers that.
const LIVE_ANNOUNCEMENT_TTL_MS = 7000;

type RegisteredOutlet = {
  id: symbol;
  layer: number;
};

/**
 * Owns the aria-live announcement state and the announce() API for one logical announcer
 * (mount ONE per `Chat`). It renders no DOM region itself — the messages are painted by the
 * single active {@link AriaLiveOutlet} chosen from the registered outlet stack (innermost /
 * highest-layer wins). This is the L1 sink of the unified announcer model; see
 * `specs/a11y-react-web/decisions.md` → "Unify the aria-live announcer implementations".
 *
 * All state lives here (per provider instance), never in module scope, so multiple `Chat`
 * instances on one page never share announcements.
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
  // The exact text last rendered into a live region. Screen readers (notably VoiceOver)
  // suppress a live-region update whose text is identical to the previous one, so repeated
  // identical announcements (e.g. shuffling a Giphy, whose description is the constant search
  // term) would be voiced only once. We alternate a trailing zero-width space to force a
  // detectable change — see `announce`.
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

  const announce = useCallback<AriaLiveAnnounce>(
    (message, priority = 'polite') => {
      const announcementId = nextAnnouncementIdRef.current++;

      // Append a (silent) zero-width space (U+200B) when the text would repeat the previous
      // render, so consecutive identical announcements still differ and are re-voiced. Because
      // it only appends when equal to the last render, the rendered text alternates between
      // `X` and `X` + U+200B, guaranteeing every update is a change the screen reader speaks.
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

  useEffect(() => {
    const timeoutById = timeoutByAnnouncementIdRef.current;
    return () => {
      for (const timeout of timeoutById.values()) {
        clearTimeout(timeout);
      }
      timeoutById.clear();
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
  const activeOutletId = useMemo(() => {
    let active: RegisteredOutlet | null = null;
    for (const outlet of outlets) {
      if (!active || outlet.layer >= active.layer) {
        active = outlet;
      }
    }
    return active?.id ?? null;
  }, [outlets]);

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
