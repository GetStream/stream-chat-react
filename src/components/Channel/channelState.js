import Immutable from 'seamless-immutable';

/** @type {import('./types').ChannelStateReducer} */
export const channelReducer = (state, action) => {
  switch (action.type) {
    case 'initStateFromChannel': {
      const { channel } = action;
      return {
        ...state,
        messages: channel.state.messages,
        pinnedMessages: channel.state.pinnedMessages,
        read: channel.state.read,
        watchers: channel.state.watchers,
        members: channel.state.members,
        watcherCount: channel.state.watcher_count,
        loading: false,
      };
    }
    case 'copyStateFromChannelOnEvent': {
      const { channel } = action;
      return {
        ...state,
        messages: channel.state.messages,
        pinnedMessages: channel.state.pinnedMessages,
        read: channel.state.read,
        watchers: channel.state.watchers,
        members: channel.state.members,
        typing: channel.state.typing,
        watcherCount: channel.state.watcher_count,
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
        loadingMore: false,
        hasMore,
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
        messages: channel.state.messages,
        pinnedMessages: channel.state.pinnedMessages,
        threadMessages: parentId
          ? channel.state.threads[parentId] || Immutable([])
          : state.threadMessages,
      };
    }
    case 'updateThreadOnEvent': {
      const { channel, message } = action;
      if (!state.thread) return state;
      return {
        ...state,
        threadMessages: state.thread?.id
          ? channel.state.threads[state.thread.id] || Immutable([])
          : Immutable([]),
        thread:
          message?.id === state.thread.id
            ? channel.state.messageToImmutable(message)
            : state.thread,
      };
    }
    case 'openThread': {
      const { message, channel } = action;
      return {
        ...state,
        thread: message,
        threadMessages: message.id
          ? channel.state.threads[message.id] || Immutable([])
          : Immutable([]),
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
        threadMessages,
        threadLoadingMore: false,
      };
    }
    case 'closeThread': {
      return {
        ...state,
        thread: null,
        threadMessages: Immutable([]),
        threadLoadingMore: false,
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

/** @type {import('./types').ChannelState} */
export const initialState = {
  error: null,
  loading: true,
  loadingMore: false,
  hasMore: true,
  messages: Immutable([]),
  pinnedMessages: Immutable([]),
  typing: Immutable(/** @type {any} infer from ChannelState */ ({})),
  members: Immutable(/** @type {any} infer from ChannelState */ ({})),
  watchers: Immutable(/** @type {any} infer from ChannelState */ ({})),
  watcherCount: 0,
  read: Immutable(/** @type {any} infer from ChannelState */ ({})),
  thread: null,
  threadMessages: Immutable([]),
  threadLoadingMore: false,
  threadHasMore: true,
};
