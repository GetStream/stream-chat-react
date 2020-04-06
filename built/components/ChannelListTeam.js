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
var Avatar_1 = require("./Avatar");
var ChatDown_1 = require("./ChatDown");
var context_1 = require("../context");
var str_chat__icon_chevron_down_svg_1 = __importDefault(require("../assets/str-chat__icon-chevron-down.svg"));
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ./examples/ChannelList.md
 */
var ChannelListTeam = /** @class */ (function (_super) {
    __extends(ChannelListTeam, _super);
    function ChannelListTeam() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChannelListTeam.prototype.render = function () {
        var _a = this.props, showSidebar = _a.showSidebar, LoadingErrorIndicator = _a.LoadingErrorIndicator, LoadingIndicator = _a.LoadingIndicator;
        if (this.props.error) {
            return react_1.default.createElement(LoadingErrorIndicator, { type: "Connection Error" });
        }
        else if (this.props.loading) {
            return react_1.default.createElement(LoadingIndicator, null);
        }
        else {
            return (react_1.default.createElement("div", { className: "str-chat__channel-list-team" },
                showSidebar && (react_1.default.createElement("div", { className: "str-chat__channel-list-team__sidebar" },
                    react_1.default.createElement("div", { className: "str-chat__channel-list-team__sidebar--top" },
                        react_1.default.createElement(Avatar_1.Avatar, { image: this.props.sidebarImage, size: 50 })))),
                react_1.default.createElement("div", { className: "str-chat__channel-list-team__main" },
                    react_1.default.createElement("div", { className: "str-chat__channel-list-team__header" },
                        react_1.default.createElement("div", { className: "str-chat__channel-list-team__header--left" },
                            react_1.default.createElement(Avatar_1.Avatar, { source: this.props.client.user.image, name: this.props.client.user.name || this.props.client.user.id, size: 40 })),
                        react_1.default.createElement("div", { className: "str-chat__channel-list-team__header--middle" },
                            react_1.default.createElement("div", { className: "str-chat__channel-list-team__header--title" }, this.props.client.user.name || this.props.client.user.id),
                            react_1.default.createElement("div", { className: "str-chat__channel-list-team__header--status " + this.props.client.user.status }, this.props.client.user.status)),
                        react_1.default.createElement("div", { className: "str-chat__channel-list-team__header--right" },
                            react_1.default.createElement("button", { className: "str-chat__channel-list-team__header--button" },
                                react_1.default.createElement("img", { src: str_chat__icon_chevron_down_svg_1.default })))),
                    this.props.children)));
        }
    };
    ChannelListTeam.propTypes = {
        /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
        loading: prop_types_1.default.bool,
        /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
        error: prop_types_1.default.bool,
        /** Stream chat client object */
        client: prop_types_1.default.object,
        /** When true, sidebar containing logo of the team is visible */
        showSidebar: prop_types_1.default.bool,
        /** Url for sidebar logo image. */
        sidebarImage: prop_types_1.default.string,
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
    ChannelListTeam.defaultProps = {
        error: false,
        LoadingIndicator: LoadingChannels_1.LoadingChannels,
        LoadingErrorIndicator: ChatDown_1.ChatDown,
    };
    return ChannelListTeam;
}(react_1.PureComponent));
exports.ChannelListTeam = ChannelListTeam;
exports.ChannelListTeam = ChannelListTeam = context_1.withChatContext(ChannelListTeam);
