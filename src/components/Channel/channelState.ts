import type {
  Channel,
  LocalMessage,
  MessageResponse,
  ChannelState as StreamChannelState,
} from 'stream-chat';

import type { ChannelState } from '../../context/ChannelStateContext';

export type ChannelStateReducerAction =
  | {
      type: 'closeThread';
    }
  | {
      type: 'clearHighlightedMessage';
    }
  | {
      channel: Channel;
      type: 'copyMessagesFromChannel';
      parentId?: string | null;
    }
  | {
      channel: Channel;
      type: 'copyStateFromChannelOnEvent';
    }
  | {
      channel: Channel;
      highlightedMessageId: string;
      type: 'jumpToMessageFinished';
    }
  | {
      channel: Channel;
      hasMore: boolean;
      type: 'initStateFromChannel';
    }
  | {
      hasMore: boolean;
      messages: LocalMessage[];
      type: 'loadMoreFinished';
    }
  | {
      hasMoreNewer: boolean;
      messages: LocalMessage[];
      type: 'loadMoreNewerFinished';
    }
  | {
      threadHasMore: boolean;
      threadMessages: Array<ReturnType<StreamChannelState['formatMessage']>>;
      type: 'loadMoreThreadFinished';
    }
  | {
      channel: Channel;
      message: LocalMessage;
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
      loadingMoreNewer: boolean;
      type: 'setLoadingMoreNewer';
    }
  | {
      message: LocalMessage;
      type: 'setThread';
    }
  | {
      channel: Channel;
      type: 'setTyping';
    }
  | {
      type: 'startLoadingThread';
    }
  | {
      channel: Channel;
      message: MessageResponse;
      type: 'updateThreadOnEvent';
    }
  | {
      type: 'jumpToLatestMessage';
    };

export const makeChannelReducer =
  () => (state: ChannelState, action: ChannelStateReducerAction) => {
    switch (action.type) {
      case 'closeThread': {
        return {
          ...state,
          thread: null,
          threadInstance: undefined,
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
          // copying messages from channel happens with new message - this resets the suppressAutoscroll
          suppressAutoscroll: false,
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
        const { channel, hasMore } = action;
        return {
          ...state,
          hasMore,
          loading: false,
          members: { ...channel.state.members },
          messages: [...channel.state.messages],
          pinnedMessages: [...channel.state.pinnedMessages],
          read: { ...channel.state.read },
          watcherCount: channel.state.watcher_count,
          watchers: { ...channel.state.watchers },
        };
      }

      case 'jumpToLatestMessage': {
        return {
          ...state,
          hasMoreNewer: false,
          highlightedMessageId: undefined,
          loading: false,
          suppressAutoscroll: false,
        };
      }

      case 'jumpToMessageFinished': {
        return {
          ...state,
          hasMoreNewer: action.channel.state.messagePagination.hasNext,
          highlightedMessageId: action.highlightedMessageId,
          messages: action.channel.state.messages,
        };
      }

      case 'clearHighlightedMessage': {
        return {
          ...state,
          highlightedMessageId: undefined,
        };
      }

      case 'loadMoreFinished': {
        const { hasMore, messages } = action;
        return {
          ...state,
          hasMore,
          loadingMore: false,
          messages,
          suppressAutoscroll: false,
        };
      }

      case 'loadMoreNewerFinished': {
        const { hasMoreNewer, messages } = action;
        return {
          ...state,
          hasMoreNewer,
          loadingMoreNewer: false,
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
          threadHasMore: true,
          threadMessages: message.id
            ? { ...channel.state.threads }[message.id] || []
            : [],
          threadSuppressAutoscroll: false,
        };
      }

      case 'setError': {
        const { error } = action;
        return { ...state, error };
      }

      case 'setLoadingMore': {
        const { loadingMore } = action;
        // suppress the autoscroll behavior
        return { ...state, loadingMore, suppressAutoscroll: loadingMore };
      }

      case 'setLoadingMoreNewer': {
        const { loadingMoreNewer } = action;
        return { ...state, loadingMoreNewer };
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
          threadSuppressAutoscroll: true,
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

      default:
        return state;
    }
  };

export const initialState = {
  error: null,
  hasMore: true,
  hasMoreNewer: false,
  loading: true,
  loadingMore: false,
  members: {},
  messages: [],
  pinnedMessages: [],
  read: {},
  suppressAutoscroll: false,
  thread: null,
  threadHasMore: true,
  threadLoadingMore: false,
  threadMessages: [],
  threadSuppressAutoscroll: false,
  typing: {},
  watcherCount: 0,
  watchers: {},
};
