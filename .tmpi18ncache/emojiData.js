'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getStrippedEmojiData = exports.defaultMinimalEmojis = exports.commonEmoji = exports.emojiSetDef = void 0;

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

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

var emojiSetDef = {
  spriteUrl: 'https://getstream.imgix.net/images/emoji-sprite.png',
  size: 20,
  sheetColumns: 2,
  sheetRows: 3,
  sheetSize: 64,
};
/** @type {import("types").commonEmojiInterface} */

exports.emojiSetDef = emojiSetDef;
var commonEmoji = {
  emoticons: [],
  short_names: [],
  custom: true,
};
/** @type {import("types").MinimalEmojiInterface[]} */

exports.commonEmoji = commonEmoji;
var defaultMinimalEmojis = [
  _objectSpread(
    _objectSpread(
      {
        id: 'like',
        name: 'like',
        colons: ':+1:',
        sheet_x: 0,
        sheet_y: 0,
      },
      commonEmoji,
    ),
    emojiSetDef,
  ),
  _objectSpread(
    _objectSpread(
      {
        id: 'love',
        name: 'love',
        colons: ':heart:',
        sheet_x: 1,
        sheet_y: 2,
      },
      commonEmoji,
    ),
    emojiSetDef,
  ),
  _objectSpread(
    _objectSpread(
      {
        id: 'haha',
        name: 'haha',
        colons: ':joy:',
        sheet_x: 1,
        sheet_y: 0,
      },
      commonEmoji,
    ),
    emojiSetDef,
  ),
  _objectSpread(
    _objectSpread(
      {
        id: 'wow',
        name: 'wow',
        colons: ':astonished:',
        sheet_x: 0,
        sheet_y: 2,
      },
      commonEmoji,
    ),
    emojiSetDef,
  ),
  _objectSpread(
    _objectSpread(
      {
        id: 'sad',
        name: 'sad',
        colons: ':pensive:',
        sheet_x: 0,
        sheet_y: 1,
      },
      commonEmoji,
    ),
    emojiSetDef,
  ),
  _objectSpread(
    _objectSpread(
      {
        id: 'angry',
        name: 'angry',
        colons: ':angry:',
        sheet_x: 1,
        sheet_y: 1,
      },
      commonEmoji,
    ),
    emojiSetDef,
  ),
]; // use this only for small lists like in ReactionSelector

/** @typedef {import('emoji-mart').Data} EmojiData
 * @type {(data: EmojiData) => EmojiData}
 */

exports.defaultMinimalEmojis = defaultMinimalEmojis;

var getStrippedEmojiData = function getStrippedEmojiData(data) {
  return _objectSpread(
    _objectSpread({}, data),
    {},
    {
      emojis: {},
    },
  );
};

exports.getStrippedEmojiData = getStrippedEmojiData;
