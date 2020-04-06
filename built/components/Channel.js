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
var context_1 = require("../context");
var LoadingIndicator_1 = require("./LoadingIndicator");
var LoadingErrorIndicator_1 = require("./LoadingErrorIndicator");
var v4_1 = __importDefault(require("uuid/v4"));
var prop_types_1 = __importDefault(require("prop-types"));
var seamless_immutable_1 = __importDefault(require("seamless-immutable"));
var visibilityjs_1 = __importDefault(require("visibilityjs"));
var stream_chat_1 = require("stream-chat");
var MessageSimple_1 = require("./MessageSimple");
var Attachment_1 = require("./Attachment");
var debounce_1 = __importDefault(require("lodash/debounce"));
var throttle_1 = __importDefault(require("lodash/throttle"));
/**
 * Channel - Wrapper component for a channel. It needs to be place inside of the Chat component.
 * ChannelHeader, MessageList, Thread and MessageInput should be used as children of the Channel component.
 *
 * @example ./docs/Channel.md
 * @extends PureComponent
 */
var Channel = /** @class */ (function (_super) {
    __extends(Channel, _super);
    function Channel(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { error: false };
        return _this;
    }
    Channel.prototype.render = function () {
        if (!this.props.channel.cid) {
            return this.props.EmptyPlaceholder;
        }
        // We use a wrapper to make sure the key variable is set.
        // this ensures that if you switch channel the component is recreated
        return react_1.default.createElement(ChannelInner, __assign({}, this.props, { key: this.props.channel.cid }));
    };
    Channel.propTypes = {
        /** Which channel to connect to, will initialize the channel if it's not initialized yet */
        channel: prop_types_1.default.shape({
            watch: prop_types_1.default.func,
        }).isRequired,
        /** Client is passed automatically via the Chat Context */
        client: prop_types_1.default.object.isRequired,
        /**
         * Empty channel UI component. This will be shown on the screen if there is no active channel.
         *
         * Defaults to null which skips rendering the Channel
         *
         * */
        EmptyPlaceholder: prop_types_1.default.node,
        /**
         * Error indicator UI component. This will be shown on the screen if channel query fails.
         *
         * Defaults to and accepts same props as: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react/#loadingerrorindicator)
         *
         * */
        LoadingErrorIndicator: prop_types_1.default.oneOfType([
            prop_types_1.default.node,
            prop_types_1.default.func,
        ]),
        /**
         * Loading indicator UI component. This will be shown on the screen until the messages are
         * being queried from channelœ. Once the messages are loaded, loading indicator is removed from the screen
         * and replaced with children of the Channel component.
         *
         * Defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingIndicator.js)
         */
        LoadingIndicator: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         * Message UI component to display a message in message list.
         *
         * Available built-in components (also accepts the same props as):
         *
         * 1. [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageSimple.js) (default)
         * 2. [MessageTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageTeam.js)
         * 3. [MessageLivestream](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageLivestream.js)
         * 3. [MessageCommerce](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageCommerce.js)
         *
         * */
        Message: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         * Attachment UI component to display attachment in individual message.
         *
         * Defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
         * */
        Attachment: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         * Handle for click on @mention in message
         *
         * @param {Event} event DOM Click event
         * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is clicked
         */
        onMentionsClick: prop_types_1.default.func,
        /**
         * Handle for hover on @mention in message
         *
         * @param {Event} event DOM hover event
         * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is hovered
         */
        onMentionsHover: prop_types_1.default.func,
        /** Weather to allow multiple attachment uploads */
        multipleUploads: prop_types_1.default.bool,
        /** List of accepted file types */
        acceptedFiles: prop_types_1.default.array,
        /** Maximum number of attachments allowed per message */
        maxNumberOfFiles: prop_types_1.default.number,
        /** Override send message request (Advanced usage only)
         *
         * @param {String} channelId full channel ID in format of `type:id`
         * @param {Object} message
         */
        doSendMessageRequest: prop_types_1.default.func,
        /** Override update(edit) message request (Advanced usage only)
         *
         * @param {String} channelId full channel ID in format of `type:id`
         * @param {Object} updatedMessage
         */
        doUpdateMessageRequest: prop_types_1.default.func,
    };
    Channel.defaultProps = {
        EmptyPlaceholder: null,
        LoadingIndicator: LoadingIndicator_1.LoadingIndicator,
        LoadingErrorIndicator: LoadingErrorIndicator_1.LoadingErrorIndicator,
        Message: MessageSimple_1.MessageSimple,
        Attachment: Attachment_1.Attachment,
    };
    return Channel;
}(react_1.PureComponent));
exports.Channel = Channel;
var ChannelInner = /** @class */ (function (_super) {
    __extends(ChannelInner, _super);
    function ChannelInner(props) {
        var _this = _super.call(this, props) || this;
        _this.openThread = function (message, e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            var channel = _this.props.channel;
            var threadMessages = channel.state.threads[message.id] || [];
            _this.setState({
                thread: message,
                threadMessages: threadMessages,
            });
        };
        _this.loadMoreThread = function () { return __awaiter(_this, void 0, void 0, function () {
            var channel, parentID, oldMessages, oldestMessageID, limit, queryResponse, hasMore, threadMessages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // prevent duplicate loading events...
                        if (this.state.threadLoadingMore)
                            return [2 /*return*/];
                        this.setState({
                            threadLoadingMore: true,
                        });
                        channel = this.props.channel;
                        parentID = this.state.thread.id;
                        oldMessages = channel.state.threads[parentID] || [];
                        oldestMessageID = oldMessages[0] ? oldMessages[0].id : null;
                        limit = 50;
                        return [4 /*yield*/, channel.getReplies(parentID, {
                                limit: limit,
                                id_lt: oldestMessageID,
                            })];
                    case 1:
                        queryResponse = _a.sent();
                        hasMore = queryResponse.messages.length === limit;
                        threadMessages = channel.state.threads[parentID] || [];
                        // next set loadingMore to false so we can start asking for more data...
                        this._loadMoreThreadFinishedDebounced(hasMore, threadMessages);
                        return [2 /*return*/];
                }
            });
        }); };
        _this.loadMoreThreadFinished = function (threadHasMore, threadMessages) {
            _this.setState({
                threadLoadingMore: false,
                threadHasMore: threadHasMore,
                threadMessages: threadMessages,
            });
        };
        _this.closeThread = function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            _this.setState({
                thread: null,
                threadMessages: [],
            });
        };
        _this.updateMessage = function (updatedMessage, extraState) {
            var channel = _this.props.channel;
            extraState = extraState || {};
            // adds the message to the local channel state..
            // this adds to both the main channel state as well as any reply threads
            channel.state.addMessageSorted(updatedMessage);
            // update the Channel component state
            if (_this.state.thread && updatedMessage.parent_id) {
                extraState.threadMessages =
                    channel.state.threads[updatedMessage.parent_id] || [];
            }
            _this.setState(__assign({ messages: channel.state.messages }, extraState));
        };
        _this.removeMessage = function (message) {
            var channel = _this.props.channel;
            channel.state.removeMessage(message);
            var threadMessages = channel.state.threads[message.parent_id] || [];
            _this.setState({
                messages: channel.state.messages,
                threads: channel.state.threads,
                threadMessages: threadMessages,
            });
        };
        _this.createMessagePreview = function (text, attachments, parent, mentioned_users) {
            // create a preview of the message
            var clientSideID = _this.props.client.userID + "-" + v4_1.default();
            var message = {
                text: text,
                html: text,
                __html: text,
                //id: tmpID,
                id: clientSideID,
                type: 'regular',
                status: 'sending',
                user: __assign({ id: _this.props.client.userID }, _this.props.client.user),
                created_at: new Date(),
                attachments: attachments,
                mentioned_users: mentioned_users,
                reactions: [],
            };
            if (parent && parent.id) {
                message.parent_id = parent.id;
            }
            return message;
        };
        _this.editMessage = function (updatedMessage) {
            if (_this.props.doUpdateMessageRequest) {
                return Promise.resolve(_this.props.doUpdateMessageRequest(_this.props.channel.cid, updatedMessage));
            }
            return _this.props.client.updateMessage(updatedMessage);
        };
        _this._sendMessage = function (message) { return __awaiter(_this, void 0, void 0, function () {
            var text, attachments, id, parent_id, mentioned_users, messageData, messageResponse, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        text = message.text, attachments = message.attachments, id = message.id, parent_id = message.parent_id, mentioned_users = message.mentioned_users;
                        messageData = {
                            text: text,
                            attachments: attachments,
                            mentioned_users: mentioned_users,
                            id: id,
                            parent_id: parent_id,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        messageResponse = void 0;
                        if (!this.props.doSendMessageRequest) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.props.doSendMessageRequest(this.props.channel.cid, messageData)];
                    case 2:
                        messageResponse = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.props.channel.sendMessage(messageData)];
                    case 4:
                        messageResponse = _a.sent();
                        _a.label = 5;
                    case 5:
                        // replace it after send is completed
                        if (messageResponse.message) {
                            messageResponse.message.status = 'received';
                            this.updateMessage(messageResponse.message);
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        // set the message to failed..
                        message.status = 'failed';
                        this.updateMessage(message);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        _this.sendMessage = function (_a) {
            var text = _a.text, _b = _a.attachments, attachments = _b === void 0 ? [] : _b, _c = _a.mentioned_users, mentioned_users = _c === void 0 ? [] : _c, parent = _a.parent;
            return __awaiter(_this, void 0, void 0, function () {
                var messagePreview;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            // remove error messages upon submit
                            this.props.channel.state.filterErrorMessages();
                            messagePreview = this.createMessagePreview(text, attachments, parent, mentioned_users);
                            // first we add the message to the UI
                            this.updateMessage(messagePreview, {
                                messageInput: '',
                                commands: [],
                                userAutocomplete: [],
                            });
                            return [4 /*yield*/, this._sendMessage(messagePreview)];
                        case 1:
                            _d.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        _this.retrySendMessage = function (message) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // set the message status to sending
                        message = message.asMutable();
                        message.status = 'sending';
                        this.updateMessage(message);
                        // actually try to send the message...
                        return [4 /*yield*/, this._sendMessage(message)];
                    case 1:
                        // actually try to send the message...
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.handleEvent = function (e) {
            var channel = _this.props.channel;
            var threadMessages = [];
            var threadState = {};
            if (_this.state.thread) {
                threadMessages = channel.state.threads[_this.state.thread.id] || [];
                threadState['threadMessages'] = threadMessages;
            }
            if (_this.state.thread &&
                e.message &&
                e.message.id === _this.state.thread.id) {
                threadState['thread'] = channel.state.messageToImmutable(e.message);
            }
            if (Object.keys(threadState).length > 0) {
                // TODO: in theory we should do 1 setState call not 2,
                // However the setStateThrottled doesn't support this
                _this.setState(threadState);
            }
            if (e.type === 'message.new') {
                var mainChannelUpdated = true;
                if (e.message.parent_id && !e.message.show_in_channel) {
                    mainChannelUpdated = false;
                }
                if (mainChannelUpdated &&
                    e.message.user.id !== _this.props.client.userID) {
                    if (visibilityjs_1.default.state() === 'visible') {
                        _this._markReadThrottled(channel);
                    }
                    else {
                        var unread = channel.countUnread(_this.lastRead);
                        document.title = "(" + unread + ") " + _this.originalTitle;
                    }
                }
            }
            if (e.type === 'member.added') {
                _this.addToEventHistory(e);
            }
            if (e.type === 'member.removed') {
                _this.addToEventHistory(e);
            }
            _this._setStateThrottled({
                messages: channel.state.messages,
                watchers: channel.state.watchers,
                read: channel.state.read,
                typing: channel.state.typing,
                watcher_count: channel.state.watcher_count,
            });
        };
        _this.addToEventHistory = function (e) {
            _this.setState(function (prevState) {
                var _a, _b;
                if (!prevState.message || !prevState.message.length) {
                    return;
                }
                var lastMessageId = prevState.messages[prevState.messages.length - 1].id;
                if (!prevState.eventHistory[lastMessageId])
                    return __assign(__assign({}, prevState), { eventHistory: __assign(__assign({}, prevState.eventHistory), (_a = {}, _a[lastMessageId] = [e], _a)) });
                return __assign(__assign({}, prevState), { eventHistory: __assign(__assign({}, prevState.eventHistory), (_b = {}, _b[lastMessageId] = __spreadArrays(prevState.eventHistory[lastMessageId], [e]), _b)) });
            });
        };
        _this.markRead = function (channel) {
            if (!channel.getConfig().read_events) {
                return;
            }
            _this.lastRead = new Date();
            stream_chat_1.logChatPromiseExecution(channel.markRead(), 'mark read');
            if (_this.originalTitle) {
                document.title = _this.originalTitle;
            }
        };
        _this.loadMore = function (limit) {
            if (limit === void 0) { limit = 100; }
            return __awaiter(_this, void 0, void 0, function () {
                var oldestMessage, oldestID, perPage, queryResponse, e_1, hasMore;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // prevent duplicate loading events...
                            if (this.state.loadingMore)
                                return [2 /*return*/];
                            this.setState({ loadingMore: true });
                            oldestMessage = this.state.messages[0];
                            if (oldestMessage && oldestMessage.status !== 'received') {
                                this.setState({
                                    loadingMore: false,
                                });
                                return [2 /*return*/];
                            }
                            oldestID = oldestMessage ? oldestMessage.id : null;
                            perPage = limit;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.props.channel.query({
                                    messages: { limit: perPage, id_lt: oldestID },
                                })];
                        case 2:
                            queryResponse = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            console.warn('message pagination request failed with error', e_1);
                            this.setState({ loadingMore: false });
                            return [2 /*return*/];
                        case 4:
                            hasMore = queryResponse.messages.length === perPage;
                            this._loadMoreFinishedDebounced(hasMore, this.props.channel.state.messages);
                            return [2 /*return*/];
                    }
                });
            });
        };
        _this._onMentionsHoverOrClick = function (e, mentioned_users) {
            if (!_this.props.onMentionsHover && !_this.props.onMentionsClick)
                return;
            var tagName = e.target.tagName.toLowerCase();
            var textContent = e.target.innerHTML.replace('*', '');
            if (tagName === 'strong' && textContent[0] === '@') {
                var userName_1 = textContent.replace('@', '');
                var user = mentioned_users.find(function (user) { return user.name === userName_1 || user.id === userName_1; });
                if (_this.props.onMentionsHover &&
                    typeof _this.props.onMentionsHover === 'function' &&
                    e.type === 'mouseover') {
                    _this.props.onMentionsHover(e, user);
                }
                if (_this.props.onMentionsClick &&
                    e.type === 'click' &&
                    typeof _this.props.onMentionsClick === 'function') {
                    _this.props.onMentionsClick(e, user);
                }
            }
        };
        _this.loadMoreFinished = function (hasMore, messages) {
            _this.setState({
                loadingMore: false,
                hasMore: hasMore,
                messages: messages,
            });
        };
        _this.getContext = function () { return (__assign(__assign({}, _this.state), { client: _this.props.client, channel: _this.props.channel, Message: _this.props.Message, Attachment: _this.props.Attachment, multipleUploads: _this.props.multipleUploads, acceptedFiles: _this.props.acceptedFiles, maxNumberOfFiles: _this.props.maxNumberOfFiles, updateMessage: _this.updateMessage, removeMessage: _this.removeMessage, sendMessage: _this.sendMessage, editMessage: _this.editMessage, retrySendMessage: _this.retrySendMessage, loadMore: _this.loadMore, 
            // thread related
            openThread: _this.openThread, closeThread: _this.closeThread, loadMoreThread: _this.loadMoreThread, onMentionsClick: _this._onMentionsHoverOrClick, onMentionsHover: _this._onMentionsHoverOrClick })); };
        _this.renderComponent = function () { return _this.props.children; };
        _this.state = {
            error: false,
            // Loading the initial content of the channel
            loading: true,
            // Loading more messages
            loadingMore: false,
            hasMore: true,
            messages: seamless_immutable_1.default([]),
            online: true,
            typing: seamless_immutable_1.default({}),
            watchers: seamless_immutable_1.default({}),
            members: seamless_immutable_1.default({}),
            read: seamless_immutable_1.default({}),
            eventHistory: {},
            thread: false,
            threadMessages: [],
            threadLoadingMore: false,
            threadHasMore: true,
        };
        // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
        _this._loadMoreFinishedDebounced = debounce_1.default(_this.loadMoreFinished, 2000, {
            leading: true,
            trailing: true,
        });
        // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
        _this._loadMoreThreadFinishedDebounced = debounce_1.default(_this.loadMoreThreadFinished, 2000, {
            leading: true,
            trailing: true,
        });
        _this._markReadThrottled = throttle_1.default(_this.markRead, 500, {
            leading: true,
            trailing: true,
        });
        _this._setStateThrottled = throttle_1.default(_this.setState, 500, {
            leading: true,
            trailing: true,
        });
        return _this;
    }
    ChannelInner.prototype.componentDidMount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var channel, errored, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        channel = this.props.channel;
                        errored = false;
                        if (!!channel.initialized) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, channel.watch()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        this.setState({ error: e_2 });
                        errored = true;
                        return [3 /*break*/, 4];
                    case 4:
                        this.originalTitle = document.title;
                        this.lastRead = new Date();
                        if (!errored) {
                            this.copyChannelState();
                            this.listenToChanges();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ChannelInner.prototype.componentDidUpdate = function () {
        // If there is an active thread, then in that case we should sync
        // it with updated state of channel.
        if (this.state.thread) {
            for (var i = this.state.messages.length - 1; i >= 0; i--) {
                if (this.state.messages[i].id === this.state.thread.id) {
                    this.setState({
                        thread: this.state.messages[i],
                    });
                    break;
                }
            }
        }
    };
    ChannelInner.prototype.componentWillUnmount = function () {
        this.props.client.off('connection.recovered', this.handleEvent);
        this.props.channel.off(this.handleEvent);
        this._loadMoreFinishedDebounced.cancel();
        this._loadMoreThreadFinishedDebounced.cancel();
        if (this.visibilityListener || this.visibilityListener === 0) {
            visibilityjs_1.default.unbind(this.visibilityListener);
        }
    };
    ChannelInner.prototype.copyChannelState = function () {
        var channel = this.props.channel;
        this.setState({
            messages: channel.state.messages,
            read: channel.state.read,
            watchers: channel.state.watchers,
            members: channel.state.members,
            watcher_count: channel.state.watcher_count,
            loading: false,
            typing: seamless_immutable_1.default({}),
        });
        if (channel.countUnread() > 0)
            channel.markRead();
    };
    ChannelInner.prototype.removeEphemeralMessages = function () {
        var c = this.props.channel;
        c.state.selectRegularMessages();
        this.setState({ messages: c.state.messages });
    };
    ChannelInner.prototype.listenToChanges = function () {
        var _this = this;
        // The more complex sync logic is done in chat.js
        // listen to client.connection.recovered and all channel events
        this.props.client.on('connection.recovered', this.handleEvent);
        var channel = this.props.channel;
        channel.on(this.handleEvent);
        this.boundMarkRead = this.markRead.bind(this, channel);
        this.visibilityListener = visibilityjs_1.default.change(function (e, state) {
            if (state === 'visible') {
                _this.boundMarkRead();
            }
        });
    };
    ChannelInner.prototype.render = function () {
        var t = this.props.t;
        var core;
        var LoadingIndicator = this.props.LoadingIndicator;
        var LoadingErrorIndicator = this.props.LoadingErrorIndicator;
        if (this.state.error) {
            core = (react_1.default.createElement(LoadingErrorIndicator, { error: this.state.error }));
        }
        else if (this.state.loading) {
            core = react_1.default.createElement(LoadingIndicator, { size: 25, isLoading: true });
        }
        else if (!this.props.channel || !this.props.channel.watch) {
            core = react_1.default.createElement("div", null, t('Channel Missing'));
        }
        else {
            core = (react_1.default.createElement(context_1.ChannelContext.Provider, { value: this.getContext() },
                react_1.default.createElement("div", { className: "str-chat__container" }, this.renderComponent())));
        }
        return (react_1.default.createElement("div", { className: "str-chat str-chat-channel " + this.props.theme }, core));
    };
    ChannelInner.propTypes = {
        /** Which channel to connect to */
        channel: prop_types_1.default.shape({
            watch: prop_types_1.default.func,
        }).isRequired,
        /** Client is passed via the Chat Context */
        client: prop_types_1.default.object.isRequired,
        /** The loading indicator to use */
        LoadingIndicator: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        LoadingErrorIndicator: prop_types_1.default.oneOfType([
            prop_types_1.default.node,
            prop_types_1.default.func,
        ]),
    };
    return ChannelInner;
}(react_1.PureComponent));
exports.Channel = Channel = context_1.withChatContext(context_1.withTranslationContext(Channel));
