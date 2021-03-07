'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _objectWithoutProperties2 = _interopRequireDefault(
  require('@babel/runtime/helpers/objectWithoutProperties'),
);

var _react = _interopRequireWildcard(require('react'));

var _nimbleEmoji = _interopRequireDefault(
  require('emoji-mart/dist-modern/components/emoji/nimble-emoji'),
);

var _nimbleEmojiIndex = _interopRequireDefault(
  require('emoji-mart/dist-modern/utils/emoji-index/nimble-emoji-index'),
);

var _nimblePicker = _interopRequireDefault(
  require('emoji-mart/dist-modern/components/picker/nimble-picker'),
);

var _lodash = _interopRequireDefault(require('lodash.debounce'));

var _lodash2 = _interopRequireDefault(require('lodash.throttle'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _streamChat = require('stream-chat');

var _uuid = require('uuid');

var _Attachment = require('../Attachment');

var _emojiData = require('./emojiData');

var _Message = require('../Message');

var _Loading = require('../Loading');

var _channelState = require('./channelState');

var _useMentionsHandlers = _interopRequireDefault(
  require('./hooks/useMentionsHandlers'),
);

var _useEditMessageHandler = _interopRequireDefault(
  require('./hooks/useEditMessageHandler'),
);

var _useIsMounted = _interopRequireDefault(require('./hooks/useIsMounted'));

var _context7 = require('../../context');

var _streamEmoji = _interopRequireDefault(require('../../stream-emoji.json'));

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        (0, _defineProperty2.default)(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key),
        );
      });
    }
  }
  return target;
}

/** @type {React.FC<import('types').ChannelProps>}>} */
var Channel = function Channel(_ref) {
  var _ref$EmptyPlaceholder = _ref.EmptyPlaceholder,
    EmptyPlaceholder =
      _ref$EmptyPlaceholder === void 0 ? null : _ref$EmptyPlaceholder,
    props = (0, _objectWithoutProperties2.default)(_ref, ['EmptyPlaceholder']);

  var _useContext = (0, _react.useContext)(_context7.ChatContext),
    contextChannel = _useContext.channel;

  var channel = props.channel || contextChannel;
  if (!(channel !== null && channel !== void 0 && channel.cid))
    return EmptyPlaceholder;
  return /*#__PURE__*/ _react.default.createElement(
    ChannelInner,
    (0, _extends2.default)({}, props, {
      channel: channel,
      key: channel.cid,
    }),
  );
};
/** @type {React.FC<import('types').ChannelProps & { channel: import('stream-chat').Channel }>} */

var ChannelInner = function ChannelInner(_ref2) {
  var _props$channel;

  var _ref2$Attachment = _ref2.Attachment,
    Attachment =
      _ref2$Attachment === void 0 ? _Attachment.Attachment : _ref2$Attachment,
    doMarkReadRequest = _ref2.doMarkReadRequest,
    _ref2$Emoji = _ref2.Emoji,
    Emoji = _ref2$Emoji === void 0 ? _nimbleEmoji.default : _ref2$Emoji,
    _ref2$emojiData = _ref2.emojiData,
    emojiData =
      _ref2$emojiData === void 0 ? _streamEmoji.default : _ref2$emojiData,
    _ref2$EmojiIndex = _ref2.EmojiIndex,
    EmojiIndex =
      _ref2$EmojiIndex === void 0
        ? _nimbleEmojiIndex.default
        : _ref2$EmojiIndex,
    _ref2$EmojiPicker = _ref2.EmojiPicker,
    EmojiPicker =
      _ref2$EmojiPicker === void 0 ? _nimblePicker.default : _ref2$EmojiPicker,
    _ref2$LoadingErrorInd = _ref2.LoadingErrorIndicator,
    LoadingErrorIndicator =
      _ref2$LoadingErrorInd === void 0
        ? _Loading.LoadingErrorIndicator
        : _ref2$LoadingErrorInd,
    _ref2$LoadingIndicato = _ref2.LoadingIndicator,
    LoadingIndicator =
      _ref2$LoadingIndicato === void 0
        ? _Loading.LoadingIndicator
        : _ref2$LoadingIndicato,
    _ref2$Message = _ref2.Message,
    Message = _ref2$Message === void 0 ? _Message.MessageSimple : _ref2$Message,
    props = (0, _objectWithoutProperties2.default)(_ref2, [
      'Attachment',
      'doMarkReadRequest',
      'Emoji',
      'emojiData',
      'EmojiIndex',
      'EmojiPicker',
      'LoadingErrorIndicator',
      'LoadingIndicator',
      'Message',
    ]);
  var channel = props.channel;

  var _useContext2 = (0, _react.useContext)(_context7.ChatContext),
    client = _useContext2.client,
    mutes = _useContext2.mutes,
    theme = _useContext2.theme;

  var _useContext3 = (0, _react.useContext)(_context7.TranslationContext),
    t = _useContext3.t;

  var _useReducer = (0, _react.useReducer)(
      _channelState.channelReducer,
      _channelState.initialState,
    ),
    _useReducer2 = (0, _slicedToArray2.default)(_useReducer, 2),
    state = _useReducer2[0],
    dispatch = _useReducer2[1];

  var isMounted = (0, _useIsMounted.default)();
  var originalTitle = (0, _react.useRef)('');
  var lastRead = (0, _react.useRef)(new Date());
  var online = (0, _react.useRef)(true);
  var emojiConfig = {
    commonEmoji: _emojiData.commonEmoji,
    defaultMinimalEmojis: _emojiData.defaultMinimalEmojis,
    Emoji,
    emojiData,
    EmojiIndex,
    EmojiPicker,
    emojiSetDef: _emojiData.emojiSetDef,
  }; // eslint-disable-next-line react-hooks/exhaustive-deps

  var throttledCopyStateFromChannel = (0, _react.useCallback)(
    (0, _lodash2.default)(
      function () {
        dispatch({
          type: 'copyStateFromChannelOnEvent',
          channel,
        });
      },
      500,
      {
        leading: true,
        trailing: true,
      },
    ),
    [channel],
  );
  var markRead = (0, _react.useCallback)(
    function () {
      var _channel$getConfig;

      if (
        channel.disconnected ||
        !(
          (_channel$getConfig = channel.getConfig()) !== null &&
          _channel$getConfig !== void 0 &&
          _channel$getConfig.read_events
        )
      ) {
        return;
      }

      lastRead.current = new Date();

      if (doMarkReadRequest) {
        doMarkReadRequest(channel);
      } else {
        (0, _streamChat.logChatPromiseExecution)(
          channel.markRead(),
          'mark read',
        );
      }

      if (originalTitle.current) {
        document.title = originalTitle.current;
      }
    },
    [channel, doMarkReadRequest],
  ); // eslint-disable-next-line react-hooks/exhaustive-deps

  var markReadThrottled = (0, _react.useCallback)(
    (0, _lodash2.default)(markRead, 500, {
      leading: true,
      trailing: true,
    }),
    [markRead],
  );
  var handleEvent = (0, _react.useCallback)(
    function (e) {
      dispatch({
        type: 'updateThreadOnEvent',
        message: e.message,
        channel,
      });

      if (e.type === 'connection.changed') {
        online.current = e.online;
      }

      if (e.type === 'message.new') {
        var mainChannelUpdated = true;

        if (e.message.parent_id && !e.message.show_in_channel) {
          mainChannelUpdated = false;
        }

        if (mainChannelUpdated && e.message.user.id !== client.userID) {
          var _channel$getConfig2;

          if (!document.hidden) {
            markReadThrottled();
          } else if (
            (_channel$getConfig2 = channel.getConfig()) !== null &&
            _channel$getConfig2 !== void 0 &&
            _channel$getConfig2.read_events &&
            !channel.muteStatus().muted
          ) {
            var unread = channel.countUnread(lastRead.current);
            document.title = '('
              .concat(unread, ') ')
              .concat(originalTitle.current);
          }
        }
      }

      throttledCopyStateFromChannel();
    },
    [channel, throttledCopyStateFromChannel, client.userID, markReadThrottled],
  ); // useLayoutEffect here to prevent spinner. Use Suspense when it is available in stable release

  (0, _react.useLayoutEffect)(
    function () {
      var errored = false;
      var done = false;

      var onVisibilityChange = function onVisibilityChange() {
        if (!document.hidden) {
          markRead();
        }
      };

      (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee() {
          return _regenerator.default.wrap(
            function _callee$(_context) {
              while (1) {
                switch ((_context.prev = _context.next)) {
                  case 0:
                    if (channel.initialized) {
                      _context.next = 10;
                      break;
                    }

                    _context.prev = 1;
                    _context.next = 4;
                    return channel.watch();

                  case 4:
                    _context.next = 10;
                    break;

                  case 6:
                    _context.prev = 6;
                    _context.t0 = _context['catch'](1);
                    dispatch({
                      type: 'setError',
                      error: _context.t0,
                    });
                    errored = true;

                  case 10:
                    done = true;
                    originalTitle.current = document.title;

                    if (!errored) {
                      dispatch({
                        type: 'initStateFromChannel',
                        channel,
                      });
                      if (channel.countUnread() > 0) markRead(); // The more complex sync logic is done in chat.js
                      // listen to client.connection.recovered and all channel events

                      document.addEventListener(
                        'visibilitychange',
                        onVisibilityChange,
                      );
                      client.on('connection.changed', handleEvent);
                      client.on('connection.recovered', handleEvent);
                      channel.on(handleEvent);
                    }

                  case 13:
                  case 'end':
                    return _context.stop();
                }
              }
            },
            _callee,
            null,
            [[1, 6]],
          );
        }),
      )();
      return function () {
        if (errored || !done) return;
        document.removeEventListener('visibilitychange', onVisibilityChange);
        channel.off(handleEvent);
        client.off('connection.changed', handleEvent);
        client.off('connection.recovered', handleEvent);
      };
    },
    [channel, client, handleEvent, markRead, props.channel],
  );
  (0, _react.useEffect)(
    function () {
      if (state.thread) {
        for (var i = state.messages.length - 1; i >= 0; i -= 1) {
          if (state.messages[i].id === state.thread.id) {
            dispatch({
              type: 'setThread',
              message: state.messages[i],
            });
            break;
          }
        }
      }
    },
    [state.messages, state.thread],
  ); // Message
  // eslint-disable-next-line react-hooks/exhaustive-deps

  var loadMoreFinished = (0, _react.useCallback)(
    (0, _lodash.default)(
      /**
       * @param {boolean} hasMore
       * @param {import('stream-chat').ChannelState['messages']} messages
       */
      function (hasMore, messages) {
        if (!isMounted.current) return;
        dispatch({
          type: 'loadMoreFinished',
          hasMore,
          messages,
        });
      },
      2000,
      {
        leading: true,
        trailing: true,
      },
    ),
    [],
  );
  var loadMore = (0, _react.useCallback)(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var limit,
          oldestMessage,
          oldestID,
          perPage,
          queryResponse,
          hasMoreMessages,
          _args2 = arguments;
        return _regenerator.default.wrap(
          function _callee2$(_context2) {
            while (1) {
              switch ((_context2.prev = _context2.next)) {
                case 0:
                  limit =
                    _args2.length > 0 && _args2[0] !== undefined
                      ? _args2[0]
                      : 100;

                  if (!(!online.current || !window.navigator.onLine)) {
                    _context2.next = 3;
                    break;
                  }

                  return _context2.abrupt('return', 0);

                case 3:
                  // prevent duplicate loading events...
                  oldestMessage = state.messages[0];

                  if (
                    !(
                      state.loadingMore ||
                      (oldestMessage === null || oldestMessage === void 0
                        ? void 0
                        : oldestMessage.status) !== 'received'
                    )
                  ) {
                    _context2.next = 6;
                    break;
                  }

                  return _context2.abrupt('return', 0);

                case 6:
                  dispatch({
                    type: 'setLoadingMore',
                    loadingMore: true,
                  });
                  oldestID =
                    oldestMessage === null || oldestMessage === void 0
                      ? void 0
                      : oldestMessage.id;
                  perPage = limit;
                  _context2.prev = 9;
                  _context2.next = 12;
                  return channel.query({
                    messages: {
                      limit: perPage,
                      id_lt: oldestID,
                    },
                  });

                case 12:
                  queryResponse = _context2.sent;
                  _context2.next = 20;
                  break;

                case 15:
                  _context2.prev = 15;
                  _context2.t0 = _context2['catch'](9);
                  console.warn(
                    'message pagination request failed with error',
                    _context2.t0,
                  );
                  dispatch({
                    type: 'setLoadingMore',
                    loadingMore: false,
                  });
                  return _context2.abrupt('return', 0);

                case 20:
                  hasMoreMessages = queryResponse.messages.length === perPage;
                  loadMoreFinished(hasMoreMessages, channel.state.messages);
                  return _context2.abrupt(
                    'return',
                    queryResponse.messages.length,
                  );

                case 23:
                case 'end':
                  return _context2.stop();
              }
            }
          },
          _callee2,
          null,
          [[9, 15]],
        );
      }),
    ),
    [channel, loadMoreFinished, state.loadingMore, state.messages, online],
  );
  var updateMessage = (0, _react.useCallback)(
    function (updatedMessage) {
      // adds the message to the local channel state..
      // this adds to both the main channel state as well as any reply threads
      channel.state.addMessageSorted(updatedMessage, true);
      dispatch({
        type: 'copyMessagesFromChannel',
        parentId: state.thread && updatedMessage.parent_id,
        channel,
      });
    },
    [channel, state.thread],
  );
  var doSendMessageRequest = props.doSendMessageRequest;
  var doSendMessage = (0, _react.useCallback)(
    /*#__PURE__*/ (function () {
      var _ref5 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee3(message) {
          var text,
            attachments,
            id,
            parent_id,
            mentioned_users,
            messageData,
            messageResponse;
          return _regenerator.default.wrap(
            function _callee3$(_context3) {
              while (1) {
                switch ((_context3.prev = _context3.next)) {
                  case 0:
                    (text = message.text),
                      (attachments = message.attachments),
                      (id = message.id),
                      (parent_id = message.parent_id),
                      (mentioned_users = message.mentioned_users);
                    messageData = {
                      text,
                      attachments,
                      mentioned_users,
                      id,
                      parent_id,
                    };
                    _context3.prev = 2;

                    if (!doSendMessageRequest) {
                      _context3.next = 9;
                      break;
                    }

                    _context3.next = 6;
                    return doSendMessageRequest(channel.cid, messageData);

                  case 6:
                    messageResponse = _context3.sent;
                    _context3.next = 12;
                    break;

                  case 9:
                    _context3.next = 11;
                    return channel.sendMessage(messageData);

                  case 11:
                    messageResponse = _context3.sent;

                  case 12:
                    // replace it after send is completed
                    if (messageResponse && messageResponse.message) {
                      updateMessage(
                        _objectSpread(
                          _objectSpread({}, messageResponse.message),
                          {},
                          {
                            status: 'received',
                          },
                        ),
                      );
                    }

                    _context3.next = 18;
                    break;

                  case 15:
                    _context3.prev = 15;
                    _context3.t0 = _context3['catch'](2);
                    // set the message to failed..
                    updateMessage(
                      _objectSpread(
                        _objectSpread({}, message),
                        {},
                        {
                          status: 'failed',
                        },
                      ),
                    );

                  case 18:
                  case 'end':
                    return _context3.stop();
                }
              }
            },
            _callee3,
            null,
            [[2, 15]],
          );
        }),
      );

      return function (_x) {
        return _ref5.apply(this, arguments);
      };
    })(),
    [channel, doSendMessageRequest, updateMessage],
  );
  var createMessagePreview = (0, _react.useCallback)(
    function (text, attachments, parent, mentioned_users) {
      // create a preview of the message
      var clientSideID = ''.concat(client.userID, '-').concat((0, _uuid.v4)());
      return _objectSpread(
        {
          text,
          html: text,
          __html: text,
          id: clientSideID,
          type: 'regular',
          status: 'sending',
          user: client.user,
          created_at: new Date(),
          attachments,
          mentioned_users,
          reactions: [],
        },
        parent !== null && parent !== void 0 && parent.id
          ? {
              parent_id: parent.id,
            }
          : null,
      );
    },
    [client.user, client.userID],
  );
  var sendMessage = (0, _react.useCallback)(
    /*#__PURE__*/ (function () {
      var _ref7 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee4(_ref6) {
          var text,
            _ref6$attachments,
            attachments,
            _ref6$mentioned_users,
            mentioned_users,
            parent,
            messagePreview;

          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch ((_context4.prev = _context4.next)) {
                case 0:
                  (text = _ref6.text),
                    (_ref6$attachments = _ref6.attachments),
                    (attachments =
                      _ref6$attachments === void 0 ? [] : _ref6$attachments),
                    (_ref6$mentioned_users = _ref6.mentioned_users),
                    (mentioned_users =
                      _ref6$mentioned_users === void 0
                        ? []
                        : _ref6$mentioned_users),
                    (parent = _ref6.parent);
                  // remove error messages upon submit
                  channel.state.filterErrorMessages(); // create a local preview message to show in the UI

                  messagePreview = createMessagePreview(
                    text,
                    attachments,
                    parent,
                    mentioned_users,
                  ); // first we add the message to the UI

                  updateMessage(messagePreview);
                  _context4.next = 6;
                  return doSendMessage(messagePreview);

                case 6:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4);
        }),
      );

      return function (_x2) {
        return _ref7.apply(this, arguments);
      };
    })(),
    [channel.state, createMessagePreview, doSendMessage, updateMessage],
  );
  var retrySendMessage = (0, _react.useCallback)(
    /*#__PURE__*/ (function () {
      var _ref8 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee5(message) {
          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch ((_context5.prev = _context5.next)) {
                case 0:
                  // set the message status to sending
                  updateMessage(
                    _objectSpread(
                      _objectSpread({}, message),
                      {},
                      {
                        status: 'sending',
                      },
                    ),
                  ); // actually try to send the message...

                  _context5.next = 3;
                  return doSendMessage(message);

                case 3:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5);
        }),
      );

      return function (_x3) {
        return _ref8.apply(this, arguments);
      };
    })(),
    [doSendMessage, updateMessage],
  );
  var removeMessage = (0, _react.useCallback)(
    function (message) {
      channel.state.removeMessage(message);
      dispatch({
        type: 'copyMessagesFromChannel',
        parentId: state.thread && message.parent_id,
        channel,
      });
    },
    [channel, state.thread],
  ); // Thread

  var openThread = (0, _react.useCallback)(
    function (message, e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      dispatch({
        type: 'openThread',
        message,
        channel,
      });
    },
    [channel],
  ); // eslint-disable-next-line react-hooks/exhaustive-deps

  var loadMoreThreadFinished = (0, _react.useCallback)(
    (0, _lodash.default)(
      /**
       * @param {boolean} threadHasMore
       * @param {Array<ReturnType<import('stream-chat').ChannelState['formatMessage']>>} threadMessages
       */
      function (threadHasMore, threadMessages) {
        dispatch({
          type: 'loadMoreThreadFinished',
          threadHasMore,
          threadMessages,
        });
      },
      2000,
      {
        leading: true,
        trailing: true,
      },
    ),
    [],
  );
  var loadMoreThread = (0, _react.useCallback)(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var _oldMessages$;

        var parentID,
          oldMessages,
          oldestMessageID,
          limit,
          queryResponse,
          threadHasMoreMessages,
          newThreadMessages;
        return _regenerator.default.wrap(
          function _callee6$(_context6) {
            while (1) {
              switch ((_context6.prev = _context6.next)) {
                case 0:
                  if (!(state.threadLoadingMore || !state.thread)) {
                    _context6.next = 2;
                    break;
                  }

                  return _context6.abrupt('return');

                case 2:
                  dispatch({
                    type: 'startLoadingThread',
                  });
                  parentID = state.thread.id;

                  if (parentID) {
                    _context6.next = 7;
                    break;
                  }

                  dispatch({
                    type: 'closeThread',
                  });
                  return _context6.abrupt('return');

                case 7:
                  oldMessages = channel.state.threads[parentID] || [];
                  oldestMessageID =
                    (_oldMessages$ = oldMessages[0]) === null ||
                    _oldMessages$ === void 0
                      ? void 0
                      : _oldMessages$.id;
                  limit = 50;
                  _context6.prev = 10;
                  _context6.next = 13;
                  return channel.getReplies(parentID, {
                    limit,
                    id_lt: oldestMessageID,
                  });

                case 13:
                  queryResponse = _context6.sent;
                  threadHasMoreMessages =
                    queryResponse.messages.length === limit;
                  newThreadMessages = channel.state.threads[parentID] || []; // next set loadingMore to false so we can start asking for more data...

                  loadMoreThreadFinished(
                    threadHasMoreMessages,
                    newThreadMessages,
                  );
                  _context6.next = 22;
                  break;

                case 19:
                  _context6.prev = 19;
                  _context6.t0 = _context6['catch'](10);
                  loadMoreThreadFinished(false, oldMessages);

                case 22:
                case 'end':
                  return _context6.stop();
              }
            }
          },
          _callee6,
          null,
          [[10, 19]],
        );
      }),
    ),
    [channel, loadMoreThreadFinished, state.thread, state.threadLoadingMore],
  );
  var closeThread = (0, _react.useCallback)(function (e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    dispatch({
      type: 'closeThread',
    });
  }, []);
  var onMentionsHoverOrClick = (0, _useMentionsHandlers.default)(
    props.onMentionsHover,
    props.onMentionsClick,
  );
  var editMessage = (0, _useEditMessageHandler.default)(
    props.doUpdateMessageRequest,
  );

  var channelContextValue = _objectSpread(
    _objectSpread({}, state),
    {},
    {
      watcher_count: state.watcherCount,
      // props
      acceptedFiles: props.acceptedFiles,
      Attachment,
      channel,
      maxNumberOfFiles: props.maxNumberOfFiles,
      Message,
      multipleUploads: props.multipleUploads,
      mutes,
      // handlers
      closeThread,
      editMessage,
      loadMore,
      loadMoreThread,
      onMentionsClick: onMentionsHoverOrClick,
      onMentionsHover: onMentionsHoverOrClick,
      openThread,
      removeMessage,
      retrySendMessage,
      sendMessage,
      updateMessage,
      // from chatContext, for legacy reasons
      client,
      // emoji config and customization object, potentially find a better home
      emojiConfig,
      dispatch,
    },
  );

  var core;

  if (state.error) {
    core = /*#__PURE__*/ _react.default.createElement(LoadingErrorIndicator, {
      error: state.error,
    });
  } else if (state.loading) {
    core = /*#__PURE__*/ _react.default.createElement(LoadingIndicator, {
      size: 25,
    });
  } else if (
    !(
      (_props$channel = props.channel) !== null &&
      _props$channel !== void 0 &&
      _props$channel.watch
    )
  ) {
    core = /*#__PURE__*/ _react.default.createElement(
      'div',
      null,
      t('Channel Missing'),
    );
  } else {
    core = /*#__PURE__*/ _react.default.createElement(
      _context7.ChannelContext.Provider,
      {
        value: channelContextValue,
      },
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__container',
        },
        props.children,
      ),
    );
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat str-chat-channel '.concat(theme),
    },
    core,
  );
};

Channel.defaultProps = {
  multipleUploads: true,
};
Channel.propTypes = {
  /** Which channel to connect to, will initialize the channel if it's not initialized yet */
  channel: _propTypes.default.instanceOf(_streamChat.Channel),

  /**
   * Empty channel UI component. This will be shown on the screen if there is no active channel.
   *
   * Defaults to null which skips rendering the Channel
   *
   * */
  EmptyPlaceholder: _propTypes.default.element,

  /**
   * Error indicator UI component. This will be shown on the screen if channel query fails.
   *
   * Defaults to and accepts same props as: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react/#loadingerrorindicator)
   *
   * */
  // @ts-expect-error elementType
  LoadingErrorIndicator: _propTypes.default.elementType,

  /**
   * Loading indicator UI component. This will be shown on the screen until the messages are
   * being queried from channel. Once the messages are loaded, loading indicator is removed from the screen
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingIndicator.js)
   */
  // @ts-expect-error elementType
  LoadingIndicator: _propTypes.default.elementType,

  /**
   * Message UI component to display a message in message list.
   *
   * Available built-in components (also accepts the same props as):
   *
   * 1. [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageSimple.js) (default)
   * 2. [MessageTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageTeam.js)
   * 3. [MessageLivestream](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageLivestream.js)
   * 3. [MessageCommerce](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageCommerce.js)
   *
   * */
  // @ts-expect-error elementType
  Message: _propTypes.default.elementType,

  /**
   * Attachment UI component to display attachment in individual message.
   *
   * Defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  // @ts-expect-error elementType
  Attachment: _propTypes.default.elementType,

  /**
   * Handle for click on @mention in message
   *
   * @param {Event} event DOM Click event
   * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is clicked
   */
  onMentionsClick: _propTypes.default.func,

  /**
   * Handle for hover on @mention in message
   *
   * @param {Event} event DOM hover event
   * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is hovered
   */
  onMentionsHover: _propTypes.default.func,

  /** Whether to allow multiple attachment uploads */
  multipleUploads: _propTypes.default.bool,

  /** List of accepted file types */
  acceptedFiles: _propTypes.default.array,

  /** Maximum number of attachments allowed per message */
  maxNumberOfFiles: _propTypes.default.number,

  /** Override send message request (Advanced usage only)
   *
   * @param {String} channelId full channel ID in format of `type:id`
   * @param {Object} message
   */
  doSendMessageRequest: _propTypes.default.func,

  /**
   * Override mark channel read request (Advanced usage only)
   *
   * @param {Channel} channel object
   * */
  doMarkReadRequest: _propTypes.default.func,

  /** Override update(edit) message request (Advanced usage only)
   *
   * @param {String} channelId full channel ID in format of `type:id`
   * @param {Object} updatedMessage
   */
  doUpdateMessageRequest: _propTypes.default.func,

  /**
   * Optional component to override default NimbleEmoji from emoji-mart
   */
  // @ts-expect-error import type when converted to TS
  Emoji:
    /** @type {PropTypes.Validator<React.ElementType<NimbleEmojiProps>>} */
    _propTypes.default.elementType,

  /**
   * Optional prop to override default facebook.json emoji data set from emoji-mart
   */
  // @ts-expect-error import type when converted to TS
  emojiData:
    /** @type {PropTypes.Validator<EmojiMartData>} */
    _propTypes.default.object,

  /**
   * Optional component to override default NimbleEmojiIndex from emoji-mart
   */
  // @ts-expect-error import type when converted to TS
  EmojiIndex:
    /** @type {PropTypes.Validator<NimbleEmojiIndex>} */
    _propTypes.default.object,

  /**
   * Optional component to override default NimblePicker from emoji-mart
   */
  // @ts-expect-error import type when converted to TS
  EmojiPicker:
    /** @type {PropTypes.Validator<React.ElementType<NimblePickerProps>>} */
    _propTypes.default.elementType,
};

var _default = /*#__PURE__*/ _react.default.memo(Channel);

exports.default = _default;
