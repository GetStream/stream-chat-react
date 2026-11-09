import { useCallback } from 'react';

import { useThreadContext } from '../ThreadContext';
import { useWorkspaceNavigation, useWorkspacePanel } from '../../../context';
import type { WorkspaceNavigationOptions } from '../../../context';

/**
 * Returns a function that closes the thread in context by releasing the slot it occupies. The
 * thread's activation belongs to whoever activated it (`useActiveThread` releases it on unmount),
 * so closing does not touch it. The calling panel is passed along, so the right one closes when
 * the thread is open in several.
 *
 * @returns Close handler. Its options are merged over `{ panel }` and passed to `closeThread`.
 */
export const useCloseThread = () => {
  const { closeThread } = useWorkspaceNavigation();
  const panel = useWorkspacePanel();
  const thread = useThreadContext();

  return useCallback(
    (options?: WorkspaceNavigationOptions) => {
      closeThread(thread?.id, { panel, ...options });
    },
    [closeThread, panel, thread],
  );
};
