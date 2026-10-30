import { useCallback, useSyncExternalStore } from 'react';
import type { DeriveWorkspaceNavigation } from 'stream-chat-react/slot-layout';

const wideWindow = window.matchMedia('(min-width: 1200px)');

const subscribeToWidth = (onChange: () => void) => {
  wideWindow.addEventListener('change', onChange);
  return () => wideWindow.removeEventListener('change', onChange);
};

const isWindowWide = () => wideWindow.matches;

export const useOpenBesideOnWideWindows = (): DeriveWorkspaceNavigation => {
  const isWide = useSyncExternalStore(subscribeToWidth, isWindowWide);

  // A new function only when the window crosses 1200px.
  return useCallback<DeriveWorkspaceNavigation>(
    (base) => ({
      openChannel: (channel, options) =>
        base.openChannel(channel, {
          ...options,
          additive:
            options?.additive ??
            (isWide && !!(options?.event?.metaKey || options?.event?.ctrlKey)),
        }),
    }),
    [isWide],
  );
};
