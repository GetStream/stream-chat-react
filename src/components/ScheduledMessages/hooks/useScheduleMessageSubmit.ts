import { useScheduleMessage } from './useScheduleMessage';
import { useScheduleTimeSubmit } from './useScheduleTimeSubmit';

export const useScheduleMessageSubmit = (onScheduled: () => void) => {
  const scheduleMessage = useScheduleMessage();

  const scheduleMessageSubmit = useScheduleTimeSubmit(scheduleMessage, onScheduled);

  return scheduleMessageSubmit;
};
