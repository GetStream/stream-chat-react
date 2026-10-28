import { type ChangeEvent, useCallback, useMemo, useState } from 'react';

import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import type { ScheduleTimeForm } from '../types';
import {
  fromDateAndTimeInputValues,
  getChannelScheduleTimeBounds,
  getDefaultScheduledAt,
  getScheduleTimeError,
  toDateInputValue,
  toTimeInputValue,
} from '../utils';

const readInputValue = ({ target }: ChangeEvent<HTMLInputElement>) => target.value;

export const useScheduleTimeForm = () => {
  const { channel } = useMessageComposerController();

  const [bounds] = useState(() => getChannelScheduleTimeBounds(channel, new Date()));
  const [dateValue, setDateValue] = useState(() =>
    toDateInputValue(getDefaultScheduledAt(bounds)),
  );
  const [timeValue, setTimeValue] = useState(() =>
    toTimeInputValue(getDefaultScheduledAt(bounds)),
  );

  const scheduledAt = useMemo(
    () => fromDateAndTimeInputValues(dateValue, timeValue),
    [dateValue, timeValue],
  );
  const timeError = scheduledAt ? getScheduleTimeError(scheduledAt, bounds) : undefined;

  const onDateChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDateValue(readInputValue(event)),
    [],
  );
  const onTimeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setTimeValue(readInputValue(event)),
    [],
  );

  const scheduleTimeForm: ScheduleTimeForm = {
    bounds,
    dateValue,
    onDateChange,
    onTimeChange,
    scheduledAt,
    timeError,
    timeValue,
  };

  return scheduleTimeForm;
};
