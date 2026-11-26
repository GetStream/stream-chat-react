import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { TextInput } from '../Form';
import type { ScheduleDateInputProps } from './ScheduleTimeDialog';
import { fromInputValues } from './utils';

export const ScheduleDateInput = ({
  label,
  max,
  min,
  onChange,
  value,
}: ScheduleDateInputProps) => {
  const { t } = useTranslationContext();
  const { IconCalendar, IconCaretDown } = useComponentContextIcons();

  const selectedDate = fromInputValues(value);

  return (
    <TextInput
      className='str-chat__schedule-message-dialog__date'
      label={label}
      leading={
        <>
          <IconCalendar />
          <span aria-hidden className='str-chat__schedule-message-dialog__date-value'>
            {selectedDate && t('timestamp.ScheduleDate', { timestamp: selectedDate })}
          </span>
        </>
      }
      max={max}
      min={min}
      onChange={({ target }) => onChange(target.value)}
      required
      trailing={<IconCaretDown />}
      type='date'
      value={value}
    />
  );
};
