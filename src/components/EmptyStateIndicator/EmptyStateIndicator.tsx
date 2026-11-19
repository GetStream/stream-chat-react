import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { useComponentContextIcons } from '../../context';
import { asDynamicKey } from '../../i18n/utils';

export type EmptyStateIndicatorProps = {
  /** Which list is empty. A 'thread' list renders nothing. */
  listType?: 'channel' | 'message' | 'scheduled-message' | 'thread';
  messageText?: string;
};

const UnMemoizedEmptyStateIndicator = (props: EmptyStateIndicatorProps) => {
  const { listType, messageText } = props;

  const { t } = useTranslationContext();
  const { IconClock, IconMessageBubble, IconMessageBubbles } = useComponentContextIcons();

  if (listType === 'thread') return null;

  if (listType === 'channel') {
    const text = t(
      'emptyState.indicator.noConversationsYet.label',
      'No conversations yet',
    );
    return (
      <div className='str-chat__channel-list-empty'>
        <IconMessageBubbles />
        <p role='listitem'>{text}</p>
      </div>
    );
  }

  if (listType === 'message') {
    // `messageText` is integrator-supplied and may be a translation key, so it goes through `t`
    // as-is; only the built-in default has a key and inline copy.
    const text = messageText
      ? t(asDynamicKey(messageText))
      : t(
          'emptyState.indicator.startConversation.label',
          'Send a message to start the conversation',
        );
    return (
      <div className='str-chat__empty-channel'>
        <IconMessageBubble />
        <p className='str-chat__empty-channel-text' role='listitem'>
          {text}
        </p>
      </div>
    );
  }

  if (listType === 'scheduled-message') {
    return (
      <div className='str-chat__scheduled-messages-empty-list'>
        <IconClock className='str-chat__scheduled-messages-empty-list__icon' />
        <p className='str-chat__scheduled-messages-empty-list__title'>
          {t('scheduledMessages.noScheduledMessages', 'No scheduled messages')}
        </p>
        <p className='str-chat__scheduled-messages-empty-list__description'>
          {t(
            'scheduledMessages.clickTheArrowNextToTheSendButton',
            'Click the arrow next to the send button in a channel to schedule a message.',
          )}
        </p>
      </div>
    );
  }

  return <p>{t('emptyState.indicator.noItemsExist.text', 'No items exist')}</p>;
};

export const EmptyStateIndicator = React.memo(
  UnMemoizedEmptyStateIndicator,
) as typeof UnMemoizedEmptyStateIndicator;
