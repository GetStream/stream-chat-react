import React from 'react';

import { IconPin } from '../Icons';
import { useTranslationContext } from '../../context';
import type { LocalMessage } from 'stream-chat';

export type PinIndicatorProps = {
  message?: LocalMessage;
};

/**
 * Default pinned message indicator. Renders "Pinned by [name]" with pin icon above the message bubble.
 * Name is taken from message.pinned_by (who pinned).
 */
export const PinIndicator = ({ message }: PinIndicatorProps) => {
  const { t } = useTranslationContext();

  if (!message) return null;

  const name = message.pinned_by?.name ?? message.pinned_by?.id ?? '';

  const label = name ? t('Pinned by {{ name }}', { name }) : t('Message pinned');

  return (
    <div className='str-chat__message-pin-indicator'>
      <div className='str-chat__message-pin-indicator__content'>
        <span aria-hidden className='str-chat__message-pin-indicator__icon'>
          <IconPin />
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
};
