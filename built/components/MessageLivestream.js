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
var Attachment_1 = require("./Attachment");
var MessageActionsBox_1 = require("./MessageActionsBox");
var ReactionSelector_1 = require("./ReactionSelector");
var SimpleReactionsList_1 = require("./SimpleReactionsList");
var MessageInput_1 = require("./MessageInput");
var EditMessageForm_1 = require("./EditMessageForm");
var Gallery_1 = require("./Gallery");
var MessageRepliesCountButton_1 = require("./MessageRepliesCountButton");
var utils_1 = require("../utils");
var context_1 = require("../context");
var reactionSvg = '<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z" fillRule="evenodd"/></svg>';
var threadSvg = '<svg width="14" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z" fillRule="evenodd" /></svg>';
var optionsSvg = '<svg width="11" height="3" viewBox="0 0 11 3" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fillRule="nonzero" /></svg>';
/**
 * MessageLivestream - Render component, should be used together with the Message component
 * Implements the look and feel for a livestream use case.
 *
 * @example ./docs/MessageLivestream.md
 * @extends PureComponent
 */
var MessageLivestream = /** @class */ (function (_super) {
    __extends(MessageLivestream, _super);
    function MessageLivestream() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            actionsBoxOpen: false,
            reactionSelectorOpen: false,
        };
        _this.reactionSelectorRef = react_1.default.createRef();
        _this.editMessageFormRef = react_1.default.createRef();
        _this.onClickReactionsAction = function () {
            _this.setState({
                reactionSelectorOpen: true,
            }, function () { return document.addEventListener('click', _this.hideReactions, false); });
        };
        _this.onClickOptionsAction = function () {
            _this.setState({
                actionsBoxOpen: true,
            }, function () { return document.addEventListener('click', _this.hideOptions, false); });
        };
        _this.hideOptions = function () {
            _this.setState({
                actionsBoxOpen: false,
            });
            document.removeEventListener('click', _this.hideOptions, false);
        };
        _this.hideReactions = function (e) {
            if (!_this.reactionSelectorRef.current.reactionSelector.current.contains(e.target)) {
                _this.setState({
                    reactionSelectorOpen: false,
                });
                document.removeEventListener('click', _this.hideReactions, false);
            }
        };
        _this.onMouseLeaveMessage = function () {
            _this.hideOptions();
            _this.setState({
                reactionSelectorOpen: false,
            }, function () { return document.removeEventListener('click', _this.hideReactions, false); });
        };
        return _this;
    }
    MessageLivestream.prototype.isMine = function () {
        return this.props.isMyMessage(this.props.message);
    };
    MessageLivestream.prototype.componentWillUnmount = function () {
        document.removeEventListener('click', this.hideOptions, false);
        document.removeEventListener('click', this.hideReactions, false);
    };
    MessageLivestream.prototype.render = function () {
        var _a = this.props, Attachment = _a.Attachment, message = _a.message, groupStyles = _a.groupStyles, editing = _a.editing, clearEditingState = _a.clearEditingState, updateMessage = _a.updateMessage, initialMessage = _a.initialMessage, handleReaction = _a.handleReaction, actionsEnabled = _a.actionsEnabled, messageListRect = _a.messageListRect, channelConfig = _a.channelConfig, threadList = _a.threadList, handleOpenThread = _a.handleOpenThread, Message = _a.Message, onMentionsHoverMessage = _a.onMentionsHoverMessage, onMentionsClickMessage = _a.onMentionsClickMessage, unsafeHTML = _a.unsafeHTML, handleRetry = _a.handleRetry, handleAction = _a.handleAction, getMessageActions = _a.getMessageActions, isMyMessage = _a.isMyMessage, handleFlag = _a.handleFlag, handleMute = _a.handleMute, handleEdit = _a.handleEdit, handleDelete = _a.handleDelete, t = _a.t, tDateTimeParser = _a.tDateTimeParser;
        var hasAttachment = Boolean(message.attachments && message.attachments.length);
        var galleryImages = message.attachments.filter(function (item) { return item.type === 'image'; });
        var attachments = message.attachments;
        if (galleryImages.length > 1) {
            attachments = message.attachments.filter(function (item) { return item.type !== 'image'; });
        }
        else {
            galleryImages = [];
        }
        if (message.type === 'message.read') {
            return null;
        }
        if (message.type === 'message.date') {
            return null;
        }
        if (message.deleted_at) {
            return null;
        }
        if (editing) {
            return (react_1.default.createElement("div", { className: "str-chat__message-team str-chat__message-team--" + groupStyles[0] + " str-chat__message-team--editing", onMouseLeave: this.onMouseLeaveMessage },
                (groupStyles[0] === 'top' || groupStyles[0] === 'single') && (react_1.default.createElement("div", { className: "str-chat__message-team-meta" },
                    react_1.default.createElement(Avatar_1.Avatar, { image: message.user.image, name: message.user.name || message.user.id, size: 40 }))),
                react_1.default.createElement(MessageInput_1.MessageInput, { Input: EditMessageForm_1.EditMessageForm, message: message, clearEditingState: clearEditingState, updateMessage: updateMessage })));
        }
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "str-chat__message-livestream str-chat__message-livestream--" + groupStyles[0] + " str-chat__message-livestream--" + message.type + " str-chat__message-livestream--" + message.status + " " + (initialMessage
                    ? 'str-chat__message-livestream--initial-message'
                    : ''), onMouseLeave: this.onMouseLeaveMessage },
                this.state.reactionSelectorOpen && (react_1.default.createElement(ReactionSelector_1.ReactionSelector, { reverse: false, handleReaction: handleReaction, actionsEnabled: actionsEnabled, detailedView: true, latest_reactions: message.latest_reactions, reaction_counts: message.reaction_counts, messageList: messageListRect, ref: this.reactionSelectorRef })),
                !initialMessage &&
                    message.type !== 'error' &&
                    message.type !== 'system' &&
                    message.type !== 'ephemeral' &&
                    message.status !== 'failed' &&
                    message.status !== 'sending' && (react_1.default.createElement("div", { className: "str-chat__message-livestream-actions" },
                    react_1.default.createElement("span", { className: "str-chat__message-livestream-time" }, tDateTimeParser(message.created_at).format('h:mmA')),
                    channelConfig && channelConfig.reactions && (react_1.default.createElement("span", { onClick: this.onClickReactionsAction },
                        react_1.default.createElement("span", { dangerouslySetInnerHTML: {
                                __html: reactionSvg,
                            } }))),
                    !threadList && channelConfig && channelConfig.replies && (react_1.default.createElement("span", { dangerouslySetInnerHTML: {
                            __html: threadSvg,
                        }, onClick: function (e) { return handleOpenThread(e, message); } })),
                    getMessageActions().length > 0 && (react_1.default.createElement("span", { onClick: this.onClickOptionsAction },
                        react_1.default.createElement("span", { dangerouslySetInnerHTML: {
                                __html: optionsSvg,
                            } }),
                        react_1.default.createElement(MessageActionsBox_1.MessageActionsBox, { getMessageActions: getMessageActions, open: this.state.actionsBoxOpen, Message: Message, message: message, messageListRect: messageListRect, mine: isMyMessage(message), handleFlag: handleFlag, handleMute: handleMute, handleEdit: handleEdit, handleDelete: handleDelete }))))),
                react_1.default.createElement("div", { className: "str-chat__message-livestream-left" },
                    react_1.default.createElement(Avatar_1.Avatar, { image: message.user.image, name: message.user.name || message.user.id, size: 30 })),
                react_1.default.createElement("div", { className: "str-chat__message-livestream-right" },
                    react_1.default.createElement("div", { className: "str-chat__message-livestream-content" },
                        react_1.default.createElement("div", { className: "str-chat__message-livestream-author" },
                            react_1.default.createElement("strong", null, message.user.name || message.user.id),
                            message.type === 'error' && (react_1.default.createElement("div", { className: "str-chat__message-team-error-header" }, t('Only visible to you')))),
                        react_1.default.createElement("div", { className: utils_1.isOnlyEmojis(message.text)
                                ? 'str-chat__message-livestream-text--is-emoji'
                                : '', onMouseOver: onMentionsHoverMessage, onClick: onMentionsClickMessage },
                            message.type !== 'error' &&
                                message.status !== 'failed' &&
                                !unsafeHTML &&
                                utils_1.renderText(message),
                            message.type !== 'error' &&
                                message.status !== 'failed' &&
                                unsafeHTML && (react_1.default.createElement("div", { dangerouslySetInnerHTML: { __html: message.html } })),
                            message.type === 'error' && !message.command && (react_1.default.createElement("p", null,
                                react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                                    react_1.default.createElement("path", { d: "M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm.875 10.938a.438.438 0 0 1-.438.437h-.875a.438.438 0 0 1-.437-.438v-.874c0-.242.196-.438.438-.438h.875c.241 0 .437.196.437.438v.874zm0-2.626a.438.438 0 0 1-.438.438h-.875a.438.438 0 0 1-.437-.438v-5.25c0-.241.196-.437.438-.437h.875c.241 0 .437.196.437.438v5.25z", fill: "#EA152F", fillRule: "evenodd" })),
                                message.text)),
                            message.type === 'error' && message.command && (react_1.default.createElement("p", null,
                                react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                                    react_1.default.createElement("path", { d: "M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm.875 10.938a.438.438 0 0 1-.438.437h-.875a.438.438 0 0 1-.437-.438v-.874c0-.242.196-.438.438-.438h.875c.241 0 .437.196.437.438v.874zm0-2.626a.438.438 0 0 1-.438.438h-.875a.438.438 0 0 1-.437-.438v-5.25c0-.241.196-.437.438-.437h.875c.241 0 .437.196.437.438v5.25z", fill: "#EA152F", fillRule: "evenodd" })),
                                react_1.default.createElement("strong", null,
                                    "/",
                                    message.command),
                                " is not a valid command")),
                            message.status === 'failed' && (react_1.default.createElement("p", { onClick: handleRetry.bind(this, message) },
                                react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                                    react_1.default.createElement("path", { d: "M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm.875 10.938a.438.438 0 0 1-.438.437h-.875a.438.438 0 0 1-.437-.438v-.874c0-.242.196-.438.438-.438h.875c.241 0 .437.196.437.438v.874zm0-2.626a.438.438 0 0 1-.438.438h-.875a.438.438 0 0 1-.437-.438v-5.25c0-.241.196-.437.438-.437h.875c.241 0 .437.196.437.438v5.25z", fill: "#EA152F", fillRule: "evenodd" })),
                                t('Message failed. Click to try again.')))),
                        hasAttachment &&
                            attachments.map(function (attachment, index) { return (react_1.default.createElement(Attachment, { key: message.id + "-" + index, attachment: attachment, actionHandler: handleAction })); }),
                        galleryImages.length !== 0 && react_1.default.createElement(Gallery_1.Gallery, { images: galleryImages }),
                        react_1.default.createElement(SimpleReactionsList_1.SimpleReactionsList, { reaction_counts: message.reaction_counts, reactions: message.latest_reactions, handleReaction: handleReaction }),
                        !initialMessage && (react_1.default.createElement(MessageRepliesCountButton_1.MessageRepliesCountButton, { onClick: handleOpenThread, reply_count: message.reply_count })))))));
    };
    MessageLivestream.propTypes = {
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
        /** If the message is in edit state */
        editing: prop_types_1.default.bool,
        /** Function to exit edit state */
        clearEditingState: prop_types_1.default.func,
        /** Returns true if message belongs to current user */
        isMyMessage: prop_types_1.default.func,
        /**
         * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
         * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
         * */
        getMessageActions: prop_types_1.default.func,
        /**
         * Function to publish updates on message to channel
         *
         * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
         * */
        updateMessage: prop_types_1.default.func,
        /**
         * Reattempt sending a message
         * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
         */
        handleRetry: prop_types_1.default.func,
        /**
         * Add or remove reaction on message
         *
         * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
         * @param event Dom event which triggered this function
         */
        handleReaction: prop_types_1.default.func,
        /** If actions such as edit, delete, flag, mute are enabled on message */
        actionsEnabled: prop_types_1.default.bool,
        /** DOMRect object for parent MessageList component */
        messageListRect: prop_types_1.default.object,
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
    };
    MessageLivestream.defaultProps = {
        Attachment: Attachment_1.Attachment,
    };
    return MessageLivestream;
}(react_1.default.PureComponent));
exports.MessageLivestream = MessageLivestream;
exports.MessageLivestream = MessageLivestream = context_1.withTranslationContext(MessageLivestream);
