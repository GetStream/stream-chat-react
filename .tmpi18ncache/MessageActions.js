'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.MessageActions = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _MessageActionsBox = _interopRequireDefault(require('./MessageActionsBox'));

var _hooks = require('../Message/hooks');

var _utils = require('../Message/utils');

var _context = require('../../context');

/**
 * @type { React.FC<import('types').MessageActionsProps> }
 */
var MessageActions = function MessageActions(props) {
  var addNotification = props.addNotification,
    customWrapperClass = props.customWrapperClass,
    getMessageActions = props.getMessageActions,
    getFlagMessageErrorNotification = props.getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification = props.getFlagMessageSuccessNotification,
    getMuteUserErrorNotification = props.getMuteUserErrorNotification,
    getMuteUserSuccessNotification = props.getMuteUserSuccessNotification,
    getPinMessageErrorNotification = props.getPinMessageErrorNotification,
    propHandleDelete = props.handleDelete,
    propHandleFlag = props.handleFlag,
    propHandleMute = props.handleMute,
    propHandlePin = props.handlePin,
    inline = props.inline,
    message = props.message,
    messageListRect = props.messageListRect,
    messageWrapperRef = props.messageWrapperRef,
    _props$pinPermissions = props.pinPermissions,
    pinPermissions =
      _props$pinPermissions === void 0
        ? _utils.defaultPinPermissions
        : _props$pinPermissions,
    setEditingState = props.setEditingState;

  var _useContext = (0, _react.useContext)(_context.ChatContext),
    mutes = _useContext.mutes;

  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    actionsBoxOpen = _useState2[0],
    setActionsBoxOpen = _useState2[1];

  var _useUserRole = (0, _hooks.useUserRole)(message),
    isMyMessage = _useUserRole.isMyMessage;

  var handleDelete = (0, _hooks.useDeleteHandler)(message);
  var handleFlag = (0, _hooks.useFlagHandler)(message, {
    notify: addNotification,
    getSuccessNotification: getFlagMessageErrorNotification,
    getErrorNotification: getFlagMessageSuccessNotification,
  });
  var handleMute = (0, _hooks.useMuteHandler)(message, {
    notify: addNotification,
    getErrorNotification: getMuteUserSuccessNotification,
    getSuccessNotification: getMuteUserErrorNotification,
  });

  var _usePinHandler = (0, _hooks.usePinHandler)(message, pinPermissions, {
      notify: addNotification,
      getErrorNotification: getPinMessageErrorNotification,
    }),
    handlePin = _usePinHandler.handlePin;

  var isMuted = (0, _react.useCallback)(
    function () {
      return (0, _utils.isUserMuted)(message, mutes);
    },
    [message, mutes],
  );
  var hideOptions = (0, _react.useCallback)(function () {
    return setActionsBoxOpen(false);
  }, []);
  var messageActions = getMessageActions();
  var messageDeletedAt = !!(
    message !== null &&
    message !== void 0 &&
    message.deleted_at
  );
  (0, _react.useEffect)(
    function () {
      if (
        messageWrapperRef !== null &&
        messageWrapperRef !== void 0 &&
        messageWrapperRef.current
      ) {
        messageWrapperRef.current.addEventListener('onMouseLeave', hideOptions);
      }
    },
    [messageWrapperRef, hideOptions],
  );
  (0, _react.useEffect)(
    function () {
      if (messageDeletedAt) {
        document.removeEventListener('click', hideOptions);
      }
    },
    [messageDeletedAt, hideOptions],
  );
  (0, _react.useEffect)(
    function () {
      if (actionsBoxOpen) {
        document.addEventListener('click', hideOptions);
      } else {
        document.removeEventListener('click', hideOptions);
      }

      return function () {
        return document.removeEventListener('click', hideOptions);
      };
    },
    [actionsBoxOpen, hideOptions],
  );
  if (messageActions.length === 0) return null;
  return /*#__PURE__*/ _react.default.createElement(
    MessageActionsWrapper,
    {
      customWrapperClass: customWrapperClass,
      inline: inline,
      setActionsBoxOpen: setActionsBoxOpen,
    },
    /*#__PURE__*/ _react.default.createElement(_MessageActionsBox.default, {
      getMessageActions: getMessageActions,
      handleDelete: propHandleDelete || handleDelete,
      handleEdit: setEditingState,
      handleFlag: propHandleFlag || handleFlag,
      handleMute: propHandleMute || handleMute,
      handlePin: propHandlePin || handlePin,
      isUserMuted: isMuted,
      message: message,
      messageListRect: messageListRect,
      mine: isMyMessage,
      open: actionsBoxOpen,
    }),
    /*#__PURE__*/ _react.default.createElement(
      'svg',
      {
        width: '11',
        height: '4',
        viewBox: '0 0 11 4',
        xmlns: 'http://www.w3.org/2000/svg',
      },
      /*#__PURE__*/ _react.default.createElement('path', {
        d:
          'M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
        fillRule: 'nonzero',
      }),
    ),
  );
};
/**
 * This is a workaround to encompass the different styles message actions can have at the moment
 * while allowing for sharing the component's stateful logic.
 * @type { React.FC<import('types').MessageActionsWrapperProps> }
 */

exports.MessageActions = MessageActions;

var MessageActionsWrapper = function MessageActionsWrapper(props) {
  var children = props.children,
    customWrapperClass = props.customWrapperClass,
    inline = props.inline,
    setActionsBoxOpen = props.setActionsBoxOpen;
  var defaultWrapperClass =
    'str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options';
  var wrapperClass =
    typeof customWrapperClass === 'string'
      ? customWrapperClass
      : defaultWrapperClass;
  /** @type {(e: React.MouseEvent) => void} Typescript syntax */

  var onClickOptionsAction = function onClickOptionsAction(e) {
    e.stopPropagation();
    setActionsBoxOpen(true);
  };

  var wrapperProps = {
    'data-testid': 'message-actions',
    onClick: onClickOptionsAction,
    className: wrapperClass,
  };
  if (inline)
    return /*#__PURE__*/ _react.default.createElement(
      'span',
      wrapperProps,
      children,
    );
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    wrapperProps,
    children,
  );
};
