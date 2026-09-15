import { useCallback } from 'react';

import { useThreadContext } from '../ThreadContext';
import { useWorkspaceNavigation } from '../../../context';

/**
 * Closes the thread in context: releases the slot it occupies and drops the thread's own claim on
 * the client. Components that close a thread (`ThreadHeader`, custom headers) call this rather
 * than receiving a handler, so they work wherever a `ThreadProvider` is in scope.
 */
export const useCloseThread = () => {
  const { closeThread } = useWorkspaceNavigation();
  const thread = useThreadContext();

  return useCallback(() => {
    closeThread(thread?.id);
    // Keeps the thread from staying active when it was opened outside a workspace navigation flow.
    thread?.deactivate();
  }, [closeThread, thread]);
};
