import type React from 'react';
import type { LocalMessage } from 'stream-chat';

import { useChannel, useWorkspaceNavigation } from '../../../context';
import type { ReactEventHandler } from '../types';

/**
 * Opens the message's thread through `useWorkspaceNavigation().openThread`, which does nothing
 * without a workspace navigation provider.
 *
 * @param message - Message whose thread opens. Logs a warning and does nothing when undefined.
 * @param customOpenThread - Called instead of the default navigation.
 */
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
