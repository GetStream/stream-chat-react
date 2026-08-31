import { convertTimestampToDate } from 'stream-chat';
import React from 'react';

import type { MessageProps } from '../Message';
import { Message } from '../Message';
import { ThreadStart as DefaultThreadStart } from './ThreadStart';

import { useComponentContext } from '../../context';
import { DateSeparator } from '../DateSeparator';

export const ThreadHead = (props: MessageProps) => {
  const { ThreadStart = DefaultThreadStart } = useComponentContext();
  return (
    <div className='str-chat__parent-message-li'>
      <DateSeparator
        date={convertTimestampToDate(props.message.created_at) ?? new Date()}
      />
      <Message initialMessage {...props} />
      <ThreadStart />
    </div>
  );
};
