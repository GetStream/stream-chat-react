import React from 'react';

import { useComponentContextIcons } from '../../context';
import { TextInput } from '../Form';
import type { ScheduleTimeInputProps } from './ScheduleTimeDialog';

export const ScheduleTimeInput = ({ label, onChange, value }: ScheduleTimeInputProps) => {
  const { IconCaretDown, IconClock } = useComponentContextIcons();

  return (
    <TextInput
      className='str-chat__schedule-message-dialog__time'
      label={label}
      leading={<IconClock />}
      onChange={({ target }) => onChange(target.value)}
      required
      trailing={<IconCaretDown />}
      type='time'
      value={value}
    />
  );
};
