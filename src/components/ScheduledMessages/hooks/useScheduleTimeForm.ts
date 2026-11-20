import { type ChangeEvent, useCallback, useMemo, useState } from 'react';

import type { ScheduleTimeForm, ScheduleTimeFormParams } from '../types';
import {
  fromDateAndTimeInputValues,
  getChannelScheduleTimeBounds,
  getDefaultScheduledAt,
  getScheduleTimeError,
  toDateInputValue,
  toTimeInputValue,
} from '../utils';

const readInputValue = ({ target }: ChangeEvent<HTMLInputElement>) => target.value;

export const useScheduleTimeForm = ({
  channel,
  initialScheduledAt,
}: ScheduleTimeFormParams) => {
  const [bounds] = useState(() => getChannelScheduleTimeBounds(channel, new Date()));
  const [initialValue] = useState(
    () => initialScheduledAt ?? getDefaultScheduledAt(bounds),
  );
  const [dateValue, setDateValue] = useState(() => toDateInputValue(initialValue));
  const [timeValue, setTimeValue] = useState(() => toTimeInputValue(initialValue));

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
