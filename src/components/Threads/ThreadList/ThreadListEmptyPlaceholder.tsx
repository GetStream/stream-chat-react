import React from 'react';
import { Icon } from '../icons';

export const ThreadListEmptyPlaceholder = () => (
  <div className='str-chat__thread-list-empty-placeholder'>
    <Icon.MessageBubble />
    {/* TODO: translate */}
    No threads here yet...
  </div>
);
