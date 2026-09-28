import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

import { useReceiptsByMessageId } from './useReceiptsByMessageId';

type UseLastReadDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

/** Who has read each rendered message — see {@link useReceiptsByMessageId}. */
export const useLastReadData = (
  props: UseLastReadDataParams,
): Record<string, UserResponse[]> => useReceiptsByMessageId({ ...props, kind: 'read' });
