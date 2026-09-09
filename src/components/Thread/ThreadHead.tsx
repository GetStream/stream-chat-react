import { convertTimestampToDate } from 'stream-chat';
import React from 'react';

import type { MessageProps } from '../Message';
import { Message } from '../Message';
import { ThreadStart as DefaultThreadStart } from './ThreadStart';

import { useComponentContext } from '../../context';
import { DateSeparator } from '../DateSeparator';

export const ThreadHead = (props: MessageProps) => {
  const { ThreadStart = DefaultThreadStart } = useComponentContext();
  const parentCreatedAt = convertTimestampToDate(props.message.created_at);
  return (
    <div className='str-chat__parent-message-li'>
      {parentCreatedAt ? <DateSeparator date={parentCreatedAt} /> : null}
      <Message initialMessage {...props} />
      <ThreadStart />
    </div>
  );
};
