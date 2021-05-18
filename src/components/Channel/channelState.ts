import type { Reducer } from 'react';
import type { Channel, MessageResponse, ChannelState as StreamChannelState } from 'stream-chat';

import type { ChannelState, StreamMessage } from '../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ChannelStateReducerAction<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> =
  | {
      type: 'closeThread';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'copyMessagesFromChannel';
      parentId?: string | null;
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'copyStateFromChannelOnEvent';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'initStateFromChannel';
    }
  | {
      hasMore: boolean;
      messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
      type: 'loadMoreFinished';
    }
  | {
      threadHasMore: boolean;
      threadMessages: Array<
        ReturnType<StreamChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']>
      >;
      type: 'loadMoreThreadFinished';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'openThread';
    }
  | {
      error: Error;
      type: 'setError';
    }
  | {
      loadingMore: boolean;
      type: 'setLoadingMore';
    }
  | {
      message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'setThread';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      type: 'setTyping';
    }
  | {
      type: 'startLoadingThread';
    }
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      message: MessageResponse<At, Ch, Co, Me, Re, Us>;
      type: 'updateThreadOnEvent';
    };

export type ChannelStateReducer<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Reducer<
  ChannelState<At, Ch, Co, Ev, Me, Re, Us>,
  ChannelStateReducerAction<At, Ch, Co, Ev, Me, Re, Us>
>;

export const channelReducer = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  state: ChannelState<At, Ch, Co, Ev, Me, Re, Us>,
  action: ChannelStateReducerAction<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  switch (action.type) {
    case 'closeThread': {
      return {
        ...state,
        thread: null,
        threadLoadingMore: false,
        threadMessages: [],
      };
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

    case 'copyStateFromChannelOnEvent': {
      const { channel } = action;
      return {
        ...state,
        members: { ...channel.state.members },
        messages: [...channel.state.messages],
        pinnedMessages: [...channel.state.pinnedMessages],
        read: { ...channel.state.read },
        watcherCount: channel.state.watcher_count,
        watchers: { ...channel.state.watchers },
      };
    }

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

    case 'loadMoreFinished': {
      const { hasMore, messages } = action;
      return {
        ...state,
        hasMore,
        loadingMore: false,
        messages,
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

    case 'openThread': {
      const { channel, message } = action;
      return {
        ...state,
        thread: message,
        threadMessages: message.id ? { ...channel.state.threads }[message.id] || [] : [],
      };
    }

    case 'setError': {
      const { error } = action;
      return { ...state, error };
    }

    case 'setLoadingMore': {
      const { loadingMore } = action;
      return { ...state, loadingMore };
    }

    case 'setThread': {
      const { message } = action;
      return { ...state, thread: message };
    }

    case 'setTyping': {
      const { channel } = action;
      return {
        ...state,
        typing: { ...channel.state.typing },
      };
    }

    case 'startLoadingThread': {
      return {
        ...state,
        threadLoadingMore: true,
      };
    }

    case 'updateThreadOnEvent': {
      const { channel, message } = action;
      if (!state.thread) return state;
      return {
        ...state,
        thread:
          message?.id === state.thread.id ? channel.state.formatMessage(message) : state.thread,
        threadMessages: state.thread?.id ? { ...channel.state.threads }[state.thread.id] || [] : [],
      };
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
