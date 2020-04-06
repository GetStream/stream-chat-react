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
var Attachment_1 = require("./Attachment");
var ReactionsList_1 = require("./ReactionsList");
var Avatar_1 = require("./Avatar");
var Gallery_1 = require("./Gallery");
var ReactionSelector_1 = require("./ReactionSelector");
var MessageRepliesCountButton_1 = require("./MessageRepliesCountButton");
var prop_types_1 = __importDefault(require("prop-types"));
var utils_1 = require("../utils");
var context_1 = require("../context");
/**
 * MessageCommerce - Render component, should be used together with the Message component
 *
 * @example ./docs/MessageSimple.md
 * @extends PureComponent
 */
var MessageCommerce = /** @class */ (function (_super) {
    __extends(MessageCommerce, _super);
    function MessageCommerce() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            isFocused: false,
            actionsBoxOpen: false,
            showDetailedReactions: false,
        };
        _this.messageActionsRef = react_1.default.createRef();
        _this.reactionSelectorRef = react_1.default.createRef();
        _this._onClickOptionsAction = function () {
            _this.setState({
                actionsBoxOpen: true,
            }, function () { return document.addEventListener('click', _this.hideOptions, false); });
        };
        _this._hideOptions = function () {
            _this.setState({
                actionsBoxOpen: false,
            });
            document.removeEventListener('click', _this.hideOptions, false);
        };
        _this._clickReactionList = function () {
            _this.setState(function () { return ({
                showDetailedReactions: true,
            }); }, function () {
                document.addEventListener('click', _this._closeDetailedReactions);
            });
        };
        _this._closeDetailedReactions = function (e) {
            if (!_this.reactionSelectorRef.current.reactionSelector.current.contains(e.target)) {
                _this.setState(function () { return ({
                    showDetailedReactions: false,
                }); }, function () {
                    document.removeEventListener('click', _this._closeDetailedReactions);
                });
            }
            else {
                return {};
            }
        };
        return _this;
    }
    MessageCommerce.prototype.componentWillUnmount = function () {
        if (!this.props.message.deleted_at) {
            document.removeEventListener('click', this._closeDetailedReactions);
        }
    };
    MessageCommerce.prototype.isMine = function () {
        return !this.props.isMyMessage(this.props.message);
    };
    MessageCommerce.prototype.renderOptions = function () {
        if (this.props.message.type === 'error' ||
            this.props.message.type === 'system' ||
            this.props.message.type === 'ephemeral' ||
            this.props.message.status === 'sending' ||
            this.props.message.status === 'failed' ||
            !this.props.channelConfig.reactions ||
            this.props.initialMessage) {
            return;
        }
        return (react_1.default.createElement("div", { className: "str-chat__message-commerce__actions" },
            react_1.default.createElement("div", { className: "str-chat__message-commerce__actions__action str-chat__message-commerce__actions__action--reactions", onClick: this._clickReactionList },
                react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                    react_1.default.createElement("path", { d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z", fillRule: "evenodd" })))));
    };
    MessageCommerce.prototype.render = function () {
        var _a = this.props, message = _a.message, groupStyles = _a.groupStyles, Attachment = _a.Attachment, handleReaction = _a.handleReaction, handleAction = _a.handleAction, actionsEnabled = _a.actionsEnabled, onMentionsHoverMessage = _a.onMentionsHoverMessage, onMentionsClickMessage = _a.onMentionsClickMessage, unsafeHTML = _a.unsafeHTML, threadList = _a.threadList, handleOpenThread = _a.handleOpenThread, t = _a.t, tDateTimeParser = _a.tDateTimeParser;
        var when = tDateTimeParser(message.created_at).format('LT');
        var messageClasses = this.isMine()
            ? 'str-chat__message-commerce str-chat__message-commerce--left'
            : 'str-chat__message-commerce str-chat__message-commerce--right';
        var hasAttachment = Boolean(message.attachments && message.attachments.length);
        var images = hasAttachment &&
            message.attachments.filter(function (item) { return item.type === 'image'; });
        var hasReactions = Boolean(message.latest_reactions && message.latest_reactions.length);
        if (message.type === 'message.read' ||
            message.deleted_at ||
            message.type === 'message.date') {
            return null;
        }
        if (message.deleted_at) {
            return (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("span", { key: message.id, className: messageClasses + " str-chat__message--deleted" }, t('This message was deleted...')),
                react_1.default.createElement("div", { className: "clearfix" })));
        }
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { key: message.id, className: ("\n\t\t\t\t\t\t" + messageClasses + "\n\t\t\t\t\t\tstr-chat__message-commerce--" + message.type + "\n\t\t\t\t\t\t" + (message.text
                    ? 'str-chat__message-commerce--has-text'
                    : 'str-chat__message-commerce--has-no-text') + "\n\t\t\t\t\t\t" + (hasAttachment ? 'str-chat__message-commerce--has-attachment' : '') + "\n\t\t\t\t\t\t" + (hasReactions ? 'str-chat__message-commerce--with-reactions' : '') + "\n\t\t\t\t\t\t" + ("str-chat__message-commerce--" + groupStyles[0]) + "\n\t\t\t\t\t").trim(), onMouseLeave: this._hideOptions, ref: this.messageRef },
                (groupStyles[0] === 'bottom' || groupStyles[0] === 'single') && (react_1.default.createElement(Avatar_1.Avatar, { image: message.user.image, size: 32, name: message.user.name || message.user.id })),
                react_1.default.createElement("div", { className: "str-chat__message-commerce-inner" },
                    !message.text && (react_1.default.createElement(react_1.default.Fragment, null,
                        this.renderOptions(),
                        hasReactions && !this.state.showDetailedReactions && (react_1.default.createElement(ReactionsList_1.ReactionsList, { reactions: message.latest_reactions, reaction_counts: message.reaction_counts, onClick: this._clickReactionList })),
                        this.state.showDetailedReactions && (react_1.default.createElement(ReactionSelector_1.ReactionSelector, { reverse: false, handleReaction: handleReaction, actionsEnabled: actionsEnabled, detailedView: true, reaction_counts: message.reaction_counts, latest_reactions: message.latest_reactions, ref: this.reactionSelectorRef })))),
                    hasAttachment &&
                        images.length <= 1 &&
                        message.attachments.map(function (attachment, index) { return (react_1.default.createElement(Attachment, { key: message.id + "-" + index, attachment: attachment, actionHandler: handleAction })); }),
                    images.length > 1 && react_1.default.createElement(Gallery_1.Gallery, { images: images }),
                    message.text && (react_1.default.createElement("div", { className: "str-chat__message-commerce-text" },
                        react_1.default.createElement("div", { className: ("str-chat__message-commerce-text-inner\n\t\t\t\t\t\t\t\t\t" + (hasAttachment ? 'str-chat__message-commerce-text-inner--has-attachment' : '') + "\n\t\t\t\t\t\t\t\t\t" + (utils_1.isOnlyEmojis(message.text)
                                ? 'str-chat__message-commerce-text-inner--is-emoji'
                                : '') + "\n                ").trim(), onMouseOver: onMentionsHoverMessage, onClick: onMentionsClickMessage },
                            message.type === 'error' && (react_1.default.createElement("div", { className: "str-chat__commerce-message--error-message" }, t('Error · Unsent'))),
                            unsafeHTML ? (react_1.default.createElement("div", { dangerouslySetInnerHTML: { __html: message.html } })) : (utils_1.renderText(message)),
                            hasReactions && !this.state.showDetailedReactions && (react_1.default.createElement(ReactionsList_1.ReactionsList, { reverse: true, reactions: message.latest_reactions, reaction_counts: message.reaction_counts, onClick: this._clickReactionList })),
                            this.state.showDetailedReactions && (react_1.default.createElement(ReactionSelector_1.ReactionSelector, { reverse: false, handleReaction: handleReaction, actionsEnabled: actionsEnabled, detailedView: true, reaction_counts: message.reaction_counts, latest_reactions: message.latest_reactions, ref: this.reactionSelectorRef }))),
                        message.text && this.renderOptions())),
                    !threadList && (react_1.default.createElement("div", { className: "str-chat__message-commerce-reply-button" },
                        react_1.default.createElement(MessageRepliesCountButton_1.MessageRepliesCountButton, { onClick: handleOpenThread, reply_count: message.reply_count }))),
                    react_1.default.createElement("div", { className: "str-chat__message-commerce-data" },
                        this.isMine() ? (react_1.default.createElement("span", { className: "str-chat__message-commerce-name" }, message.user.name || message.user.id)) : null,
                        react_1.default.createElement("span", { className: "str-chat__message-commerce-timestamp" }, when))))));
    };
    MessageCommerce.propTypes = {
        /** The [message object](https://getstream.io/chat/docs/#message_format) */
        message: prop_types_1.default.object,
        /**
         * The attachment UI component.
         * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
         * */
        Attachment: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         *
         * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
         *
         * The higher order message component, most logic is delegated to this component
         * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
         *
         * */
        Message: prop_types_1.default.oneOfType([
            prop_types_1.default.node,
            prop_types_1.default.func,
            prop_types_1.default.object,
        ]).isRequired,
        /** render HTML instead of markdown. Posting HTML is only allowed server-side */
        unsafeHTML: prop_types_1.default.bool,
        /** If its parent message in thread. */
        initialMessage: prop_types_1.default.bool,
        /** Channel config object */
        channelConfig: prop_types_1.default.object,
        /** If component is in thread list */
        threadList: prop_types_1.default.bool,
        /** Function to open thread on current messxage */
        handleOpenThread: prop_types_1.default.func,
        /** Returns true if message belongs to current user */
        isMyMessage: prop_types_1.default.func,
        /** Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute] */
        getMessageActions: prop_types_1.default.func,
        /**
         * Add or remove reaction on message
         *
         * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
         * @param event Dom event which triggered this function
         */
        handleReaction: prop_types_1.default.func,
        /** If actions such as edit, delete, flag, mute are enabled on message */
        actionsEnabled: prop_types_1.default.bool,
        /**
         * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
         *
         * @param name {string} Name of action
         * @param value {string} Value of action
         * @param event Dom event that triggered this handler
         */
        handleAction: prop_types_1.default.func,
        /**
         * The handler for hover event on @mention in message
         *
         * @param event Dom hover event which triggered handler.
         * @param user Target user object
         */
        onMentionsHoverMessage: prop_types_1.default.func,
        /**
         * The handler for click event on @mention in message
         *
         * @param event Dom click event which triggered handler.
         * @param user Target user object
         */
        onMentionsClickMessage: prop_types_1.default.func,
        /** Position of message in group. Possible values: top, bottom, middle, single */
        groupStyles: prop_types_1.default.array,
    };
    MessageCommerce.defaultProps = {
        Attachment: Attachment_1.Attachment,
    };
    return MessageCommerce;
}(react_1.PureComponent));
exports.MessageCommerce = MessageCommerce;
exports.MessageCommerce = MessageCommerce = context_1.withTranslationContext(MessageCommerce);
