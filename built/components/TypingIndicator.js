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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var prop_types_1 = __importDefault(require("prop-types"));
var Avatar_1 = require("./Avatar");
var TypingIndicator = /** @class */ (function (_super) {
    __extends(TypingIndicator, _super);
    function TypingIndicator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TypingIndicator.prototype.render = function () {
        // if (Object.keys(this.props.typing).length <= 0) {
        //   return null;
        // }
        var _this = this;
        var typing = Object.values(this.props.typing);
        var show;
        if (typing.length === 0 ||
            (typing.length === 1 && typing[0].user.id === this.props.client.user.id)) {
            show = false;
        }
        else {
            show = true;
        }
        return (react_1.default.createElement("div", { className: "str-chat__typing-indicator " + (show ? 'str-chat__typing-indicator--typing' : '') },
            react_1.default.createElement("div", { className: "str-chat__typing-indicator__avatars" }, typing
                .filter(function (_a) {
                var user = _a.user;
                return user.id !== _this.props.client.user.id;
            })
                .map(function (_a) {
                var user = _a.user;
                return (react_1.default.createElement(Avatar_1.Avatar, { image: user.image, size: 32, name: user.name || user.id, key: user.id }));
            })),
            react_1.default.createElement("div", { className: "str-chat__typing-indicator__dots" },
                react_1.default.createElement("span", { className: "str-chat__typing-indicator__dot" }),
                react_1.default.createElement("span", { className: "str-chat__typing-indicator__dot" }),
                react_1.default.createElement("span", { className: "str-chat__typing-indicator__dot" }))));
    };
    TypingIndicator.propTypes = {
        /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chatcontext) doc */
        client: prop_types_1.default.object,
        /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channelcontext) doc */
        typing: prop_types_1.default.object,
    };
    return TypingIndicator;
}(react_1.default.PureComponent));
exports.TypingIndicator = TypingIndicator;
