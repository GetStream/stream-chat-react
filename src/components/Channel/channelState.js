/** @type {import('./types').ChannelStateReducer} */
export const channelReducer = (state, action) => {
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

/** @type {import('./types').ChannelState} */
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
