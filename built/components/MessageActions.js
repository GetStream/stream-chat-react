"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importStar(require("react"));
var prop_types_1 = __importDefault(require("prop-types"));
var MessageActionsBox_1 = require("./MessageActionsBox");
var MessageActions = /** @class */ (function (_super) {
    __extends(MessageActions, _super);
    function MessageActions(props) {
        var _this = _super.call(this, props) || this;
        _this._openActionBox = function () {
            _this.setState({
                actionBox: true,
            }, function () {
                document.addEventListener('click', _this._closeActionBox);
            });
        };
        _this._closeActionBox = function () {
            _this.setState({
                actionBox: false,
            }, function () {
                document.removeEventListener('click', _this._closeActionBox);
            });
        };
        _this.state = {
            actionBox: false,
            reactionBox: false,
        };
        _this.reactionsBox = react_1.default.createRef();
        _this.actionsRef = react_1.default.createRef();
        return _this;
    }
    MessageActions.prototype.componentWillUnmount = function () {
        document.removeEventListener('click', this._closeActionBox);
    };
    MessageActions.prototype.render = function () {
        var _this = this;
        return (react_1.default.createElement("div", { ref: this.actionsRef, className: "str-chat__message-actions" },
            react_1.default.createElement("div", { className: "str-chat__message-actions-reactions", onClick: this.props.onClickReact },
                react_1.default.createElement("svg", { width: "20", height: "18", viewBox: "0 0 20 18", xmlns: "http://www.w3.org/2000/svg" },
                    react_1.default.createElement("path", { d: "M16.5 4.5H15a.5.5 0 1 1 0-1h1.5V2a.5.5 0 1 1 1 0v1.5H19a.5.5 0 1 1 0 1h-1.5V6a.5.5 0 1 1-1 0V4.5zM9 13c-1.773 0-3.297-.82-4-2h8c-.703 1.18-2.227 2-4 2zm4.057-11.468a.5.5 0 1 1-.479.878A7.45 7.45 0 0 0 9 1.5C4.865 1.5 1.5 4.865 1.5 9s3.365 7.5 7.5 7.5 7.5-3.365 7.5-7.5c0-.315-.02-.628-.058-.937a.5.5 0 1 1 .992-.124c.044.35.066.704.066 1.06 0 4.688-3.813 8.501-8.5 8.501C4.313 17.5.5 13.687.5 9 .5 4.312 4.313.5 9 .5a8.45 8.45 0 0 1 4.057 1.032zM7.561 5.44a1.5 1.5 0 1 1-2.123 2.122 1.5 1.5 0 0 1 2.123-2.122zm5 0a1.5 1.5 0 1 1-2.122 2.122 1.5 1.5 0 0 1 2.122-2.122z", fillRule: "evenodd" }))),
            react_1.default.createElement("div", { className: "str-chat__message-actions-options", onClick: function () { return _this._openActionBox(); } },
                react_1.default.createElement("svg", { width: "11", height: "3", viewBox: "0 0 11 3", xmlns: "http://www.w3.org/2000/svg" },
                    react_1.default.createElement("path", { d: "M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z", fillRule: "nonzero" }))),
            react_1.default.createElement(MessageActionsBox_1.MessageActionsBox, __assign({}, this.props, { open: this.state.actionBox }))));
    };
    MessageActions.propTypes = {
        onClickReact: prop_types_1.default.func,
        /** If the message actions box should be open or not */
        open: prop_types_1.default.bool.isRequired,
        /**
         * @deprecated
         *
         *  The message component, most logic is delegated to this component and MessageActionsBox uses the following functions explicitly:
         *  `handleFlag`, `handleMute`, `handleEdit`, `handleDelete`, `canDeleteMessage`, `canEditMessage`, `isMyMessage`, `isAdmin`
         */
        Message: prop_types_1.default.oneOfType([
            prop_types_1.default.node,
            prop_types_1.default.func,
            prop_types_1.default.object,
        ]).isRequired,
        /** If message belongs to current user. */
        mine: prop_types_1.default.bool,
        /** DOMRect object for parent MessageList component */
        messageListRect: prop_types_1.default.object,
        /**
         * Handler for flaging a current message
         *
         * @param event React's MouseEventHandler event
         * @returns void
         * */
        handleFlag: prop_types_1.default.func,
        /**
         * Handler for muting a current message
         *
         * @param event React's MouseEventHandler event
         * @returns void
         * */
        handleMute: prop_types_1.default.func,
        /**
         * Handler for editing a current message
         *
         * @param event React's MouseEventHandler event
         * @returns void
         * */
        handleEdit: prop_types_1.default.func,
        /**
         * Handler for deleting a current message
         *
         * @param event React's MouseEventHandler event
         * @returns void
         * */
        handleDelete: prop_types_1.default.func,
        /**
         * Returns array of avalable message actions for current message.
         * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
         */
        getMessageActions: prop_types_1.default.func,
    };
    return MessageActions;
}(react_1.PureComponent));
exports.MessageActions = MessageActions;
MessageActions.propTypes = {
    Message: prop_types_1.default.object.isRequired,
};
