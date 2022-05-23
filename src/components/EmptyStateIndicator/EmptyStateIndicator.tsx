import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { ChatBubble } from './icons';

export type EmptyStateIndicatorProps = {
  /** List Type: channel | message */
  listType?: 'channel' | 'message';
};

const UnMemoizedEmptyStateIndicator = (props: EmptyStateIndicatorProps) => {
  const { listType } = props;

  const { t } = useTranslationContext('EmptyStateIndicator');

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

  if (listType === 'message') return null;

  return <p>No items exist</p>;
};

export const EmptyStateIndicator = React.memo(
  UnMemoizedEmptyStateIndicator,
) as typeof UnMemoizedEmptyStateIndicator;
