'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _lodash = _interopRequireDefault(require('lodash.debounce'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _AutoCompleteTextarea = require('../AutoCompleteTextarea');

var _CommandItem = require('../CommandItem');

var _EmoticonItem = require('../EmoticonItem');

var _Loading = require('../Loading');

var _UserItem = require('../UserItem');

var _context2 = require('../../context');

/** @type {React.FC<import("types").ChatAutoCompleteProps>} */
var ChatAutoComplete = function ChatAutoComplete(props) {
  var _channel$state, _channel$state2;

  var commands = props.commands,
    onSelectItem = props.onSelectItem,
    triggers = props.triggers;

  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    channel = _useContext.channel,
    emojiConfig = _useContext.emojiConfig;

  var members =
    channel === null || channel === void 0
      ? void 0
      : (_channel$state = channel.state) === null || _channel$state === void 0
      ? void 0
      : _channel$state.members;
  var watchers =
    channel === null || channel === void 0
      ? void 0
      : (_channel$state2 = channel.state) === null || _channel$state2 === void 0
      ? void 0
      : _channel$state2.watchers;

  var _ref = emojiConfig || {},
    emojiData = _ref.emojiData,
    EmojiIndex = _ref.EmojiIndex;

  var emojiIndex = (0, _react.useMemo)(
    function () {
      if (EmojiIndex) {
        return new EmojiIndex(emojiData);
      }

      return null;
    },
    [emojiData, EmojiIndex],
  );
  /** @param {string} word */

  var emojiReplace = function emojiReplace(word) {
    var found =
      (emojiIndex === null || emojiIndex === void 0
        ? void 0
        : emojiIndex.search(word)) || [];
    var emoji = found.slice(0, 10).find(
      /** @type {{ ({ emoticons } : import('emoji-mart').EmojiData): boolean }} */
      function (_ref2) {
        var emoticons = _ref2.emoticons;
        return !!(
          emoticons !== null &&
          emoticons !== void 0 &&
          emoticons.includes(word)
        );
      },
    );
    if (!emoji || !('native' in emoji)) return null;
    return emoji.native;
  };

  var getMembersAndWatchers = (0, _react.useCallback)(
    function () {
      var memberUsers = members
        ? Object.values(members).map(function (_ref3) {
            var user = _ref3.user;
            return user;
          })
        : [];
      var watcherUsers = watchers ? Object.values(watchers) : [];
      var users = [].concat(
        (0, _toConsumableArray2.default)(memberUsers),
        (0, _toConsumableArray2.default)(watcherUsers),
      ); // make sure we don't list users twice

      /** @type {{ [key: string]: import('stream-chat').UserResponse<import('types').StreamChatReactUserType> }} */

      var uniqueUsers = {};
      users.forEach(function (user) {
        if (user && !uniqueUsers[user.id]) {
          uniqueUsers[user.id] = user;
        }
      });
      return Object.values(uniqueUsers);
    },
    [members, watchers],
  ); // eslint-disable-next-line react-hooks/exhaustive-deps

  var queryMembersDebounced = (0, _react.useCallback)(
    (0, _lodash.default)(
      /*#__PURE__*/

      /**
       * @param {string} query
       * @param {(data: any[]) => void} onReady
       */
      (function () {
        var _ref4 = (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee(
            query,
            onReady,
          ) {
            var response, users;
            return _regenerator.default.wrap(function _callee$(_context) {
              while (1) {
                switch ((_context.prev = _context.next)) {
                  case 0:
                    if (
                      channel !== null &&
                      channel !== void 0 &&
                      channel.queryMembers
                    ) {
                      _context.next = 2;
                      break;
                    }

                    return _context.abrupt('return');

                  case 2:
                    _context.next = 4;
                    return channel === null || channel === void 0
                      ? void 0
                      : channel.queryMembers({
                          name: {
                            $autocomplete: query,
                          },
                        });

                  case 4:
                    response = _context.sent;
                    users = response.members.map(function (m) {
                      return m.user;
                    });
                    if (onReady) onReady(users);

                  case 7:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee);
          }),
        );

        return function (_x, _x2) {
          return _ref4.apply(this, arguments);
        };
      })(),
      200,
    ),
    [channel === null || channel === void 0 ? void 0 : channel.queryMembers],
  );
  /**
   * dataProvider accepts `onReady` function, which will executed once the data is ready.
   * Another approach would have been to simply return the data from dataProvider and let the
   * component await for it and then execute the required logic. We are going for callback instead
   * of async-await since we have debounce function in dataProvider. Which will delay the execution
   * of api call on trailing end of debounce (lets call it a1) but will return with result of
   * previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
   * end of debounce executes.
   * @type {() => import("../AutoCompleteTextarea/types").TriggerMap | object}
   */

  var getTriggers = (0, _react.useCallback)(
    function () {
      return (
        triggers || {
          ':': {
            dataProvider: function dataProvider(q, text, onReady) {
              if (q.length === 0 || q.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
                return [];
              }

              var emojis =
                (emojiIndex === null || emojiIndex === void 0
                  ? void 0
                  : emojiIndex.search(q)) || [];
              var result = emojis.slice(0, 10);
              if (onReady) onReady(result, q);
              return result;
            },
            component: _EmoticonItem.EmoticonItem,
            output: function output(entity) {
              return {
                key: entity.id,
                text: ''.concat(entity.native),
                caretPosition: 'next',
              };
            },
          },
          '@': {
            dataProvider: function dataProvider(query, text, onReady) {
              // By default, we return maximum 100 members via queryChannels api call.
              // Thus it is safe to assume, that if number of members in channel.state is < 100,
              // then all the members are already available on client side and we don't need to
              // make any api call to queryMembers endpoint.
              if (!query || Object.values(members || {}).length < 100) {
                var users = getMembersAndWatchers();
                var matchingUsers = users.filter(function (user) {
                  if (!query) return true;

                  if (
                    user.name !== undefined &&
                    user.name.toLowerCase().includes(query.toLowerCase())
                  ) {
                    return true;
                  }

                  return user.id.toLowerCase().includes(query.toLowerCase());
                });
                var data = matchingUsers.slice(0, 10);
                if (onReady) onReady(data, query);
                return data;
              }

              return queryMembersDebounced(
                query,
                /** @param {any[]} data */
                function (data) {
                  if (onReady) onReady(data, query);
                },
              );
            },
            component: _UserItem.UserItem,
            output: function output(entity) {
              return {
                key: entity.id,
                text: '@'.concat(entity.name || entity.id),
                caretPosition: 'next',
              };
            },
            callback: function callback(item) {
              return onSelectItem && onSelectItem(item);
            },
          },
          '/': {
            dataProvider: function dataProvider(q, text, onReady) {
              if (text.indexOf('/') !== 0 || !commands) {
                return [];
              }

              var selectedCommands = commands.filter(function (c) {
                var _c$name;

                return (
                  ((_c$name = c.name) === null || _c$name === void 0
                    ? void 0
                    : _c$name.indexOf(q)) !== -1
                );
              }); // sort alphabetically unless the you're matching the first char

              selectedCommands.sort(function (a, b) {
                var _a$name, _b$name, _nameA, _nameB;

                var nameA =
                  (_a$name = a.name) === null || _a$name === void 0
                    ? void 0
                    : _a$name.toLowerCase();
                var nameB =
                  (_b$name = b.name) === null || _b$name === void 0
                    ? void 0
                    : _b$name.toLowerCase();

                if (
                  ((_nameA = nameA) === null || _nameA === void 0
                    ? void 0
                    : _nameA.indexOf(q)) === 0
                ) {
                  nameA = '0'.concat(nameA);
                }

                if (
                  ((_nameB = nameB) === null || _nameB === void 0
                    ? void 0
                    : _nameB.indexOf(q)) === 0
                ) {
                  nameB = '0'.concat(nameB);
                } // Should confirm possible null / undefined when TS is fully implemented

                if (nameA != null && nameB != null) {
                  if (nameA < nameB) {
                    return -1;
                  }

                  if (nameA > nameB) {
                    return 1;
                  }
                }

                return 0;
              });
              var result = selectedCommands.slice(0, 10);
              if (onReady) onReady(result, q);
              return result;
            },
            component: _CommandItem.CommandItem,
            output: function output(entity) {
              return {
                key: entity.id,
                text: '/'.concat(entity.name),
                caretPosition: 'next',
              };
            },
          },
        }
      );
    },
    [
      commands,
      getMembersAndWatchers,
      members,
      onSelectItem,
      queryMembersDebounced,
      triggers,
      emojiIndex,
    ],
  );
  var innerRef = props.innerRef;
  var updateInnerRef = (0, _react.useCallback)(
    function (ref) {
      if (innerRef) innerRef.current = ref;
    },
    [innerRef],
  );
  return /*#__PURE__*/ _react.default.createElement(
    _AutoCompleteTextarea.AutoCompleteTextarea,
    {
      additionalTextareaProps: props.additionalTextareaProps,
      className: 'str-chat__textarea__textarea',
      containerClassName: 'str-chat__textarea',
      disabled: props.disabled,
      disableMentions: props.disableMentions,
      dropdownClassName: 'str-chat__emojisearch',
      grow: props.grow,
      handleSubmit: props.handleSubmit,
      innerRef: updateInnerRef,
      itemClassName: 'str-chat__emojisearch__item',
      listClassName: 'str-chat__emojisearch__list',
      loadingComponent: _Loading.LoadingIndicator,
      trigger: getTriggers(),
      replaceWord: emojiReplace,
      minChar: 0,
      maxRows: props.maxRows,
      onFocus: props.onFocus,
      rows: props.rows,
      placeholder: props.placeholder,
      onChange: props.onChange,
      onPaste: props.onPaste,
      value: props.value,
      SuggestionList: props.SuggestionList,
      keycodeSubmitKeys: props.keycodeSubmitKeys,
    },
  );
};

ChatAutoComplete.propTypes = {
  /** The number of rows you want the textarea to have */
  rows: _propTypes.default.number,

  /** Grow the number of rows of the textarea while you're typing */
  grow: _propTypes.default.bool,

  /** Optional Array of keycode values
   * Keycodes in this array will override Enter ([13]), which is the default submit key. Shift+Enter is the default for new line.
   * Options are Shift+Enter ([16, 13]), ctrl+Enter ([17, 13]), cmd+Enter ([91, 13] or [92, 13]).
   * If Shift+Enter is submitted, the default for new line is overridden.
   * */
  keycodeSubmitKeys: _propTypes.default.array,

  /** Maximum number of rows */
  maxRows: _propTypes.default.number,

  /** Make the textarea disabled */
  disabled: _propTypes.default.bool,

  /** Disable mentions */
  disableMentions: _propTypes.default.bool,

  /** The value of the textarea */
  value: _propTypes.default.string,

  /** Function to run on pasting within the textarea */
  onPaste: _propTypes.default.func,

  /** Function that runs on submit */
  handleSubmit: _propTypes.default.func,

  /** Function that runs on change */
  onChange: _propTypes.default.func,

  /** Placeholder for the textarea */
  placeholder: _propTypes.default.string,

  /** What loading component to use for the auto complete when loading results. */
  LoadingIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */
    _propTypes.default.elementType,

  /** Minimum number of Character */
  minChar: _propTypes.default.number,

  /**
   * Handler for selecting item from suggestions list
   *
   * @param item Selected item object.
   *  */
  onSelectItem: _propTypes.default.func,

  /** Array of [commands](https://getstream.io/chat/docs/#channel_commands) */
  commands: _propTypes.default.array,

  /** Listener for onfocus event on textarea */
  onFocus: _propTypes.default.func,

  /** Optional UI component prop to override the default List component that displays suggestions */
  SuggestionList:
    /** @type {PropTypes.Validator<React.ElementType<import('types').SuggestionListProps>>} */
    _propTypes.default.elementType,

  /**
   * Any additional attributes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: _propTypes.default.object,
};
ChatAutoComplete.defaultProps = {
  rows: 3,
};

var _default = /*#__PURE__*/ _react.default.memo(ChatAutoComplete);

exports.default = _default;
