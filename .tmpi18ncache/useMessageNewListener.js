'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useMessageNewListener = void 0;

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _react = require('react');

var _lodash = _interopRequireDefault(require('lodash.uniqby'));

var _context = require('../../../context');

var _utils = require('../utils');

// @ts-check

/**
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {boolean} [lockChannelOrder]
 */
var useMessageNewListener = function useMessageNewListener(setChannels) {
  var lockChannelOrder =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var allowNewMessagesFromUnfilteredChannels =
    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client;

  (0, _react.useEffect)(
    function () {
      /** @param {import('stream-chat').Event} event */
      var handleEvent = function handleEvent(event) {
        setChannels(function (channels) {
          var channelInList =
            channels.filter(function (channel) {
              return channel.cid === event.cid;
            }).length > 0;

          if (
            !channelInList &&
            allowNewMessagesFromUnfilteredChannels &&
            event.channel_type
          ) {
            var channel = client.channel(event.channel_type, event.channel_id);
            return (0, _lodash.default)(
              [channel].concat((0, _toConsumableArray2.default)(channels)),
              'cid',
            );
          }

          if (!lockChannelOrder)
            return (0, _utils.moveChannelUp)(event.cid, channels);
          return channels;
        });
      };

      client.on('message.new', handleEvent);
      return function () {
        client.off('message.new', handleEvent);
      }; // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [lockChannelOrder],
  );
};

exports.useMessageNewListener = useMessageNewListener;
