'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useConnectionRecoveredListener = void 0;

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @param {() => void} [forceUpdate]
 */
var useConnectionRecoveredListener = function useConnectionRecoveredListener(
  forceUpdate,
) {
  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client;

  (0, _react.useEffect)(function () {
    var handleEvent = function handleEvent() {
      if (forceUpdate) {
        forceUpdate();
      }
    };

    client.on('connection.recovered', handleEvent);
    return function () {
      client.off('connection.recovered', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

exports.useConnectionRecoveredListener = useConnectionRecoveredListener;
