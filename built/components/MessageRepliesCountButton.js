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
var context_1 = require("../context");
var MessageRepliesCountButton = /** @class */ (function (_super) {
    __extends(MessageRepliesCountButton, _super);
    function MessageRepliesCountButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MessageRepliesCountButton.prototype.render = function () {
        var _a = this.props, reply_count = _a.reply_count, labelSingle = _a.labelSingle, labelPlural = _a.labelPlural, t = _a.t;
        var singleReplyText;
        var pluralReplyText;
        if (reply_count === 1) {
            if (labelSingle) {
                singleReplyText = "1 " + labelSingle;
            }
            else {
                singleReplyText = t('1 reply');
            }
        }
        if (reply_count > 1) {
            if (labelPlural) {
                pluralReplyText = reply_count + " " + labelPlural;
            }
            else {
                pluralReplyText = t('{{ replyCount }} replies', {
                    replyCount: reply_count,
                });
            }
        }
        if (reply_count && reply_count !== 0) {
            return (react_1.default.createElement("button", { className: "str-chat__message-replies-count-button", onClick: this.props.onClick },
                react_1.default.createElement("svg", { width: "18", height: "15", xmlns: "http://www.w3.org/2000/svg" },
                    react_1.default.createElement("path", { d: "M.56 10.946H.06l-.002-.498L.025.92a.5.5 0 1 1 1-.004l.032 9.029H9.06v-4l9 4.5-9 4.5v-4H.56z", fillRule: "nonzero" })),
                reply_count === 1 ? singleReplyText : pluralReplyText));
        }
        return null;
    };
    MessageRepliesCountButton.propTypes = {
        /** Label for number of replies, when count is 1 */
        labelSingle: prop_types_1.default.string,
        /** Label for number of replies, when count is more than 1 */
        labelPlural: prop_types_1.default.string,
        /** Number of replies */
        reply_count: prop_types_1.default.number,
        /**
         * click handler for button
         * @param event React's MouseEventHandler event
         * @returns void
         * */
        onClick: prop_types_1.default.func,
    };
    MessageRepliesCountButton.defaultProps = {
        reply_count: 0,
    };
    return MessageRepliesCountButton;
}(react_1.default.PureComponent));
exports.MessageRepliesCountButton = MessageRepliesCountButton;
exports.MessageRepliesCountButton = MessageRepliesCountButton = context_1.withTranslationContext(MessageRepliesCountButton);
