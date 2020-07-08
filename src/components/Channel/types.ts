import {
  Channel,
  Message,
  MessageResponse,
  TypingStartEvent,
  Event,
  Member,
  UserResponse,
} from 'stream-chat';
import { ImmutableArray, ImmutableObject } from 'seamless-immutable';
import { Reducer } from 'react';

type UserMap<T> = ImmutableObject<{ [user_id: string]: T }>;

export type ChannelState = {
  error: Error | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  messages: ImmutableArray<MessageResponse>;
  typing: UserMap<ImmutableObject<Event<TypingStartEvent>>>;
  members: UserMap<Member>;
  watchers: UserMap<UserResponse>;
  watcherCount: number;
  read: UserMap<
    ImmutableObject<{
      last_read: string;
      user: UserResponse;
    }>
  >;
  thread: ImmutableObject<MessageResponse> | null;
  threadMessages: ImmutableArray<MessageResponse>;
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
      message: ImmutableObject<MessageResponse>;
    }
  | {
      type: 'loadMoreFinished';
      hasMore: boolean;
      messages: ImmutableArray<MessageResponse>;
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
      message: ImmutableObject<MessageResponse>;
    }
  | {
      type: 'startLoadingThread';
    }
  | {
      type: 'loadMoreThreadFinished';
      threadHasMore: boolean;
      threadMessages: ImmutableArray<MessageResponse>;
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
