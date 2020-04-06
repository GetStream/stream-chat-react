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
var Avatar_1 = require("./Avatar");
var context_1 = require("../context");
/**
 * ChannelHeader - Render some basic information about this channel
 *
 * @example ./docs/ChannelHeader.md
 * @extends PureComponent
 */
var ChannelHeader = /** @class */ (function (_super) {
    __extends(ChannelHeader, _super);
    function ChannelHeader() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChannelHeader.prototype.render = function () {
        var _a = this.props, t = _a.t, channel = _a.channel, title = _a.title, live = _a.live, watcher_count = _a.watcher_count;
        return (react_1.default.createElement("div", { className: "str-chat__header-livestream" },
            react_1.default.createElement("div", { className: "str-chat__header-hamburger", onClick: this.props.openMobileNav },
                react_1.default.createElement("span", { className: "str-chat__header-hamburger--line" }),
                react_1.default.createElement("span", { className: "str-chat__header-hamburger--line" }),
                react_1.default.createElement("span", { className: "str-chat__header-hamburger--line" })),
            channel.data.image && (react_1.default.createElement(Avatar_1.Avatar, { image: channel.data.image, shape: "rounded", size: channel.type === 'commerce' ? 60 : 40 })),
            react_1.default.createElement("div", { className: "str-chat__header-livestream-left" },
                react_1.default.createElement("p", { className: "str-chat__header-livestream-left--title" },
                    title || channel.data.name,
                    ' ',
                    live && (react_1.default.createElement("span", { className: "str-chat__header-livestream-left--livelabel" }, t('live')))),
                channel.data.subtitle && (react_1.default.createElement("p", { className: "str-chat__header-livestream-left--subtitle" }, channel.data.subtitle)),
                react_1.default.createElement("p", { className: "str-chat__header-livestream-left--members" },
                    !live && channel.data.member_count > 0 && (react_1.default.createElement(react_1.default.Fragment, null,
                        t('{{ memberCount }} members', {
                            memberCount: channel.data.member_count,
                        }),
                        ",",
                        ' ')),
                    t('{{ watcherCount }} online', { watcherCount: watcher_count })))));
    };
    ChannelHeader.propTypes = {
        /** Set title manually */
        title: prop_types_1.default.string,
        /** Show a little indicator that the channel is live right now */
        live: prop_types_1.default.bool,
        /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#chat)** */
        channel: prop_types_1.default.object.isRequired,
        /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#chat)** */
        watcher_count: prop_types_1.default.number,
    };
    return ChannelHeader;
}(react_1.PureComponent));
exports.ChannelHeader = ChannelHeader;
exports.ChannelHeader = ChannelHeader = context_1.withChatContext(context_1.withChannelContext(context_1.withTranslationContext(ChannelHeader)));
