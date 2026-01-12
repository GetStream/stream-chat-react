import { useThreadContext } from '../../Threads';
import { useChannelStateContext } from '../../../context';
import type { RetrySendMessageWithLocalUpdateParams } from 'stream-chat';
import { useCallback } from 'react';

export type RetryHandler = (
  params: RetrySendMessageWithLocalUpdateParams,
) => Promise<void>;

export const useRetryHandler = (): RetryHandler => {
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();

  return useCallback(
    async (params: RetrySendMessageWithLocalUpdateParams) => {
      await (thread ?? channel).retrySendMessageWithLocalUpdate(params);
    },
    [channel, thread],
  );
};
