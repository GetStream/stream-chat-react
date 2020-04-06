'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
exports.SendButton = function(_a) {
  var sendMessage = _a.sendMessage;
  return react_1.default.createElement(
    'button',
    { className: 'str-chat__send-button', onClick: sendMessage },
    react_1.default.createElement(
      'svg',
      {
        width: '18',
        height: '17',
        viewBox: '0 0 18 17',
        xmlns: 'http://www.w3.org/2000/svg',
      },
      react_1.default.createElement('path', {
        d: 'M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z',
        fillRule: 'evenodd',
        fill: '#006cff',
      }),
    ),
  );
};
