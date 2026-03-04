import { useThreadContext } from '../../Threads';
import { useChannel } from '../../../context';
import type { RetrySendMessageWithLocalUpdateParams } from 'stream-chat';
import { useCallback } from 'react';

export type RetryHandler = (
  params: RetrySendMessageWithLocalUpdateParams,
) => Promise<void>;

// todo: rename the hook to follow the pattern useSendMessageFn
export const useRetryHandler = (): RetryHandler => {
  const channel = useChannel();
  const thread = useThreadContext();

  return useCallback(
    async (params: RetrySendMessageWithLocalUpdateParams) => {
      await (thread ?? channel).retrySendMessageWithLocalUpdate(params);
    },
    [channel, thread],
  );
};
