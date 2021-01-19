import {
  Channel,
  MessageResponse,
  ChannelState as ChannelStateFromClient,
} from 'stream-chat';
import { ImmutableArray } from 'seamless-immutable';
import { Reducer } from 'react';

export type ChannelState = {
  error: Error | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  messages: ChannelStateFromClient['messages'];
  pinnedMessages: ChannelStateFromClient['pinnedMessages'];
  typing: ChannelStateFromClient['typing'];
  members: ChannelStateFromClient['members'];
  watchers: ChannelStateFromClient['watchers'];
  watcherCount: number;
  read: ChannelStateFromClient['read'];
  thread: ReturnType<ChannelStateFromClient['messageToImmutable']> | null;
  threadMessages: ImmutableArray<
    ReturnType<ChannelStateFromClient['messageToImmutable']>
  >;
  threadLoadingMore: boolean;
  threadHasMore: boolean;
};

type ChannelAction<T> = {
  type: T;
  channel: Channel;
};

export type ChannelStateReducerAction =
  | ChannelAction<'initStateFromChannel'>
  | ChannelAction<'copyStateFromChannelOnEvent'>
  | {
      type: 'setThread';
      message: ReturnType<ChannelStateFromClient['messageToImmutable']>;
    }
  | {
      type: 'loadMoreFinished';
      hasMore: boolean;
      messages: ChannelStateFromClient['messages'];
    }
  | {
      type: 'setLoadingMore';
      loadingMore: boolean;
    }
  | {
      type: 'copyMessagesFromChannel';
      channel: Channel;
      parentId: string;
    }
  | {
      type: 'updateThreadOnEvent';
      channel: Channel;
      message: MessageResponse;
    }
  | {
      type: 'openThread';
      channel: Channel;
      message: ReturnType<ChannelStateFromClient['messageToImmutable']>;
    }
  | {
      type: 'startLoadingThread';
    }
  | {
      type: 'loadMoreThreadFinished';
      threadHasMore: boolean;
      threadMessages: ImmutableArray<
        ReturnType<ChannelStateFromClient['messageToImmutable']>
      >;
    }
  | {
      type: 'closeThread';
    }
  | {
      type: 'setError';
      error: Error;
    };

export type ChannelStateReducer = Reducer<
  ChannelState,
  ChannelStateReducerAction
>;
