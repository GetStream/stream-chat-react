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
var LoadingChannels_1 = require("./LoadingChannels");
var ChatDown_1 = require("./ChatDown");
var context_1 = require("../context");
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ./examples/ChannelList.md
 */
var ChannelListMessenger = /** @class */ (function (_super) {
    __extends(ChannelListMessenger, _super);
    function ChannelListMessenger() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChannelListMessenger.prototype.render = function () {
        var _a = this.props, error = _a.error, loading = _a.loading, LoadingErrorIndicator = _a.LoadingErrorIndicator, LoadingIndicator = _a.LoadingIndicator;
        if (error) {
            return react_1.default.createElement(LoadingErrorIndicator, { type: "Connection Error" });
        }
        else if (loading) {
            return react_1.default.createElement(LoadingIndicator, null);
        }
        else {
            return (react_1.default.createElement("div", { className: "str-chat__channel-list-messenger" },
                react_1.default.createElement("div", { className: "str-chat__channel-list-messenger__main" }, this.props.children)));
        }
    };
    ChannelListMessenger.propTypes = {
        /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
        loading: prop_types_1.default.bool,
        /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
        error: prop_types_1.default.bool,
        /**
         * Loading indicator UI Component. It will be displayed if `loading` prop is true.
         *
         * Defaults to and accepts same props as:
         * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
         *
         */
        LoadingIndicator: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         * Error indicator UI Component. It will be displayed if `error` prop is true
         *
         * Defaults to and accepts same props as:
         * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
         *
         */
        LoadingErrorIndicator: prop_types_1.default.oneOfType([
            prop_types_1.default.node,
            prop_types_1.default.func,
        ]),
    };
    ChannelListMessenger.defaultProps = {
        error: false,
        LoadingIndicator: LoadingChannels_1.LoadingChannels,
        LoadingErrorIndicator: ChatDown_1.ChatDown,
    };
    return ChannelListMessenger;
}(react_1.PureComponent));
exports.ChannelListMessenger = ChannelListMessenger;
exports.ChannelListMessenger = ChannelListMessenger = context_1.withChatContext(ChannelListMessenger);
