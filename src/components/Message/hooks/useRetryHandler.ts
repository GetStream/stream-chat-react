import { useThreadContext } from '../../Threads';
import { useChannel } from '../../../context';
import type { OperationParams } from 'stream-chat';
import { useCallback } from 'react';

export type RetryHandler = (
  params: Omit<OperationParams<'retry'>, 'message'>,
) => Promise<void>;

export const useRetryHandler = (): RetryHandler => {
  const channel = useChannel();
  const thread = useThreadContext();

  return useCallback(
    async (params: Omit<OperationParams<'retry'>, 'message'>) => {
      await (thread ?? channel).retrySendMessageWithLocalUpdate(params);
    },
    [channel, thread],
  );
};
