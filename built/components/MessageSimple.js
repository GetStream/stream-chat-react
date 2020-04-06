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
var Attachment_1 = require("./Attachment");
var MessageActionsBox_1 = require("./MessageActionsBox");
var ReactionsList_1 = require("./ReactionsList");
var Avatar_1 = require("./Avatar");
var Tooltip_1 = require("./Tooltip");
var LoadingIndicator_1 = require("./LoadingIndicator");
var Gallery_1 = require("./Gallery");
var ReactionSelector_1 = require("./ReactionSelector");
var MessageRepliesCountButton_1 = require("./MessageRepliesCountButton");
var Modal_1 = require("./Modal");
var MessageInput_1 = require("./MessageInput");
var EditMessageForm_1 = require("./EditMessageForm");
var prop_types_1 = __importDefault(require("prop-types"));
var utils_1 = require("../utils");
var context_1 = require("../context");
/**
 * MessageSimple - Render component, should be used together with the Message component
 *
 * @example ./docs/MessageSimple.md
 * @extends PureComponent
 */
var MessageSimple = /** @class */ (function (_super) {
    __extends(MessageSimple, _super);
    function MessageSimple() {
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
                document.addEventListener('touchend', _this._closeDetailedReactions);
            });
        };
        _this._closeDetailedReactions = function (e) {
            if (!_this.reactionSelectorRef.current.reactionSelector.current.contains(e.target)) {
                _this.setState(function () { return ({
                    showDetailedReactions: false,
                }); }, function () {
                    document.removeEventListener('click', _this._closeDetailedReactions);
                    document.removeEventListener('touchend', _this._closeDetailedReactions);
                });
            }
            else {
                return {};
            }
        };
        _this.formatArray = function (arr) {
            var t = _this.props.t;
            var outStr = '';
            var slicedArr = arr
                .filter(function (item) { return item.id !== _this.props.client.user.id; })
                .map(function (item) { return item.name || item.id; })
                .slice(0, 5);
            var restLength = arr.length - slicedArr.length;
            if (slicedArr.length === 1) {
                outStr = slicedArr[0] + ' ';
            }
            else if (slicedArr.length === 2) {
                //joins all with "and" but =no commas
                //example: "bob and sam"
                outStr = t('{{ firstUser }} and {{ secondUser }}', {
                    firstUser: slicedArr[0],
                    secondUser: slicedArr[1],
                });
            }
            else if (slicedArr.length > 2) {
                //joins all with commas, but last one gets ", and" (oxford comma!)
                //example: "bob, joe, sam and 4 more"
                outStr = t('{{ commaSeparatedUsers }} and {{ moreCount }} more', {
                    commaSeparatedUsers: slicedArr.join(', '),
                    moreCount: restLength,
                });
            }
            return outStr;
        };
        _this.renderStatus = function () {
            var _a = _this.props, readBy = _a.readBy, client = _a.client, message = _a.message, threadList = _a.threadList, lastReceivedId = _a.lastReceivedId, t = _a.t;
            if (!_this.isMine() || message.type === 'error') {
                return null;
            }
            var justReadByMe = readBy.length === 1 && readBy[0].id === client.user.id;
            if (message.status === 'sending') {
                return (react_1.default.createElement("span", { className: "str-chat__message-simple-status" },
                    react_1.default.createElement(Tooltip_1.Tooltip, null, t('Sending...')),
                    react_1.default.createElement(LoadingIndicator_1.LoadingIndicator, null)));
            }
            else if (readBy.length !== 0 && !threadList && !justReadByMe) {
                var lastReadUser = readBy.filter(function (item) { return item.id !== client.user.id; })[0];
                return (react_1.default.createElement("span", { className: "str-chat__message-simple-status" },
                    react_1.default.createElement(Tooltip_1.Tooltip, null, _this.formatArray(readBy)),
                    react_1.default.createElement(Avatar_1.Avatar, { name: lastReadUser.name || lastReadUser.id, image: lastReadUser.image, size: 15 }),
                    readBy.length > 2 && (react_1.default.createElement("span", { className: "str-chat__message-simple-status-number" }, readBy.length - 1))));
            }
            else if (message.status === 'received' &&
                message.id === lastReceivedId &&
                !threadList) {
                return (react_1.default.createElement("span", { className: "str-chat__message-simple-status" },
                    react_1.default.createElement(Tooltip_1.Tooltip, null, t('Delivered')),
                    react_1.default.createElement("svg", { width: "16", height: "16", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("path", { d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.72 6.633a.955.955 0 1 0-1.352-1.352L6.986 8.663 5.633 7.31A.956.956 0 1 0 4.28 8.663l2.029 2.028a.956.956 0 0 0 1.353 0l4.058-4.058z", fill: "#006CFF", fillRule: "evenodd" }))));
            }
            else {
                return null;
            }
        };
        _this.renderMessageActions = function () {
            var _a = _this.props, Message = _a.Message, getMessageActions = _a.getMessageActions, messageListRect = _a.messageListRect, handleFlag = _a.handleFlag, handleMute = _a.handleMute, handleEdit = _a.handleEdit, handleDelete = _a.handleDelete;
            var messageActions = getMessageActions();
            if (messageActions.length === 0) {
                return;
            }
            return (react_1.default.createElement("div", { onClick: _this._onClickOptionsAction, className: "str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options" },
                react_1.default.createElement(MessageActionsBox_1.MessageActionsBox, { Message: Message, getMessageActions: getMessageActions, open: _this.state.actionsBoxOpen, messageListRect: messageListRect, handleFlag: handleFlag, handleMute: handleMute, handleEdit: handleEdit, handleDelete: handleDelete, mine: _this.isMine() }),
                react_1.default.createElement("svg", { width: "11", height: "4", viewBox: "0 0 11 4", xmlns: "http://www.w3.org/2000/svg" },
                    react_1.default.createElement("path", { d: "M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z", fillRule: "nonzero" }))));
        };
        return _this;
    }
    MessageSimple.prototype.componentWillUnmount = function () {
        if (!this.props.message.deleted_at) {
            document.removeEventListener('click', this._closeDetailedReactions);
            document.removeEventListener('touchend', this._closeDetailedReactions);
        }
    };
    MessageSimple.prototype.isMine = function () {
        return this.props.isMyMessage(this.props.message);
    };
    MessageSimple.prototype.renderOptions = function () {
        var _a = this.props, message = _a.message, initialMessage = _a.initialMessage, channelConfig = _a.channelConfig, threadList = _a.threadList, handleOpenThread = _a.handleOpenThread;
        if (message.type === 'error' ||
            message.type === 'system' ||
            message.type === 'ephemeral' ||
            message.status === 'failed' ||
            message.status === 'sending' ||
            initialMessage) {
            return;
        }
        if (this.isMine()) {
            return (react_1.default.createElement("div", { className: "str-chat__message-simple__actions" },
                this.renderMessageActions(),
                !threadList && channelConfig && channelConfig.replies && (react_1.default.createElement("div", { onClick: handleOpenThread, className: "str-chat__message-simple__actions__action str-chat__message-simple__actions__action--thread" },
                    react_1.default.createElement("svg", { width: "14", height: "10", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("path", { d: "M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z", fillRule: "evenodd" })))),
                channelConfig && channelConfig.reactions && (react_1.default.createElement("div", { className: "str-chat__message-simple__actions__action str-chat__message-simple__actions__action--reactions", onClick: this._clickReactionList },
                    react_1.default.createElement("svg", { width: "16", height: "14", viewBox: "0 0 16 14", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("path", { d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z", fillRule: "evenodd" }))))));
        }
        else {
            return (react_1.default.createElement("div", { className: "str-chat__message-simple__actions" },
                channelConfig && channelConfig.reactions && (react_1.default.createElement("div", { className: "str-chat__message-simple__actions__action str-chat__message-simple__actions__action--reactions", onClick: this._clickReactionList },
                    react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("path", { d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z", fillRule: "evenodd" })))),
                !threadList && channelConfig && channelConfig.replies && (react_1.default.createElement("div", { onClick: handleOpenThread, className: "str-chat__message-simple__actions__action str-chat__message-simple__actions__action--thread" },
                    react_1.default.createElement("svg", { width: "14", height: "10", xmlns: "http://www.w3.org/2000/svg" },
                        react_1.default.createElement("path", { d: "M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z", fillRule: "evenodd" })))),
                this.renderMessageActions()));
        }
    };
    // eslint-disable-next-line
    MessageSimple.prototype.render = function () {
        var _a = this.props, message = _a.message, Attachment = _a.Attachment, editing = _a.editing, clearEditingState = _a.clearEditingState, handleRetry = _a.handleRetry, updateMessage = _a.updateMessage, handleReaction = _a.handleReaction, actionsEnabled = _a.actionsEnabled, messageListRect = _a.messageListRect, handleAction = _a.handleAction, onMentionsHoverMessage = _a.onMentionsHoverMessage, onMentionsClickMessage = _a.onMentionsClickMessage, unsafeHTML = _a.unsafeHTML, threadList = _a.threadList, handleOpenThread = _a.handleOpenThread, t = _a.t, tDateTimeParser = _a.tDateTimeParser;
        var when = tDateTimeParser(message.created_at).calendar();
        var messageClasses = this.isMine()
            ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
            : 'str-chat__message str-chat__message-simple';
        var hasAttachment = Boolean(message && message.attachments && message.attachments.length);
        var images = hasAttachment &&
            message.attachments.filter(function (item) { return item.type === 'image'; });
        var hasReactions = Boolean(message.latest_reactions && message.latest_reactions.length);
        if (message.type === 'message.read' || message.type === 'message.date') {
            return null;
        }
        if (message.deleted_at) {
            return (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { key: message.id, className: messageClasses + " str-chat__message--deleted " + message.type + " " },
                    react_1.default.createElement("div", { className: "str-chat__message--deleted-inner" }, t('This message was deleted...')))));
        }
        return (react_1.default.createElement(react_1.default.Fragment, null,
            editing && (react_1.default.createElement(Modal_1.Modal, { open: editing, onClose: clearEditingState },
                react_1.default.createElement(MessageInput_1.MessageInput, __assign({ Input: EditMessageForm_1.EditMessageForm, message: message, clearEditingState: clearEditingState, updateMessage: updateMessage }, this.props.additionalMessageInputProps)))),
            react_1.default.createElement("div", { key: message.id, className: ("\n\t\t\t\t\t\t" + messageClasses + "\n\t\t\t\t\t\tstr-chat__message--" + message.type + "\n\t\t\t\t\t\tstr-chat__message--" + message.status + "\n\t\t\t\t\t\t" + (message.text ? 'str-chat__message--has-text' : 'has-no-text') + "\n\t\t\t\t\t\t" + (hasAttachment ? 'str-chat__message--has-attachment' : '') + "\n\t\t\t\t\t\t" + (hasReactions ? 'str-chat__message--with-reactions' : '') + "\n\t\t\t\t\t").trim(), onMouseLeave: this._hideOptions, ref: this.messageRef },
                this.renderStatus(),
                react_1.default.createElement(Avatar_1.Avatar, { image: message.user.image, name: message.user.name || message.user.id }),
                react_1.default.createElement("div", { className: "str-chat__message-inner", onClick: message.status === 'failed'
                        ? handleRetry.bind(this, message)
                        : null },
                    !message.text && (react_1.default.createElement(react_1.default.Fragment, null,
                        this.renderOptions(),
                        hasReactions && !this.state.showDetailedReactions && (react_1.default.createElement(ReactionsList_1.ReactionsList, { reactions: message.latest_reactions, reaction_counts: message.reaction_counts, onClick: this._clickReactionList, reverse: true })),
                        this.state.showDetailedReactions && (react_1.default.createElement(ReactionSelector_1.ReactionSelector, { handleReaction: handleReaction, detailedView: true, reaction_counts: message.reaction_counts, latest_reactions: message.latest_reactions, messageList: messageListRect, ref: this.reactionSelectorRef })))),
                    react_1.default.createElement("div", { className: "str-chat__message-attachment-container" }, hasAttachment &&
                        message.attachments.map(function (attachment, index) {
                            if (attachment.type === 'image' && images.length > 1)
                                return null;
                            return (react_1.default.createElement(Attachment, { key: message.id + "-" + index, attachment: attachment, actionHandler: handleAction }));
                        })),
                    images.length > 1 && react_1.default.createElement(Gallery_1.Gallery, { images: images }),
                    message.text && (react_1.default.createElement("div", { className: "str-chat__message-text" },
                        react_1.default.createElement("div", { className: ("\n\t\t\t\t\t\t\t\t\tstr-chat__message-text-inner str-chat__message-simple-text-inner\n\t\t\t\t\t\t\t\t\t" + (this.state.isFocused ? 'str-chat__message-text-inner--focused' : '') + "\n\t\t\t\t\t\t\t\t\t" + (hasAttachment ? 'str-chat__message-text-inner--has-attachment' : '') + "\n\t\t\t\t\t\t\t\t\t" + (utils_1.isOnlyEmojis(message.text)
                                ? 'str-chat__message-simple-text-inner--is-emoji'
                                : '') + "\n                ").trim(), onMouseOver: onMentionsHoverMessage, onClick: onMentionsClickMessage },
                            message.type === 'error' && (react_1.default.createElement("div", { className: "str-chat__simple-message--error-message" }, t('Error · Unsent'))),
                            message.status === 'failed' && (react_1.default.createElement("div", { className: "str-chat__simple-message--error-message" }, t('Message Failed · Click to try again'))),
                            unsafeHTML ? (react_1.default.createElement("div", { dangerouslySetInnerHTML: { __html: message.html } })) : (utils_1.renderText(message)),
                            hasReactions && !this.state.showDetailedReactions && (react_1.default.createElement(ReactionsList_1.ReactionsList, { reactions: message.latest_reactions, reaction_counts: message.reaction_counts, onClick: this._clickReactionList, reverse: true })),
                            this.state.showDetailedReactions && (react_1.default.createElement(ReactionSelector_1.ReactionSelector, { mine: this.isMine(), handleReaction: handleReaction, actionsEnabled: actionsEnabled, detailedView: true, reaction_counts: message.reaction_counts, latest_reactions: message.latest_reactions, messageList: messageListRect, ref: this.reactionSelectorRef }))),
                        message.text && this.renderOptions())),
                    !threadList && message.reply_count !== 0 && (react_1.default.createElement("div", { className: "str-chat__message-simple-reply-button" },
                        react_1.default.createElement(MessageRepliesCountButton_1.MessageRepliesCountButton, { onClick: handleOpenThread, reply_count: message.reply_count }))),
                    react_1.default.createElement("div", { className: "str-chat__message-data str-chat__message-simple-data" },
                        !this.isMine() ? (react_1.default.createElement("span", { className: "str-chat__message-simple-name" }, message.user.name || message.user.id)) : null,
                        react_1.default.createElement("span", { className: "str-chat__message-simple-timestamp" }, when))))));
    };
    MessageSimple.propTypes = {
        /** The [message object](https://getstream.io/chat/docs/#message_format) */
        message: prop_types_1.default.object,
        /**
         * The attachment UI component.
         * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
         * */
        Attachment: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
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
        /** Client object */
        client: prop_types_1.default.object,
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
        /**
         * Additional props for underlying MessageInput component.
         * Available props - https://getstream.github.io/stream-chat-react/#messageinput
         * */
        additionalMessageInputProps: prop_types_1.default.object,
    };
    MessageSimple.defaultProps = {
        Attachment: Attachment_1.Attachment,
    };
    return MessageSimple;
}(react_1.PureComponent));
exports.MessageSimple = MessageSimple;
exports.MessageSimple = MessageSimple = context_1.withTranslationContext(MessageSimple);
