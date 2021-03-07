'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useEditHandler = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = require('react');

// @ts-check

/**
 * @type {(
 *   customInitialState?: boolean,
 *   customSetEditing?: (event?: React.MouseEvent<HTMLElement>) => void,
 *   customClearEditingHandler?: (event?: React.MouseEvent<HTMLElement>) => void
 * ) => {
 *   editing: boolean,
 *   setEdit: (event?: React.MouseEvent<HTMLElement>) => void,
 *   clearEdit: (event?: React.MouseEvent<HTMLElement>) => void
 * }}
 */
var useEditHandler = function useEditHandler() {
  var customInitialState =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var customSetEditing = arguments.length > 1 ? arguments[1] : undefined;
  var customClearEditingHandler =
    arguments.length > 2 ? arguments[2] : undefined;

  var _useState = (0, _react.useState)(customInitialState),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    editing = _useState2[0],
    setEditing = _useState2[1];

  var setEdit =
    customSetEditing ||
    function (event) {
      if (event !== null && event !== void 0 && event.preventDefault) {
        event.preventDefault();
      }

      setEditing(true);
    };

  var clearEdit =
    customClearEditingHandler ||
    function (event) {
      if (event !== null && event !== void 0 && event.preventDefault) {
        event.preventDefault();
      }

      setEditing(false);
    };

  return {
    editing,
    setEdit,
    clearEdit,
  };
};

exports.useEditHandler = useEditHandler;
