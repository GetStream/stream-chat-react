import React, { useCallback } from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { ContextMenuButton } from '../Dialog';
import type { ScheduleMessagePresetButtonProps } from './types';

export const ScheduleMessagePresetButton = ({
  onSelect,
  scheduledAt,
}: ScheduleMessagePresetButtonProps) => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();

  const selectPreset = useCallback(() => onSelect(scheduledAt), [onSelect, scheduledAt]);

  return (
    <ContextMenuButton
      className='str-chat__schedule-message-menu__preset'
      Icon={IconClock}
      onClick={selectPreset}
    >
      {t('timestamp/ScheduledMessage', { timestamp: scheduledAt })}
    </ContextMenuButton>
  );
};
