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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
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
var deep_equal_1 = __importDefault(require("deep-equal"));
var MessageSimple_1 = require("./MessageSimple");
var Attachment_1 = require("./Attachment");
var utils_1 = require("../utils");
var context_1 = require("../context");
/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ./docs/Message.md
 * @extends Component
 */
var Message = /** @class */ (function (_super) {
    __extends(Message, _super);
    function Message(props) {
        var _this = _super.call(this, props) || this;
        _this.isMyMessage = function (message) {
            return message.user ? _this.props.client.user.id === message.user.id : false;
        };
        _this.isAdmin = function () {
            return _this.props.client.user.role === 'admin' ||
                (_this.props.channel.state &&
                    _this.props.channel.state.membership &&
                    _this.props.channel.state.membership.role === 'admin');
        };
        _this.isOwner = function () {
            return _this.props.channel.state &&
                _this.props.channel.state.membership &&
                _this.props.channel.state.membership.role === 'owner';
        };
        _this.isModerator = function () {
            return _this.props.channel.state &&
                _this.props.channel.state.membership &&
                (_this.props.channel.state.membership.role === 'channel_moderator' ||
                    _this.props.channel.state.membership.role === 'moderator');
        };
        _this.canEditMessage = function (message) {
            return _this.isMyMessage(message) ||
                _this.isModerator() ||
                _this.isOwner() ||
                _this.isAdmin();
        };
        _this.canDeleteMessage = function (message) {
            return _this.canEditMessage(message);
        };
        /**
         * Following function validates a function which returns notification message.
         * It validates if the first parameter is function and also if return value of function is string or no.
         *
         * @param func {Function}
         * @param args {Array} Arguments to be provided to func while executing.
         */
        _this.validateAndGetNotificationMessage = function (func, args) {
            if (!func || typeof func !== 'function')
                return false;
            var returnValue = func.apply(null, args ? args : [null]);
            if (typeof returnValue !== 'string')
                return false;
            return returnValue;
        };
        _this.handleFlag = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, getFlagMessageSuccessNotification, getFlagMessageErrorNotification, message, client, addNotification, t, successMessage, e_1, errorMessage;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        _a = this.props, getFlagMessageSuccessNotification = _a.getFlagMessageSuccessNotification, getFlagMessageErrorNotification = _a.getFlagMessageErrorNotification, message = _a.message, client = _a.client, addNotification = _a.addNotification, t = _a.t;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, client.flagMessage(message.id)];
                    case 2:
                        _b.sent();
                        successMessage = this.validateAndGetNotificationMessage(getFlagMessageSuccessNotification, [message]);
                        if (addNotification !== undefined) {
                            addNotification(successMessage
                                ? successMessage
                                : t('Message has been successfully flagged'), 'success');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        errorMessage = this.validateAndGetNotificationMessage(getFlagMessageErrorNotification, [message]);
                        if (addNotification !== undefined) {
                            addNotification(errorMessage
                                ? errorMessage
                                : t('Error adding flag: Either the flag already exist or there is issue with network connection ...'), 'error');
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        _this.handleMute = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, getMuteUserSuccessNotification, getMuteUserErrorNotification, message, client, addNotification, t, successMessage, e_2, errorMessage;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        _a = this.props, getMuteUserSuccessNotification = _a.getMuteUserSuccessNotification, getMuteUserErrorNotification = _a.getMuteUserErrorNotification, message = _a.message, client = _a.client, addNotification = _a.addNotification, t = _a.t;
                        if (!message.user || message.user.id) {
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, client.muteUser(message.user.id)];
                    case 2:
                        _b.sent();
                        successMessage = this.validateAndGetNotificationMessage(getMuteUserSuccessNotification, [message.user]);
                        if (addNotification !== undefined) {
                            addNotification(successMessage
                                ? successMessage
                                : t("{{ user }} has been muted", {
                                    user: message.user.name || message.user.id,
                                }), 'success');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _b.sent();
                        errorMessage = this.validateAndGetNotificationMessage(getMuteUserErrorNotification, [message.user]);
                        if (addNotification !== undefined) {
                            addNotification(errorMessage ? errorMessage : t('Error muting a user ...'), 'error');
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        _this.handleEdit = function (event) {
            var _a = _this.props, setEditingState = _a.setEditingState, message = _a.message;
            if (event !== undefined && event.preventDefault) {
                event.preventDefault();
            }
            setEditingState(message);
        };
        _this.handleDelete = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, message, client, updateMessage, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        _a = this.props, message = _a.message, client = _a.client, updateMessage = _a.updateMessage;
                        return [4 /*yield*/, client.deleteMessage(message.id)];
                    case 1:
                        data = _b.sent();
                        updateMessage(data.message);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleReaction = function (reactionType, event) { return __awaiter(_this, void 0, void 0, function () {
            var userExistingReaction, currentUser, _i, _a, reaction, originalMessage, reactionChangePromise, messageID, reaction, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (event !== undefined && event.preventDefault) {
                            event.preventDefault();
                        }
                        userExistingReaction = null;
                        currentUser = this.props.client.user.id;
                        for (_i = 0, _a = this.props.message.own_reactions || []; _i < _a.length; _i++) {
                            reaction = _a[_i];
                            // own user should only ever contain the current user id
                            // just in case we check to prevent bugs with message updates from breaking reactions
                            if (reaction &&
                                reaction.user &&
                                currentUser === reaction.user.id &&
                                reaction.type === reactionType) {
                                userExistingReaction = reaction;
                            }
                            else if (reaction &&
                                reaction.user &&
                                currentUser !== reaction.user.id) {
                                console.warn("message.own_reactions contained reactions from a different user, this indicates a bug");
                            }
                        }
                        originalMessage = this.props.message;
                        /*
                        - Add the reaction to the local state
                        - Make the API call in the background
                        - If it fails, revert to the old message...
                         */
                        if (userExistingReaction) {
                            // this.props.channel.state.removeReaction(userExistingReaction);
                            reactionChangePromise = this.props.channel.deleteReaction(this.props.message.id, userExistingReaction.type);
                        }
                        else {
                            messageID = this.props.message.id;
                            reaction = { type: reactionType };
                            reactionChangePromise = this.props.channel.sendReaction(messageID, reaction);
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        // only wait for the API call after the state is updated
                        return [4 /*yield*/, reactionChangePromise];
                    case 2:
                        // only wait for the API call after the state is updated
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _b.sent();
                        // revert to the original message if the API call fails
                        this.props.updateMessage(originalMessage);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        _this.handleAction = function (name, value, event) { return __awaiter(_this, void 0, void 0, function () {
            var messageID, formData, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        messageID = this.props.message.id;
                        formData = {};
                        formData[name] = value;
                        return [4 /*yield*/, this.props.channel.sendAction(messageID, formData)];
                    case 1:
                        data = _a.sent();
                        if (data && data.message) {
                            this.props.updateMessage(data.message);
                        }
                        else if (this.props.removeMessage) {
                            this.props.removeMessage(this.props.message);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleRetry = function (message) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.props.retrySendMessage) {
                    return [2 /*return*/, this.props.retrySendMessage(message)];
                }
                return [2 /*return*/];
            });
        }); };
        _this.onMentionsClick = function (e) {
            if (typeof _this.props.onMentionsClick !== 'function') {
                return;
            }
            if (!_this.props.message.mentioned_users) {
                return;
            }
            _this.props.onMentionsClick(e, _this.props.message.mentioned_users);
        };
        _this.onMentionsHover = function (e) {
            if (typeof _this.props.onMentionsHover !== 'function') {
                return;
            }
            if (!_this.props.message.mentioned_users) {
                return;
            }
            _this.props.onMentionsHover(e, _this.props.message.mentioned_users);
        };
        _this.getMessageActions = function () {
            var _a = _this.props, message = _a.message, messageActionsProps = _a.messageActions;
            var mutes = _this.props.channel.getConfig().mutes;
            var messageActionsAfterPermission = [];
            var messageActions = [];
            if (messageActionsProps && typeof messageActionsProps === 'boolean') {
                // If value of messageActionsProps is true, then populate all the possible values
                messageActions = Object.keys(utils_1.MESSAGE_ACTIONS);
            }
            else if (messageActionsProps && messageActionsProps.length > 0) {
                messageActions = __spreadArrays(messageActionsProps);
            }
            else {
                return [];
            }
            if (_this.canEditMessage(message) &&
                messageActions.indexOf(utils_1.MESSAGE_ACTIONS.edit) > -1) {
                messageActionsAfterPermission.push(utils_1.MESSAGE_ACTIONS.edit);
            }
            if (_this.canDeleteMessage(message) &&
                messageActions.indexOf(utils_1.MESSAGE_ACTIONS.delete) > -1) {
                messageActionsAfterPermission.push(utils_1.MESSAGE_ACTIONS.delete);
            }
            if (!_this.isMyMessage(message) &&
                messageActions.indexOf(utils_1.MESSAGE_ACTIONS.flag) > -1) {
                messageActionsAfterPermission.push(utils_1.MESSAGE_ACTIONS.flag);
            }
            if (!_this.isMyMessage(message) &&
                messageActions.indexOf(utils_1.MESSAGE_ACTIONS.mute) > -1 &&
                mutes) {
                messageActionsAfterPermission.push(utils_1.MESSAGE_ACTIONS.mute);
            }
            return messageActionsAfterPermission;
        };
        _this.state = {
            loading: false,
        };
        return _this;
    }
    Message.prototype.shouldComponentUpdate = function (nextProps) {
        // since there are many messages its important to only rerender messages when needed.
        var shouldUpdate = nextProps.message !== this.props.message;
        var reason = '';
        if (shouldUpdate) {
            reason = 'message';
        }
        // read state is the next most likely thing to change..
        if (!shouldUpdate && !deep_equal_1.default(nextProps.readBy, this.props.readBy)) {
            shouldUpdate = true;
            reason = 'readBy';
        }
        // group style often changes for the last 3 messages...
        if (!shouldUpdate &&
            !deep_equal_1.default(nextProps.groupStyles, this.props.groupStyles)) {
            shouldUpdate = true;
            reason = 'groupStyles';
        }
        // if lastreceivedId changesm, message should update.
        if (!shouldUpdate &&
            !deep_equal_1.default(nextProps.lastReceivedId, this.props.lastReceivedId)) {
            shouldUpdate = true;
            reason = 'lastReceivedId';
        }
        // editing is the last one which can trigger a change..
        if (!shouldUpdate && nextProps.editing !== this.props.editing) {
            shouldUpdate = true;
            reason = 'editing';
        }
        // editing is the last one which can trigger a change..
        if (!shouldUpdate &&
            nextProps.messageListRect !== this.props.messageListRect) {
            shouldUpdate = true;
            reason = 'messageListRect';
        }
        if (shouldUpdate && reason) {
            // console.log(
            //   'message',
            //   nextProps.message.id,
            //   'shouldUpdate',
            //   shouldUpdate,
            //   reason,
            // );
            // console.log(reason, diff(this.props, nextProps));
        }
        return shouldUpdate;
    };
    Message.prototype.render = function () {
        var config = this.props.channel.getConfig();
        var message = this.props.message;
        var actionsEnabled = message.type === 'regular' && message.status === 'received';
        var Component = this.props.Message;
        return (react_1.default.createElement(Component, __assign({}, this.props, { actionsEnabled: actionsEnabled, Message: this, handleReaction: this.handleReaction, getMessageActions: this.getMessageActions, handleFlag: this.handleFlag, handleMute: this.handleMute, handleAction: this.handleAction, handleDelete: this.handleDelete, handleEdit: this.handleEdit, handleRetry: this.handleRetry, handleOpenThread: this.props.openThread && this.props.openThread.bind(this, message), isMyMessage: this.isMyMessage, channelConfig: config, onMentionsClickMessage: this.onMentionsClick, onMentionsHoverMessage: this.onMentionsHover })));
    };
    Message.propTypes = {
        /** The message object */
        message: prop_types_1.default.object.isRequired,
        /** The client connection object for connecting to Stream */
        client: prop_types_1.default.object.isRequired,
        /** The current channel this message is displayed in */
        channel: prop_types_1.default.object.isRequired,
        /** A list of users that have read this message **/
        readBy: prop_types_1.default.array,
        /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
        groupStyles: prop_types_1.default.array,
        /** Editing, if the message is currently being edited */
        editing: prop_types_1.default.bool,
        /**
         * Message UI component to display a message in message list.
         * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
         * */
        Message: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         * Attachment UI component to display attachment in individual message.
         * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
         * */
        Attachment: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /** render HTML instead of markdown. Posting HTML is only allowed server-side */
        unsafeHTML: prop_types_1.default.bool,
        /**
         * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
         * If all the actions need to be disabled, empty array or false should be provided as value of prop.
         * */
        messageActions: prop_types_1.default.oneOfType([prop_types_1.default.bool, prop_types_1.default.array]),
        /**
         * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
         *
         * This function should accept following params:
         *
         * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
         *
         * */
        getFlagMessageSuccessNotification: prop_types_1.default.func,
        /**
         * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
         *
         * This function should accept following params:
         *
         * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
         *
         * */
        getFlagMessageErrorNotification: prop_types_1.default.func,
        /**
         * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
         *
         * This function should accept following params:
         *
         * @param user A user object which is being muted
         *
         * */
        getMuteUserSuccessNotification: prop_types_1.default.func,
        /**
         * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
         *
         * This function should accept following params:
         *
         * @param user A user object which is being muted
         *
         * */
        getMuteUserErrorNotification: prop_types_1.default.func,
        /** Latest message id on current channel */
        lastReceivedId: prop_types_1.default.string,
        /** DOMRect object for parent MessageList component */
        messageListRect: prop_types_1.default.object,
        /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
        members: prop_types_1.default.object,
        /**
         * Function to add custom notification on messagelist
         *
         * @param text Notification text to display
         * @param type Type of notification. 'success' | 'error'
         * */
        addNotification: prop_types_1.default.func,
        /** Sets the editing state */
        setEditingState: prop_types_1.default.func,
        /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
        updateMessage: prop_types_1.default.func,
        /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
        removeMessage: prop_types_1.default.func,
        /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
        retrySendMessage: prop_types_1.default.func,
        /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
        onMentionsClick: prop_types_1.default.func,
        /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
        onMentionsHover: prop_types_1.default.func,
        /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
        openThread: prop_types_1.default.func,
        /** Handler to clear the edit state of message. It is defined in [MessageList](https://getstream.github.io/stream-chat-react/#messagelist) component */
        clearEditingState: prop_types_1.default.func,
        /**
         * Additional props for underlying MessageInput component.
         * Available props - https://getstream.github.io/stream-chat-react/#messageinput
         * */
        additionalMessageInputProps: prop_types_1.default.object,
    };
    Message.defaultProps = {
        Message: MessageSimple_1.MessageSimple,
        readBy: [],
        groupStyles: [],
        Attachment: Attachment_1.Attachment,
        editing: false,
        messageActions: Object.keys(utils_1.MESSAGE_ACTIONS),
    };
    return Message;
}(react_1.Component));
exports.Message = Message;
exports.Message = Message = context_1.withTranslationContext(Message);
