import { Dispatch, SetStateAction, useState } from 'react';
import type { APIErrorResponse, ErrorFromResponse } from 'stream-chat';

type ChannelQueryType = 'reload' | 'load-more';

export interface ChannelsQueryState {
  error: ErrorFromResponse<APIErrorResponse> | null;
  queryInProgress: ChannelQueryType | null;
  setError: Dispatch<SetStateAction<ErrorFromResponse<APIErrorResponse> | null>>;
  setQueryInProgress: Dispatch<SetStateAction<ChannelQueryType | null>>;
}

export const useChannelsQueryState = (): ChannelsQueryState => {
  const [error, setError] = useState<ErrorFromResponse<APIErrorResponse> | null>(null);
  const [queryInProgress, setQueryInProgress] = useState<ChannelQueryType | null>(null);

  return {
    error,
    queryInProgress,
    setError,
    setQueryInProgress,
  };
};
