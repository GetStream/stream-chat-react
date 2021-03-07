'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useReactionClick = exports.useReactionHandler = exports.reactionHandlerWarning = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = require('react');

var _context2 = require('../../../context');

// @ts-check
var reactionHandlerWarning =
  'Reaction handler was called, but it is missing one of its required arguments.\n      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.';
/**
 * @type {import('types').useReactionHandler}
 */

exports.reactionHandlerWarning = reactionHandlerWarning;

var useReactionHandler = function useReactionHandler(message) {
  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    client = _useContext.client,
    channel = _useContext.channel,
    updateMessage = _useContext.updateMessage;

  return /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(
        reactionType,
        event,
      ) {
        var userExistingReaction,
          currentUser,
          originalMessage,
          reactionChangePromise,
          messageID,
          reaction;
        return _regenerator.default.wrap(
          function _callee$(_context) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  if (event && event.preventDefault) {
                    event.preventDefault();
                  }

                  if (!(!updateMessage || !message || !channel || !client)) {
                    _context.next = 4;
                    break;
                  }

                  console.warn(reactionHandlerWarning);
                  return _context.abrupt('return');

                case 4:
                  userExistingReaction =
                    /** @type { import('stream-chat').ReactionResponse<Record<String, unknown>, import('types').StreamChatReactUserType> | null } */
                    null;
                  currentUser = client.userID;

                  if (message.own_reactions) {
                    message.own_reactions.forEach(function (reaction) {
                      // own user should only ever contain the current user id
                      // just in case we check to prevent bugs with message updates from breaking reactions
                      if (
                        reaction.user &&
                        currentUser === reaction.user.id &&
                        reaction.type === reactionType
                      ) {
                        userExistingReaction = reaction;
                      } else if (
                        reaction.user &&
                        currentUser !== reaction.user.id
                      ) {
                        console.warn(
                          'message.own_reactions contained reactions from a different user, this indicates a bug',
                        );
                      }
                    });
                  }

                  originalMessage = message;

                  if (!message.id) {
                    _context.next = 18;
                    break;
                  }

                  if (userExistingReaction) {
                    reactionChangePromise = channel.deleteReaction(
                      message.id,
                      userExistingReaction.type,
                    );
                  } else {
                    // add the reaction
                    messageID = message.id;
                    reaction = {
                      type: reactionType,
                    }; // this.props.channel.state.addReaction(tmpReaction, this.props.message);

                    reactionChangePromise = channel.sendReaction(
                      messageID,
                      reaction,
                    );
                  }

                  _context.prev = 10;
                  _context.next = 13;
                  return reactionChangePromise;

                case 13:
                  _context.next = 18;
                  break;

                case 15:
                  _context.prev = 15;
                  _context.t0 = _context['catch'](10);
                  // revert to the original message if the API call fails
                  updateMessage(originalMessage);

                case 18:
                case 'end':
                  return _context.stop();
              }
            }
          },
          _callee,
          null,
          [[10, 15]],
        );
      }),
    );

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })();
};
/**
 * @type {import('types').useReactionClick}
 */

exports.useReactionHandler = useReactionHandler;

var useReactionClick = function useReactionClick(
  message,
  reactionSelectorRef,
  messageWrapperRef,
) {
  var _channel$getConfig, _channel$getConfig$ca;

  var _useContext2 = (0, _react.useContext)(_context2.ChannelContext),
    channel = _useContext2.channel;

  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    showDetailedReactions = _useState2[0],
    setShowDetailedReactions = _useState2[1];

  var isReactionEnabled =
    (channel === null || channel === void 0
      ? void 0
      : (_channel$getConfig = channel.getConfig) === null ||
        _channel$getConfig === void 0
      ? void 0
      : (_channel$getConfig$ca = _channel$getConfig.call(channel)) === null ||
        _channel$getConfig$ca === void 0
      ? void 0
      : _channel$getConfig$ca.reactions) !== false;
  var messageDeleted = !!(
    message !== null &&
    message !== void 0 &&
    message.deleted_at
  );
  var hasListener = (0, _react.useRef)(false);
  /** @type {EventListener} */

  var closeDetailedReactions = (0, _react.useCallback)(
    function (event) {
      var _reactionSelectorRef$;

      if (
        event.target && // @ts-expect-error
        reactionSelectorRef !== null &&
        reactionSelectorRef !== void 0 &&
        (_reactionSelectorRef$ = reactionSelectorRef.current) !== null &&
        _reactionSelectorRef$ !== void 0 &&
        _reactionSelectorRef$.contains(event.target)
      ) {
        return;
      }

      setShowDetailedReactions(false);
    },
    [setShowDetailedReactions, reactionSelectorRef],
  );
  (0, _react.useEffect)(
    function () {
      var messageWrapper =
        messageWrapperRef === null || messageWrapperRef === void 0
          ? void 0
          : messageWrapperRef.current;

      if (showDetailedReactions && !hasListener.current) {
        hasListener.current = true;
        document.addEventListener('click', closeDetailedReactions);
        document.addEventListener('touchend', closeDetailedReactions);

        if (messageWrapper) {
          messageWrapper.addEventListener('mouseleave', closeDetailedReactions);
        }
      }

      if (!showDetailedReactions && hasListener.current) {
        document.removeEventListener('click', closeDetailedReactions);
        document.removeEventListener('touchend', closeDetailedReactions);

        if (messageWrapper) {
          messageWrapper.removeEventListener(
            'mouseleave',
            closeDetailedReactions,
          );
        }

        hasListener.current = false;
      }

      return function () {
        if (hasListener.current) {
          document.removeEventListener('click', closeDetailedReactions);
          document.removeEventListener('touchend', closeDetailedReactions);

          if (messageWrapper) {
            messageWrapper.removeEventListener(
              'mouseleave',
              closeDetailedReactions,
            );
          }

          hasListener.current = false;
        }
      };
    },
    [showDetailedReactions, closeDetailedReactions, messageWrapperRef],
  );
  (0, _react.useEffect)(
    function () {
      var messageWrapper =
        messageWrapperRef === null || messageWrapperRef === void 0
          ? void 0
          : messageWrapperRef.current;

      if (messageDeleted && hasListener.current) {
        document.removeEventListener('click', closeDetailedReactions);
        document.removeEventListener('touchend', closeDetailedReactions);

        if (messageWrapper) {
          messageWrapper.removeEventListener(
            'mouseleave',
            closeDetailedReactions,
          );
        }

        hasListener.current = false;
      }
    },
    [messageDeleted, closeDetailedReactions, messageWrapperRef],
  );
  /** @type {(e: MouseEvent) => void} Typescript syntax */

  var onReactionListClick = function onReactionListClick(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    setShowDetailedReactions(true);
  };

  return {
    // @ts-expect-error
    onReactionListClick,
    showDetailedReactions,
    isReactionEnabled,
  };
};

exports.useReactionClick = useReactionClick;
