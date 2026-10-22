import { useChannel } from '../../../context';
import { useMessagePaginator } from '../../../hooks';

import type React from 'react';
import { formatMessage, type LocalMessage } from 'stream-chat';
import { useStableCallback } from '../../../utils/useStableCallback';

export type FormData = Record<string, string>;

export type ActionHandlerReturnType = (
  dataOrName?: string | FormData,
  value?: string,
  event?: React.BaseSyntheticEvent,
) => Promise<void> | void;

export const handleActionWarning = `Action handler was called, but it is missing one of its required arguments.
Make sure the hook is used within a Channel and is initialized with a valid message.`;

export function useActionHandler(message?: LocalMessage): ActionHandlerReturnType {
  const channel = useChannel();
  const messagePaginator = useMessagePaginator();

  return useStableCallback(async (dataOrName, value, event) => {
    if (event) event.preventDefault();

    if (!message || !channel) {
      console.warn(handleActionWarning);
      return;
    }

    const messageId = message.id;
    let formData: FormData = {};

    // Deprecated: the separate `name` and `value` arguments. Pass a data object instead.
    if (typeof dataOrName === 'string') {
      formData[dataOrName] = value as string;
    } else {
      formData = { ...dataOrName };
    }

    if (messageId) {
      const data = await channel.sendAction(messageId, formData);

      if (data?.message) {
        messagePaginator.ingestItem(formatMessage(data.message));
      } else {
        messagePaginator.removeItem({ item: message });
      }
    }
  });
}
