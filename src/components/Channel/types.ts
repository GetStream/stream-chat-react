import {
  Channel,
  MessageResponse,
  ChannelState as ChannelStateFromClient,
} from 'stream-chat';
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
  thread: ReturnType<ChannelStateFromClient['formatMessage']> | null;
  threadMessages: Array<ReturnType<ChannelStateFromClient['formatMessage']>>;
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
      message: ReturnType<ChannelStateFromClient['formatMessage']>;
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
      message: ReturnType<ChannelStateFromClient['formatMessage']>;
    }
  | {
      type: 'startLoadingThread';
    }
  | {
      type: 'loadMoreThreadFinished';
      threadHasMore: boolean;
      threadMessages: Array<
        ReturnType<ChannelStateFromClient['formatMessage']>
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
