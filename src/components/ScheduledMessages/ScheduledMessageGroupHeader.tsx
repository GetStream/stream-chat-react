import React from 'react';

import { useTranslationContext } from '../../context';
import { ScheduledMessageGroupType } from './constants';
import type { ScheduledMessageGroupHeaderProps } from './types';

export const ScheduledMessageGroupHeader = ({
  group,
}: ScheduledMessageGroupHeaderProps) => {
  const { t } = useTranslationContext();

  const { day, type } = group;

  const title =
    type === ScheduledMessageGroupType.Failed
      ? t('Failed')
      : t('timestamp/ScheduledMessageGroup', { timestamp: day });

  return <h3 className='str-chat__scheduled-message-group__header'>{title}</h3>;
};
