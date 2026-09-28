import { useCallback } from 'react';

import { useThreadContext } from '../ThreadContext';
import { useWorkspaceNavigation, useWorkspacePanel } from '../../../context';
import type { WorkspaceNavigationOptions } from '../../../context';

/**
 * Closes the thread in context: releases the slot it occupies and drops the thread's own claim on
 * the client. Components that close a thread (`ThreadHeader`, custom headers) call this rather
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
      // Keeps the thread from staying active when it was opened outside a workspace navigation flow.
      thread?.deactivate();
    },
    [closeThread, panel, thread],
  );
};
