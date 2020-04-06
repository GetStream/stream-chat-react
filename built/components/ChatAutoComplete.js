'use strict';
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importStar(require('react'));
var prop_types_1 = __importDefault(require('prop-types'));
var AutoCompleteTextarea_1 = __importDefault(require('./AutoCompleteTextarea'));
var LoadingIndicator_1 = require('./LoadingIndicator');
// import '@webscopeio/react-textarea-autocomplete/style.css';
var emoji_mart_1 = require('emoji-mart');
var EmoticonItem_1 = require('./EmoticonItem');
var UserItem_1 = require('./UserItem');
var CommandItem_1 = require('./CommandItem');
/**
 * Textarea component with included autocomplete options. You can set your own commands and
 * @example ./docs/ChatAutoComplete.md
 */
var ChatAutoComplete = /** @class */ (function(_super) {
  __extends(ChatAutoComplete, _super);
  function ChatAutoComplete() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  ChatAutoComplete.prototype.getTriggers = function() {
    var _this = this;
    return {
      ':': {
        dataProvider: function(q) {
          if (q.length === 0 || q.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
            return [];
          }
          var emojis = emoji_mart_1.emojiIndex.search(q) || [];
          return emojis.slice(0, 10);
        },
        component: EmoticonItem_1.EmoticonItem,
        output: function(entity) {
          return {
            key: entity.id,
            text: '' + entity.native,
            caretPosition: 'next',
          };
        },
      },
      '@': {
        dataProvider: function(q) {
          var matchingUsers = _this.props.users.filter(function(user) {
            if (
              user.name !== undefined &&
              user.name.toLowerCase().indexOf(q.toLowerCase()) !== -1
            ) {
              return true;
            } else if (user.id.toLowerCase().indexOf(q.toLowerCase()) !== -1) {
              return true;
            } else {
              return false;
            }
          });
          return matchingUsers.slice(0, 10);
        },
        component: UserItem_1.UserItem,
        output: function(entity) {
          return {
            key: entity.id,
            text: '@' + (entity.name || entity.id),
            caretPosition: 'next',
          };
        },
        callback: function(item) {
          return _this.props.onSelectItem(item);
        },
      },
      '/': {
        dataProvider: function(q, text) {
          if (text.indexOf('/') !== 0) {
            return [];
          }
          var selectedCommands = _this.props.commands.filter(function(c) {
            return c.name.indexOf(q) !== -1;
          });
          // sort alphabetically unless the you're matching the first char
          selectedCommands.sort(function(a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            if (nameA.indexOf(q) === 0) {
              nameA = '0' + nameA;
            }
            if (nameB.indexOf(q) === 0) {
              nameB = '0' + nameB;
            }
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
          return selectedCommands.slice(0, 10);
        },
        component: CommandItem_1.CommandItem,
        output: function(entity) {
          return {
            key: entity.id,
            text: '/' + entity.name,
            caretPosition: 'next',
          };
        },
      },
    };
  };
  ChatAutoComplete.prototype.emojiReplace = function(word) {
    var found = emoji_mart_1.emojiIndex.search(word) || [];
    for (var _i = 0, _a = found.slice(0, 10); _i < _a.length; _i++) {
      var emoji = _a[_i];
      if (emoji.emoticons.includes(word)) {
        return emoji.native;
      }
    }
  };
  ChatAutoComplete.prototype.render = function() {
    var innerRef = this.props.innerRef;
    return react_1.default.createElement(AutoCompleteTextarea_1.default, {
      loadingComponent: LoadingIndicator_1.LoadingIndicator,
      trigger: this.getTriggers(),
      replaceWord: this.emojiReplace,
      minChar: 0,
      maxRows: this.props.maxRows,
      innerRef:
        innerRef &&
        function(ref) {
          innerRef.current = ref;
        },
      onFocus: this.props.onFocus,
      rows: this.props.rows,
      className: 'str-chat__textarea__textarea',
      containerClassName: 'str-chat__textarea',
      dropdownClassName: 'str-chat__emojisearch',
      listClassName: 'str-chat__emojisearch__list',
      itemClassName: 'str-chat__emojisearch__item',
      placeholder: this.props.placeholder,
      onChange: this.props.onChange,
      handleSubmit: this.props.handleSubmit,
      onPaste: this.props.onPaste,
      value: this.props.value,
      grow: this.props.grow,
      disabled: this.props.disabled,
      additionalTextareaProps: this.props.additionalTextareaProps,
    });
  };
  ChatAutoComplete.propTypes = {
    /** The number of rows you want the textarea to have */
    rows: prop_types_1.default.number,
    /** Grow the number of rows of the textarea while you're typing */
    grow: prop_types_1.default.bool,
    /** Maximum number of rows */
    maxRows: prop_types_1.default.number,
    /** Make the textarea disabled */
    disabled: prop_types_1.default.bool,
    /** The value of the textarea */
    value: prop_types_1.default.string,
    /** Function to run on pasting within the textarea */
    onPaste: prop_types_1.default.func,
    /** Function that runs on submit */
    handleSubmit: prop_types_1.default.func,
    /** Function that runs on change */
    onChange: prop_types_1.default.func,
    /** Placeholder for the textare */
    placeholder: prop_types_1.default.string,
    /** What loading component to use for the auto complete when loading results. */
    LoadingIndicator: prop_types_1.default.node,
    /** Minimum number of Character */
    minChar: prop_types_1.default.number,
    /** Array of [user object](https://getstream.io/chat/docs/#chat-doc-set-user). Used for mentions suggestions */
    users: prop_types_1.default.array,
    /**
     * Handler for selecting item from suggestions list
     *
     * @param item Selected item object.
     *  */
    onSelectItem: prop_types_1.default.func,
    /** Array of [commands](https://getstream.io/chat/docs/#channel_commands) */
    commands: prop_types_1.default.array,
    /** Listener for onfocus event on textarea */
    onFocus: prop_types_1.default.object,
    /**
     * Any additional attrubutes that you may want to add for underlying HTML textarea element.
     */
    additionalTextareaProps: prop_types_1.default.object,
  };
  ChatAutoComplete.defaultProps = {
    rows: 3,
  };
  return ChatAutoComplete;
})(react_1.PureComponent);
exports.ChatAutoComplete = ChatAutoComplete;
