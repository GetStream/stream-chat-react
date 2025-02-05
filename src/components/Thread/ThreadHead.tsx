import React from 'react';

import { Message, MessageProps } from '../Message';
import { ThreadStart as DefaultThreadStart } from './ThreadStart';

import { useComponentContext } from '../../context';

export const ThreadHead = (props: MessageProps) => {
  const { ThreadStart = DefaultThreadStart } = useComponentContext('ThreadHead');
  return (
    <div className='str-chat__parent-message-li'>
      <Message initialMessage threadList {...props} />
      <ThreadStart />
    </div>
  );
};
