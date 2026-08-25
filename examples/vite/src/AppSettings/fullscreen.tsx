import { createContext, useContext } from 'react';

/**
 * Whether the settings modal fills the viewport.
 *
 * A context rather than a prop because the toggle is rendered by the shared tab header — the one place
 * every tab already routes through — while the state belongs to the modal that resizes. Threading it
 * through `SectionNavigator` and all seven tabs would touch every one of them to move a boolean.
 */
export type FullscreenState = {
  fullscreen: boolean;
  toggleFullscreen: () => void;
};

const FullscreenContext = createContext<FullscreenState | null>(null);

export const FullscreenProvider = FullscreenContext.Provider;

/** `null` when a tab is rendered outside the settings modal, in which case no toggle is shown. */
export const useFullscreen = () => useContext(FullscreenContext);
