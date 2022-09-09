import React from 'react';

import { Message, MessageProps } from '../Message';
import { ThreadStart as DefaultThreadStart } from './ThreadStart';

import { useComponentContext } from '../../context';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const ThreadHead = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageProps<StreamChatGenerics>,
) => {
  const { ThreadStart = DefaultThreadStart } = useComponentContext<StreamChatGenerics>(
    'ThreadHead',
  );
  return (
    <div className='str-chat__parent-message-li'>
      <Message initialMessage threadList {...props} />
      <ThreadStart />
    </div>
  );
};
