import { useMemo } from 'react';

import { useThreadContext } from '../../Threads/ThreadContext';

import type { NotificationTargetPanel } from '../notificationOrigin';

export type UseNotificationTargetOptions = {
  /**
   * Explicitly set target panel. When provided, context-based detection is skipped.
   */
  target?: NotificationTargetPanel;
  /**
   * Fallback panel when no context-based target can be inferred.
   */
  fallbackTarget?: NotificationTargetPanel;
};

/**
 * Resolves the panel target where notifications emitted by the current component should be displayed.
 */
export const useNotificationTarget = (
  options?: UseNotificationTargetOptions,
): NotificationTargetPanel => {
  const thread = useThreadContext();

  return useMemo(() => {
    if (options?.target) return options.target;
    if (thread) return 'thread';
    return options?.fallbackTarget ?? 'channel';
  }, [options?.fallbackTarget, options?.target, thread]);
};
