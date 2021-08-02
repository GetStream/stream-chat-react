import React from 'react';

import type { EmptyStateIndicatorProps } from 'stream-chat-react';

import './SocialEmptyStateIndicator.scss';

export const SocialEmptyStateIndicator: React.FC<EmptyStateIndicatorProps> = (props) => {
  const { listType } = props;

  if (listType === 'channel') {
    return <div className='empty-state-indicator'>No channels.</div>;
  }

  if (listType === 'message') return null;

  return <div className='empty-state-indicator'>No items exist.</div>;
};
