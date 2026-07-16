import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import type { APIError, StreamAPIError } from 'stream-chat';

type ChannelQueryState =
  | 'uninitialized' // the initial state before the first channels query is triggered
  | 'reload' // the initial channels query (loading the first page) is in progress
  | 'load-more' // loading the next page of channels
  | null; // at least one channels page has been loaded and there is no query in progress at the moment

export interface ChannelsQueryState {
  error: StreamAPIError<APIError> | null;
  queryInProgress: ChannelQueryState;
  setError: Dispatch<SetStateAction<StreamAPIError<APIError> | null>>;
  setQueryInProgress: Dispatch<SetStateAction<ChannelQueryState>>;
}

export const useChannelsQueryState = (): ChannelsQueryState => {
  const [error, setError] = useState<StreamAPIError<APIError> | null>(null);
  const [queryInProgress, setQueryInProgress] =
    useState<ChannelQueryState>('uninitialized');

  return {
    error,
    queryInProgress,
    setError,
    setQueryInProgress,
  };
};
