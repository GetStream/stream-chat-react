import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

import { useReceiptsByMessageId } from './useReceiptsByMessageId';

type UseLastDeliveredDataParams = {
  channel: Channel;
  messages: LocalMessage[];
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

/** Who has received each rendered message — see {@link useReceiptsByMessageId}. */
export const useLastDeliveredData = (
  props: UseLastDeliveredDataParams,
): Record<string, UserResponse[]> =>
  useReceiptsByMessageId({ ...props, kind: 'delivered' });
