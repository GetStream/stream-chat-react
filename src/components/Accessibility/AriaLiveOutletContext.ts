import { createContext, useContext } from 'react';

import type { AriaLivePriority } from './useAriaLiveAnnouncer';

export type LiveAnnouncement = {
  id: number;
  message: string;
};

export type AnnouncementsByPriority = {
  [key in AriaLivePriority]: LiveAnnouncement[];
};

/**
 * Internal coordination context between {@link AriaLiveAnnouncerProvider} (which owns the
 * announcement state and the outlet stack) and the {@link AriaLiveOutlet}s that render the
 * live regions. Not part of the public API — consumers announce via `useAriaLiveAnnouncer`.
 */
export type AriaLiveOutletContextValue = {
  /** The id of the single outlet that should currently render the live regions. */
  activeOutletId: symbol | null;
  /** Current announcements grouped by aria-live priority. */
  announcementsByPriority: AnnouncementsByPriority;
  /** Register an outlet. Higher `layer` wins; ties resolve to the most recently registered. */
  registerOutlet: (id: symbol, layer: number) => void;
  unregisterOutlet: (id: symbol) => void;
};

export const AriaLiveOutletContext = createContext<
  AriaLiveOutletContextValue | undefined
>(undefined);

export const useAriaLiveOutletContext = () => useContext(AriaLiveOutletContext);
