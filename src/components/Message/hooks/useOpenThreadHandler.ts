import type React from 'react';
import type { LocalMessage } from 'stream-chat';

import { useChannel, useChatContext } from '../../../context';
import {
  createThreadEntityBinding,
  useChatViewNavigation,
} from '../../ChatView/ChatViewNavigationContext';
import type { ReactEventHandler } from '../types';

// MERGE-RECONCILE: master's useOpenThreadHandler read `openThread` from the deleted
// ChannelActionContext. Reimplemented over PR #2909's ChatView navigation — threads
// open through the generic `useChatViewNavigation().open` with a thread binding
// (see MessageRepliesCountButton / ThreadListItemUI). Outside a ChatView provider the
// navigation context falls back to a no-op, matching the prior "missing handler" guard.
export const useOpenThreadHandler = (
  message?: LocalMessage,
  customOpenThread?: (message: LocalMessage, event: React.BaseSyntheticEvent) => void,
): ReactEventHandler => {
  const channel = useChannel();
  const { client } = useChatContext();
  const { open } = useChatViewNavigation();

  return (event) => {
    if (!message) {
      console.warn(
        'Open thread handler was called but it is missing one of its parameters',
      );
      return;
    }

    if (customOpenThread) {
      customOpenThread(message, event);
      return;
    }

    void open(createThreadEntityBinding(client, { channel, message }));
  };
};
