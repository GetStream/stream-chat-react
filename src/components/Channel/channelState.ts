import type { Channel, LocalMessage } from 'stream-chat';

import type { ChannelState } from '../../context/ChannelStateContext';

export type ChannelStateReducerAction =
  | {
      type: 'clearHighlightedMessage';
    }
  | {
      channel: Channel;
      type: 'copyMessagesFromChannel';
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
      type: 'jumpToLatestMessage';
    };

export const makeChannelReducer =
  () => (state: ChannelState, action: ChannelStateReducerAction) => {
    switch (action.type) {
      case 'copyMessagesFromChannel': {
        const { channel } = action;
        return {
          ...state,
          messages: [...channel.state.messages],
          pinnedMessages: [...channel.state.pinnedMessages],
          // copying messages from channel happens with new message - this resets the suppressAutoscroll
          suppressAutoscroll: false,
        };
      }

      case 'copyStateFromChannelOnEvent': {
        const { channel } = action;
        return {
          ...state,
          messages: [...channel.state.messages],
          pinnedMessages: [...channel.state.pinnedMessages],
        };
      }

      case 'initStateFromChannel': {
        const { channel, hasMore } = action;
        return {
          ...state,
          hasMore,
          loading: false,
          messages: [...channel.state.messages],
          pinnedMessages: [...channel.state.pinnedMessages],
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
  messages: [],
  // todo: add reactive state to Channel class
  pinnedMessages: [],
  suppressAutoscroll: false,
};
