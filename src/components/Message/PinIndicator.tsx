import React from 'react';

import {
  useChatContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import type { LocalMessage } from 'stream-chat';

export type PinIndicatorProps = {
  message?: LocalMessage;
};

/**
 * Default pinned-message indicator: a pin icon with "Pinned by You", "Pinned by <name>" (from
 * `message.pinned_by`), or "Message pinned" when the pinner is unknown.
 */
export const PinIndicator = ({ message }: PinIndicatorProps) => {
  const { IconPin } = useComponentContextIcons();
  const { t } = useTranslationContext();
  const { client } = useChatContext();

  if (!message) return null;

  const isOwnPin = !!message.pinned_by?.id && message.pinned_by.id === client.user?.id;
  const name = message.pinned_by?.name ?? message.pinned_by?.id ?? '';

  const label = isOwnPin
    ? t('message.pinIndicator.pinned.label', 'Pinned by You')
    : name
      ? t('message.pinIndicator.pinned.withName.label', 'Pinned by {{ name }}', { name })
      : t('common.messagePinned.label', 'Message pinned');

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
