import { useCallback, useState } from 'react';

import { useIsMounted } from '../../Channel/hooks/useIsMounted';
import type { ScheduleMessageSubmit } from '../types';
import { useScheduleMessage } from './useScheduleMessage';

export const useScheduleMessageSubmit = (onScheduled: () => void) => {
  const scheduleMessage = useScheduleMessage();
  const isMounted = useIsMounted();

  const [hasFailed, setHasFailed] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const submit = useCallback(
    async (scheduledAt: Date) => {
      setHasFailed(false);
      setIsScheduling(true);

      try {
        await scheduleMessage(scheduledAt);

        if (isMounted.current) onScheduled();
      } catch {
        if (isMounted.current) setHasFailed(true);
      } finally {
        if (isMounted.current) setIsScheduling(false);
      }
    },
    [isMounted, onScheduled, scheduleMessage],
  );

  const scheduleMessageSubmit: ScheduleMessageSubmit = {
    hasFailed,
    isScheduling,
    submit,
  };

  return scheduleMessageSubmit;
};
