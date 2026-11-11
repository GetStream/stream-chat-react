import { useCallback, useState } from 'react';

import { useIsMounted } from '../../Channel/hooks/useIsMounted';
import type { ScheduleMessageSubmit, SubmitScheduledAt } from '../types';

export const useScheduleTimeSubmit = (
  submitScheduledAt: SubmitScheduledAt,
  onSubmitted: () => void,
) => {
  const isMounted = useIsMounted();

  const [hasFailed, setHasFailed] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const submit = useCallback(
    async (scheduledAt: Date) => {
      setHasFailed(false);
      setIsScheduling(true);

      try {
        await submitScheduledAt(scheduledAt);

        if (isMounted.current) onSubmitted();
      } catch {
        if (isMounted.current) setHasFailed(true);
      } finally {
        if (isMounted.current) setIsScheduling(false);
      }
    },
    [isMounted, onSubmitted, submitScheduledAt],
  );

  const scheduleTimeSubmit: ScheduleMessageSubmit = {
    hasFailed,
    isScheduling,
    submit,
  };

  return scheduleTimeSubmit;
};
