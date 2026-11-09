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
 * Coordination between {@link AriaLiveAnnouncerProvider}, which owns the announcements and the
 * outlet stack, and the {@link AriaLiveOutlet}s that render them. Internal: consumers announce
 * through `useAriaLiveAnnouncer`.
 */
export type AriaLiveOutletContextValue = {
  /** ID of the outlet that currently renders the live regions. */
  activeOutletId: symbol | null;
  /** Current announcements by aria-live priority. */
  announcementsByPriority: AnnouncementsByPriority;
  /** Registers an outlet. The higher `layer` wins; ties go to the most recently registered. */
  registerOutlet: (id: symbol, layer: number) => void;
  unregisterOutlet: (id: symbol) => void;
};

export const AriaLiveOutletContext = createContext<
  AriaLiveOutletContextValue | undefined
>(undefined);

export const useAriaLiveOutletContext = () => useContext(AriaLiveOutletContext);
