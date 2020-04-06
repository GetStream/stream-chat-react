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
var Avatar_1 = require("./Avatar");
var prop_types_1 = __importDefault(require("prop-types"));
var context_1 = require("../context");
var EventComponent = /** @class */ (function (_super) {
    __extends(EventComponent, _super);
    function EventComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EventComponent.prototype.render = function () {
        var _a = this.props, message = _a.message, tDateTimeParser = _a.tDateTimeParser;
        if (message.type === 'system') {
            return (react_1.default.createElement("div", { className: "str-chat__message--system" },
                react_1.default.createElement("div", { className: "str-chat__message--system__text" },
                    react_1.default.createElement("div", { className: "str-chat__message--system__line" }),
                    react_1.default.createElement("p", null, message.text),
                    react_1.default.createElement("div", { className: "str-chat__message--system__line" })),
                react_1.default.createElement("div", { className: "str-chat__message--system__date" },
                    react_1.default.createElement("strong", null,
                        tDateTimeParser(message.created_at).format('dddd'),
                        ' '),
                    "at ",
                    tDateTimeParser(message.created_at).format('hh:mm A'))));
        }
        if (message.type === 'channel.event' &&
            (message.event.type === 'member.removed' ||
                message.event.type === 'member.added')) {
            var sentence = void 0;
            switch (message.event.type) {
                case 'member.removed':
                    sentence = (message.event.user.name ||
                        message.event.user.id) + " was removed from the chat";
                    break;
                case 'member.added':
                    sentence = (message.event.user.name ||
                        message.event.user.id) + " has joined the chat";
                    break;
                default:
                    break;
            }
            return (react_1.default.createElement("div", { className: "str-chat__event-component__channel-event" },
                react_1.default.createElement(Avatar_1.Avatar, { image: message.event.user.image, name: message.event.user.name || message.event.user.id }),
                react_1.default.createElement("div", { className: "str-chat__event-component__channel-event__content" },
                    react_1.default.createElement("em", { className: "str-chat__event-component__channel-event__sentence" }, sentence),
                    react_1.default.createElement("div", { className: "str-chat__event-component__channel-event__date" }, tDateTimeParser(message.created_at).format('LT')))));
        }
        return null;
    };
    EventComponent.propTypes = {
        /** Message object */
        message: prop_types_1.default.object,
    };
    return EventComponent;
}(react_1.default.PureComponent));
exports.EventComponent = EventComponent;
exports.EventComponent = EventComponent = context_1.withTranslationContext(EventComponent);
