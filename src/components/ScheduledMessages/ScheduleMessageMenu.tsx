import React, { useCallback } from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { ContextMenuButton, useContextMenuContext } from '../Dialog';
import { ScheduleMessagePresetButton } from './ScheduleMessagePresetButton';
import type { ScheduleMessageMenuProps } from './types';

export const ScheduleMessageMenu = ({
  onCustomTimeSelect,
  onPresetSelect,
  presets,
}: ScheduleMessageMenuProps) => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();
  const { closeMenu } = useContextMenuContext();

  const selectPreset = useCallback(
    (scheduledAt: Date) => {
      closeMenu();
      onPresetSelect(scheduledAt);
    },
    [closeMenu, onPresetSelect],
  );

  const selectCustomTime = useCallback(() => {
    closeMenu();
    onCustomTimeSelect();
  }, [closeMenu, onCustomTimeSelect]);

  return (
    <>
      {presets.map((scheduledAt) => (
        <ScheduleMessagePresetButton
          key={scheduledAt.getTime()}
          onSelect={selectPreset}
          scheduledAt={scheduledAt}
        />
      ))}
      <div className='str-chat__schedule-message-menu__separator' role='separator' />
      <ContextMenuButton
        aria-haspopup='dialog'
        className='str-chat__schedule-message-menu__custom-time'
        hasSubMenu
        Icon={IconClock}
        onClick={selectCustomTime}
      >
        {t('Custom time')}
      </ContextMenuButton>
    </>
  );
};
