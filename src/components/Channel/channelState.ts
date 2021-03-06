import type { Reducer } from 'react';
import type {
  Channel,
  MessageResponse,
  ChannelState as StreamChannelState,
} from 'stream-chat';

import type { ChannelState, StreamMessage } from '../../context/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type ChannelStateReducerAction<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> =
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'initStateFromChannel';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'copyStateFromChannelOnEvent';
    }
  | {
      message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'setThread';
    }
  | {
      hasMore: boolean;
      messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
      type: 'loadMoreFinished';
    }
  | {
      loadingMore: boolean;
      type: 'setLoadingMore';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'copyMessagesFromChannel';
      parentId?: string | null;
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      message: MessageResponse<At, Ch, Co, Me, Re, Us>;
      type: 'updateThreadOnEvent';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'openThread';
    }
  | {
      type: 'startLoadingThread';
    }
  | {
      threadHasMore: boolean;
      threadMessages: Array<
        ReturnType<
          StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']
        >
      >;
      type: 'loadMoreThreadFinished';
    }
  | {
      type: 'closeThread';
    }
  | {
      error: Error;
      type: 'setError';
    };

export type ChannelStateReducer<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Reducer<
  ChannelState<At, Ch, Co, Ev, Me, Re, Us>,
  ChannelStateReducerAction<At, Ch, Co, Ev, Me, Re, Us>
>;

export const channelReducer = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  state: ChannelState<At, Ch, Co, Ev, Me, Re, Us>,
  action: ChannelStateReducerAction<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  switch (action.type) {
    case 'initStateFromChannel': {
      const { channel } = action;
      return {
        ...state,
        loading: false,
        members: { ...channel.state.members },
        messages: [...channel.state.messages],
        pinnedMessages: [...channel.state.pinnedMessages],
        read: { ...channel.state.read },
        watcherCount: channel.state.watcher_count,
        watchers: { ...channel.state.watchers },
      };
    }

    case 'copyStateFromChannelOnEvent': {
      const { channel } = action;
      return {
        ...state,
        members: { ...channel.state.members },
        messages: [...channel.state.messages],
        pinnedMessages: [...channel.state.pinnedMessages],
        read: { ...channel.state.read },
        typing: { ...channel.state.typing },
        watcherCount: channel.state.watcher_count,
        watchers: { ...channel.state.watchers },
      };
    }

    case 'setThread': {
      const { message } = action;
      return { ...state, thread: message };
    }

    case 'loadMoreFinished': {
      const { hasMore, messages } = action;
      return {
        ...state,
        hasMore,
        loadingMore: false,
        messages,
      };
    }

    case 'setLoadingMore': {
      const { loadingMore } = action;
      return { ...state, loadingMore };
    }

    case 'copyMessagesFromChannel': {
      const { channel, parentId } = action;
      return {
        ...state,
        messages: [...channel.state.messages],
        pinnedMessages: [...channel.state.pinnedMessages],
        threadMessages: parentId
          ? { ...channel.state.threads }[parentId] || []
          : state.threadMessages,
      };
    }

    case 'updateThreadOnEvent': {
      const { channel, message } = action;
      if (!state.thread) return state;
      return {
        ...state,
        thread:
          message?.id === state.thread.id
            ? channel.state.formatMessage(message)
            : state.thread,
        threadMessages: state.thread?.id
          ? { ...channel.state.threads }[state.thread.id] || []
          : [],
      };
    }

    case 'openThread': {
      const { channel, message } = action;
      return {
        ...state,
        thread: message,
        threadMessages: message.id
          ? { ...channel.state.threads }[message.id] || []
          : [],
      };
    }

    case 'startLoadingThread': {
      return {
        ...state,
        threadLoadingMore: true,
      };
    }

    case 'loadMoreThreadFinished': {
      const { threadHasMore, threadMessages } = action;
      return {
        ...state,
        threadHasMore,
        threadLoadingMore: false,
        threadMessages,
      };
    }

    case 'closeThread': {
      return {
        ...state,
        thread: null,
        threadLoadingMore: false,
        threadMessages: [],
      };
    }

    case 'setError': {
      const { error } = action;
      return { ...state, error };
    }
    default:
      return state;
  }
};

export const initialState = {
  error: null,
  hasMore: true,
  loading: true,
  loadingMore: false,
  members: {},
  messages: [],
  pinnedMessages: [],
  read: {},
  thread: null,
  threadHasMore: true,
  threadLoadingMore: false,
  threadMessages: [],
  typing: {},
  watcherCount: 0,
  watchers: {},
};
