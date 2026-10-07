import { useCallback } from 'react';

import { useThreadContext } from '../ThreadContext';
import { useWorkspaceNavigation, useWorkspacePanel } from '../../../context';
import type { WorkspaceNavigationOptions } from '../../../context';

/**
 * Closes the thread in context: releases the slot it occupies. The thread's activation belongs to
 * whoever activated it (`useActiveThread` releases it when the panel unmounts), so closing doesn't
 * touch it. Components that close a thread (`ThreadHeader`, custom headers) call this rather
 * than receiving a handler, so they work wherever a `ThreadProvider` is in scope. The panel the
 * caller renders in is passed along, so the right one closes when the thread is open in several.
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
