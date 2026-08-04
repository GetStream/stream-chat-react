import type React from 'react';
import type { LocalMessage } from 'stream-chat';

import { useChannel, useWorkspaceNavigation } from '../../../context';
import type { ReactEventHandler } from '../types';

// MERGE-RECONCILE: master's useOpenThreadHandler read `openThread` from the deleted
// ChannelActionContext. Reimplemented over the core WorkspaceNavigation adapter — threads
// open through `useWorkspaceNavigation().openThread` (see MessageRepliesCountButton /
// ThreadListItemUI). Without a slot-layout plugin the adapter falls back to a no-op,
// matching the prior "missing handler" guard.
export const useOpenThreadHandler = (
  message?: LocalMessage,
  customOpenThread?: (message: LocalMessage, event: React.BaseSyntheticEvent) => void,
): ReactEventHandler => {
  const channel = useChannel();
  const { openThread } = useWorkspaceNavigation();

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

    void openThread({ channel, message });
  };
};
