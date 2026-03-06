import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { IconBubble2ChatMessage, IconBubbles } from '../Icons';

export type EmptyStateIndicatorProps = {
  /** List Type: channel | message */
  listType?: 'channel' | 'message' | 'thread';
};

const UnMemoizedEmptyStateIndicator = (props: EmptyStateIndicatorProps) => {
  const { listType } = props;

  const { t } = useTranslationContext('EmptyStateIndicator');

  if (listType === 'thread') return null;

  if (listType === 'channel') {
    const text = t('No conversations yet');
    return (
      <div className='str-chat__channel-list-empty'>
        <IconBubbles />
        <p role='listitem'>{text}</p>
      </div>
    );
  }

  if (listType === 'message') {
    const text = t('Send a message to start the conversation');
    return (
      <div className='str-chat__empty-channel'>
        <IconBubble2ChatMessage />
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
