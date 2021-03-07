'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
var _exportNames = {
  MessageActionsBox: true,
};
Object.defineProperty(exports, 'MessageActionsBox', {
  enumerable: true,
  get: function get() {
    return _MessageActionsBox.default;
  },
});

var _MessageActionsBox = _interopRequireDefault(require('./MessageActionsBox'));

var _MessageActions = require('./MessageActions');

Object.keys(_MessageActions).forEach(function (key) {
  if (key === 'default' || key === '__esModule') return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _MessageActions[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _MessageActions[key];
    },
  });
});
