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
var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var prop_types_1 = __importDefault(require('prop-types'));
var emoji_mart_1 = require('emoji-mart');
var utils_1 = require('../utils');
var SimpleReactionsList = /** @class */ (function(_super) {
  __extends(SimpleReactionsList, _super);
  function SimpleReactionsList() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.state = {
      showTooltip: false,
      users: [],
    };
    _this.showTooltip = function() {
      _this.setState({
        showTooltip: true,
      });
    };
    _this.hideTooltip = function() {
      _this.setState({
        showTooltip: false,
      });
    };
    _this.handleReaction = function(e, type) {
      if (e !== undefined && e.preventDefault) {
        e.preventDefault();
      }
      _this.props.handleReaction(type);
      _this.setUsernames(type);
    };
    _this.getReactionCount = function() {
      var reaction_counts = _this.props.reaction_counts;
      var count = null;
      if (
        reaction_counts !== null &&
        reaction_counts !== undefined &&
        Object.keys(reaction_counts).length > 0
      ) {
        count = 0;
        Object.keys(reaction_counts).map(function(key) {
          return (count += reaction_counts[key]);
        });
      }
      return count;
    };
    _this.renderUsers = function(users) {
      return users.map(function(user, i) {
        var text = user;
        if (i + 1 < users.length) {
          text += ', ';
        }
        return react_1.default.createElement(
          'span',
          { className: 'latest-user-username', key: 'key-' + i + '-' + user },
          text,
        );
      });
    };
    _this.getReactionsByType = function(reactions) {
      var reactionsByType = {};
      reactions.map(function(item) {
        if (reactionsByType[item.type] === undefined) {
          return (reactionsByType[item.type] = [item]);
        } else {
          return (reactionsByType[item.type] = __spreadArrays(
            reactionsByType[item.type],
            [item],
          ));
        }
      });
      return reactionsByType;
    };
    _this.renderReactions = function(reactions) {
      var reactionsByType = _this.getReactionsByType(reactions);
      var reactionsEmojis = _this.props.reactionOptions.reduce(function(
        acc,
        cur,
      ) {
        var _a;
        return __assign(__assign({}, acc), ((_a = {}), (_a[cur.id] = cur), _a));
      },
      {});
      return Object.keys(reactionsByType).map(function(type, i) {
        return react_1.default.createElement(
          'li',
          {
            className: 'str-chat__simple-reactions-list-item',
            key: reactionsByType[type][0].id + '-' + i,
            onClick: function(e) {
              return _this.handleReaction(e, type);
            },
          },
          react_1.default.createElement(
            'span',
            {
              onMouseEnter: function() {
                return _this.setUsernames(type);
              },
            },
            react_1.default.createElement(
              emoji_mart_1.NimbleEmoji,
              __assign({ emoji: reactionsEmojis[type] }, utils_1.emojiSetDef, {
                size: 13,
                data: utils_1.emojiData,
              }),
            ),
            '\u00A0',
          ),
        );
      });
    };
    _this.getUsernames = function(reactions) {
      return reactions.map(function(item) {
        return item.user !== null ? item.user.name || item.user.id : 'null';
      });
    };
    _this.setUsernames = function(type) {
      var reactionsByType = _this.getReactionsByType(_this.props.reactions);
      var reactions = reactionsByType[type];
      var users = _this.getUsernames(reactions);
      _this.setState(
        {
          users: users,
        },
        function() {
          return _this.showTooltip();
        },
      );
    };
    _this.renderUsernames = function(users) {
      return users.join(', ');
    };
    return _this;
  }
  SimpleReactionsList.prototype.render = function() {
    var reactions = this.props.reactions;
    if (!reactions || reactions.length === 0) {
      return null;
    }
    return react_1.default.createElement(
      'ul',
      {
        className: 'str-chat__simple-reactions-list',
        onMouseLeave: this.hideTooltip,
      },
      this.state.showTooltip &&
        react_1.default.createElement(
          'div',
          {
            className: 'str-chat__simple-reactions-list-tooltip',
            ref: this.reactionSelectorTooltip,
          },
          react_1.default.createElement('div', { className: 'arrow' }),
          this.renderUsernames(this.state.users),
        ),
      this.renderReactions(reactions),
      reactions.length !== 0 &&
        react_1.default.createElement(
          'li',
          { className: 'str-chat__simple-reactions-list-item--last-number' },
          this.getReactionCount(),
        ),
    );
  };
  SimpleReactionsList.propTypes = {
    reactions: prop_types_1.default.array,
    /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
    reaction_counts: prop_types_1.default.object,
    showTooltip: prop_types_1.default.bool,
    /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
    reactionOptions: prop_types_1.default.array,
    /**
     * Handler to set/unset reaction on message.
     *
     * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
     * */
    handleReaction: prop_types_1.default.func,
  };
  SimpleReactionsList.defaultProps = {
    showTooltip: true,
    reactionOptions: utils_1.defaultMinimalEmojis,
    emojiSetDef: utils_1.emojiSetDef,
  };
  return SimpleReactionsList;
})(react_1.default.PureComponent);
exports.SimpleReactionsList = SimpleReactionsList;
