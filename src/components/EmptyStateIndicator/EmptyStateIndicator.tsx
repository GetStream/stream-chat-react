import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { IconMessageBubble, IconMessageBubbles } from '../Icons';

export type EmptyStateIndicatorProps = {
  /** List Type: channel | message */
  listType?: 'channel' | 'message' | 'thread';
  messageText?: string;
};

const UnMemoizedEmptyStateIndicator = (props: EmptyStateIndicatorProps) => {
  const { listType, messageText } = props;

  const { t } = useTranslationContext('EmptyStateIndicator');

  if (listType === 'thread') return null;

  if (listType === 'channel') {
    const text = t('No conversations yet');
    return (
      <div className='str-chat__channel-list-empty'>
        <IconMessageBubbles />
        <p role='listitem'>{text}</p>
      </div>
    );
  }

  if (listType === 'message') {
    const text = t(messageText || 'Send a message to start the conversation');
    return (
      <div className='str-chat__empty-channel'>
        <IconMessageBubble />
        <p className='str-chat__empty-channel-text' role='listitem'>
          {text}
        </p>
      </div>
    );
  }

  return <p>{t('No items exist')}</p>;
};

export const EmptyStateIndicator = React.memo(
  UnMemoizedEmptyStateIndicator,
) as typeof UnMemoizedEmptyStateIndicator;
