import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { ChatBubble } from './icons';

export type EmptyStateIndicatorProps = {
  /** List Type: channel | message */
  listType?: 'channel' | 'message' | 'thread';
};

const UnMemoizedEmptyStateIndicator = (props: EmptyStateIndicatorProps) => {
  const { listType } = props;

  const { t } = useTranslationContext('EmptyStateIndicator');

  if (listType === 'thread') return null;

  if (listType === 'channel') {
    const text = t<string>('You have no channels currently');
    return (
      <>
        <div className='str-chat__channel-list-empty'>
          <ChatBubble />
          <p role='listitem'>{text}</p>
        </div>
        <p className='str-chat__channel-list-empty-v1' role='listitem'>
          {text}
        </p>
      </>
    );
  }

  if (listType === 'message') {
    const text = t<string>('No chats here yet…');
    return (
      <div className='str-chat__empty-channel'>
        <ChatBubble />
        <p className='str-chat__empty-channel-text' role='listitem'>
          {text}
        </p>
      </div>
    );
  }

  return <p>No items exist</p>;
};

export const EmptyStateIndicator = React.memo(
  UnMemoizedEmptyStateIndicator,
) as typeof UnMemoizedEmptyStateIndicator;
