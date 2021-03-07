'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = exports.KEY_CODES = void 0;

var _classCallCheck2 = _interopRequireDefault(
  require('@babel/runtime/helpers/classCallCheck'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

/* eslint-disable */
var KEY_CODES = {
  ESC: 27,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  TAB: 9,
  SPACE: 32,
};
exports.KEY_CODES = KEY_CODES;
var keycodeMap = {}; // This is self-made key shortcuts manager, used for caching key strokes

var Listener = function Listener() {
  var _this = this;

  (0, _classCallCheck2.default)(this, Listener);
  (0, _defineProperty2.default)(this, 'startListen', function () {
    if (!_this.refCount) {
      // prevent multiple listeners in case of multiple TextareaAutocomplete components on page
      document.addEventListener('keydown', _this.f);
      document.addEventListener('keyup', _this.f);
    }

    _this.refCount++;
  });
  (0, _defineProperty2.default)(this, 'stopListen', function () {
    _this.refCount--;

    if (!_this.refCount) {
      // prevent disable listening in case of multiple TextareaAutocomplete components on page
      document.removeEventListener('keydown', _this.f);
      document.removeEventListener('keyup', _this.f);
    }
  });
  (0, _defineProperty2.default)(
    this,
    'checkKeycodeSubmitValues',
    function (keycodes) {
      // array of numbers
      var shiftE = [16, 13]; // shift+Enter

      var ctrlE = [17, 13]; // ctrl+Enter

      var cmdE = [91, 13]; // cmd+Enter

      return (
        keycodes.every(function (code) {
          return shiftE.includes(code);
        }) ||
        keycodes.every(function (code) {
          return ctrlE.includes(code);
        }) ||
        keycodes.every(function (code) {
          return cmdE.includes(code);
        })
      );
    },
  );
  (0, _defineProperty2.default)(this, 'add', function (keyCodes, fn) {
    var keyCode = keyCodes;
    if (typeof keyCode !== 'object') keyCode = [keyCode];
    _this.listeners[_this.index] = {
      keyCode,
      fn,
    };
    _this.index += 1;
    return _this.index;
  });
  (0, _defineProperty2.default)(this, 'remove', function (id) {
    delete _this.listeners[id];
  });
  (0, _defineProperty2.default)(this, 'removeAll', function () {
    _this.listeners = {};
    _this.index = 0;
  });
  this.index = 0;
  this.listeners = {};
  this.refCount = 0;

  this.f = function (e) {
    console.log('this.listeners IS:', _this.listeners);
    var code = e.keyCode || e.which;
    keycodeMap[code] = e.type === 'keydown';
    if (e.type !== 'keydown') return;
    Object.values(_this.listeners).forEach(function (_ref) {
      var keyCode = _ref.keyCode,
        fn = _ref.fn;
      console.log('keycodeMap IS:', keycodeMap);
      console.log('keyCOde IS:', keyCode);

      if (keyCode.length > 1) {
        if (
          keyCode.every(function (keycode) {
            return keycodeMap[keycode];
          })
        ) {
          console.log('in the every');
          fn(e);
        }
      } else if (keyCode.includes(code) && keycodeMap[code]) {
        fn(e);
      }
    });
  };
};

var _default = new Listener();

exports.default = _default;
