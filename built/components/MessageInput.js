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
var prop_types_1 = __importDefault(require("prop-types"));
var MessageInputLarge_1 = require("./MessageInputLarge");
var SendButton_1 = require("./SendButton");
var seamless_immutable_1 = __importDefault(require("seamless-immutable"));
var utils_1 = require("../utils");
var uniq_1 = __importDefault(require("lodash/uniq"));
var react_file_utils_1 = require("react-file-utils");
var stream_chat_1 = require("stream-chat");
// polyfill for IE11 to make MessageInput functional
if (!Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector;
}
/**
 * MessageInput - Input a new message, support for all the rich features such as image uploads, @mentions, emoticons etc.
 * @example ./docs/MessageInput.md
 * @extends PureComponent
 */
var MessageInput = /** @class */ (function (_super) {
    __extends(MessageInput, _super);
    function MessageInput(props) {
        var _this = _super.call(this, props) || this;
        _this.openEmojiPicker = function () {
            if (!_this.state.showEmojiPicker) {
                _this.setState(function () { return ({
                    emojiPickerIsOpen: true,
                }); }, function () {
                    document.addEventListener('click', _this.closeEmojiPicker, false);
                });
            }
        };
        _this.closeEmojiPicker = function (e) {
            if (_this.emojiPickerRef.current &&
                !_this.emojiPickerRef.current.contains(e.target)) {
                _this.setState({
                    emojiPickerIsOpen: false,
                }, function () {
                    document.removeEventListener('click', _this.closeEmojiPicker, false);
                });
            }
        };
        _this.onSelectEmoji = function (emoji) { return _this.insertText(emoji.native); };
        _this.insertText = function (textToInsert) { return __awaiter(_this, void 0, void 0, function () {
            var newCursorPosition, textareaElement;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.setState(function (prevState) {
                            var prevText = prevState.text;
                            var textareaElement = _this.textareaRef.current;
                            if (!textareaElement) {
                                return { text: prevText + textToInsert };
                            }
                            // Insert emoji at previous cursor position
                            var selectionStart = textareaElement.selectionStart, selectionEnd = textareaElement.selectionEnd;
                            newCursorPosition = selectionStart + textToInsert.length;
                            return {
                                text: prevText.slice(0, selectionStart) +
                                    textToInsert +
                                    prevText.slice(selectionEnd),
                            };
                        })];
                    case 1:
                        _a.sent();
                        textareaElement = this.textareaRef.current;
                        if (!textareaElement || newCursorPosition == null) {
                            return [2 /*return*/];
                        }
                        // Update cursorPosition
                        textareaElement.selectionStart = newCursorPosition;
                        textareaElement.selectionEnd = newCursorPosition;
                        return [2 /*return*/];
                }
            });
        }); };
        _this.getCommands = function () { return _this.props.channel.getConfig().commands; };
        _this.getUsers = function () {
            var users = [];
            var members = _this.props.channel.state.members;
            var watchers = _this.props.channel.state.watchers;
            if (members && Object.values(members).length) {
                Object.values(members).forEach(function (member) { return users.push(member.user); });
            }
            if (watchers && Object.values(watchers).length) {
                users.push.apply(users, Object.values(watchers));
            }
            // make sure we don't list users twice
            var userMap = {};
            for (var _i = 0, users_1 = users; _i < users_1.length; _i++) {
                var user = users_1[_i];
                if (user !== undefined && !userMap[user.id]) {
                    userMap[user.id] = user;
                }
            }
            return Object.values(userMap);
        };
        _this.handleChange = function (event) {
            event.preventDefault();
            if (!event || !event.target) {
                return '';
            }
            var text = event.target.value;
            _this.setState({ text: text });
            if (text) {
                stream_chat_1.logChatPromiseExecution(_this.props.channel.keystroke(), 'start typing event');
            }
        };
        _this.handleSubmit = function (event) {
            event.preventDefault();
            var editing = !!_this.props.message;
            var trimmedMessage = _this.state.text.trim();
            var isEmptyMessage = trimmedMessage === '' ||
                trimmedMessage === '>' ||
                trimmedMessage === '``````' ||
                trimmedMessage === '``' ||
                trimmedMessage === '**' ||
                trimmedMessage === '____' ||
                trimmedMessage === '__' ||
                trimmedMessage === '****';
            var hasFiles = _this.state.imageOrder.length > 0 || _this.state.fileOrder.length > 0;
            if (isEmptyMessage && !hasFiles) {
                return;
            }
            var text = _this.state.text;
            // the channel component handles the actual sending of the message
            var attachments = __spreadArrays(_this.state.attachments);
            var _loop_1 = function (id) {
                var image = _this.state.imageUploads[id];
                if (!image || image.state === 'failed') {
                    return "continue";
                }
                if (image.state === 'uploading') {
                    return { value: void 0 };
                }
                var dupe = attachments.filter(function (attach) { return image.url === attach.image_url; });
                if (dupe.length >= 1)
                    return "continue";
                attachments.push({
                    type: 'image',
                    image_url: image.url,
                    fallback: image.file.name,
                });
            };
            for (var _i = 0, _a = _this.state.imageOrder; _i < _a.length; _i++) {
                var id = _a[_i];
                var state_1 = _loop_1(id);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
            var _loop_2 = function (id) {
                var upload = _this.state.fileUploads[id];
                if (!upload || upload.state === 'failed') {
                    return "continue";
                }
                if (upload.state === 'uploading') {
                    return { value: void 0 };
                }
                var dupe = attachments.filter(function (attach) { return upload.asset_url === attach.url; });
                if (dupe.length >= 1)
                    return "continue";
                attachments.push({
                    type: 'file',
                    asset_url: upload.url,
                    title: upload.file.name,
                    mime_type: upload.file.type,
                    file_size: upload.file.size,
                });
            };
            for (var _b = 0, _c = _this.state.fileOrder; _b < _c.length; _b++) {
                var id = _c[_b];
                var state_2 = _loop_2(id);
                if (typeof state_2 === "object")
                    return state_2.value;
            }
            if (editing) {
                var id = _this.props.message.id;
                var updatedMessage = { id: id };
                updatedMessage.text = text;
                updatedMessage.attachments = attachments;
                updatedMessage.mentioned_users = _this.state.mentioned_users;
                // TODO: Remove this line and show an error when submit fails
                _this.props.clearEditingState();
                var updateMessagePromise = _this.props
                    .editMessage(updatedMessage)
                    .then(_this.props.clearEditingState);
                stream_chat_1.logChatPromiseExecution(updateMessagePromise, 'update message');
            }
            else if (_this.props.overrideSubmitHandler &&
                typeof _this.props.overrideSubmitHandler === 'function') {
                _this.props.overrideSubmitHandler({
                    text: text,
                    attachments: attachments,
                    mentioned_users: uniq_1.default(_this.state.mentioned_users),
                    parent: _this.props.parent,
                }, _this.props.channel.cid);
                _this.setState({
                    text: '',
                    mentioned_users: [],
                    imageUploads: seamless_immutable_1.default({}),
                    imageOrder: [],
                    fileUploads: seamless_immutable_1.default({}),
                    fileOrder: [],
                });
            }
            else {
                var sendMessagePromise = _this.props.sendMessage({
                    text: text,
                    attachments: attachments,
                    mentioned_users: uniq_1.default(_this.state.mentioned_users),
                    parent: _this.props.parent,
                });
                stream_chat_1.logChatPromiseExecution(sendMessagePromise, 'send message');
                _this.setState({
                    text: '',
                    mentioned_users: [],
                    imageUploads: seamless_immutable_1.default({}),
                    imageOrder: [],
                    fileUploads: seamless_immutable_1.default({}),
                    fileOrder: [],
                });
            }
            stream_chat_1.logChatPromiseExecution(_this.props.channel.stopTyping(), 'stop typing');
        };
        _this._uploadNewFiles = function (files) {
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                if (file.type.startsWith('image/')) {
                    _this._uploadNewImage(file);
                }
                else if (file instanceof File && !_this.props.noFiles) {
                    _this._uploadNewFile(file);
                }
                else {
                    return;
                }
            }
        };
        _this._uploadNewImage = function (file) { return __awaiter(_this, void 0, void 0, function () {
            var id, reader;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = utils_1.generateRandomId();
                        return [4 /*yield*/, this.setState(function (prevState) { return ({
                                numberOfUploads: prevState.numberOfUploads + 1,
                                imageOrder: prevState.imageOrder.concat(id),
                                imageUploads: prevState.imageUploads.setIn([id], {
                                    id: id,
                                    file: file,
                                    state: 'uploading',
                                }),
                            }); })];
                    case 1:
                        _a.sent();
                        if (FileReader) {
                            reader = new FileReader();
                            reader.onload = function (event) {
                                _this.setState(function (prevState) { return ({
                                    imageUploads: prevState.imageUploads.setIn([id, 'previewUri'], event.target.result),
                                }); });
                            };
                            reader.readAsDataURL(file);
                        }
                        return [2 /*return*/, this._uploadImage(id)];
                }
            });
        }); };
        _this._uploadNewFile = function (file) { return __awaiter(_this, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = utils_1.generateRandomId();
                        return [4 /*yield*/, this.setState(function (prevState) { return ({
                                numberOfUploads: prevState.numberOfUploads + 1,
                                fileOrder: prevState.fileOrder.concat(id),
                                fileUploads: prevState.fileUploads.setIn([id], {
                                    id: id,
                                    file: file,
                                    state: 'uploading',
                                }),
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this._uploadFile(id)];
                }
            });
        }); };
        _this._uploadImage = function (id) { return __awaiter(_this, void 0, void 0, function () {
            var img, file, response, e_1, alreadyRemoved_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        img = this.state.imageUploads[id];
                        if (!img) {
                            return [2 /*return*/];
                        }
                        file = img.file;
                        return [4 /*yield*/, this.setState(function (prevState) { return ({
                                imageUploads: prevState.imageUploads.setIn([id, 'state'], 'uploading'),
                            }); })];
                    case 1:
                        _a.sent();
                        response = {};
                        response = {};
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        if (!this.props.doImageUploadRequest) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.props.doImageUploadRequest(file, this.props.channel)];
                    case 3:
                        response = _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.props.channel.sendImage(file)];
                    case 5:
                        response = _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_1 = _a.sent();
                        console.warn(e_1);
                        alreadyRemoved_1 = false;
                        return [4 /*yield*/, this.setState(function (prevState) {
                                var image = prevState.imageUploads[id];
                                if (!image) {
                                    alreadyRemoved_1 = true;
                                    return {
                                        numberOfUploads: prevState.numberOfUploads - 1,
                                    };
                                }
                                return {
                                    imageUploads: prevState.imageUploads.setIn([id, 'state'], 'failed'),
                                    numberOfUploads: prevState.numberOfUploads - 1,
                                };
                            })];
                    case 8:
                        _a.sent();
                        if (!alreadyRemoved_1) {
                            this.props.errorHandler(e_1, 'upload-image', {
                                feedGroup: this.props.feedGroup,
                                userId: this.props.userId,
                            });
                        }
                        return [2 /*return*/];
                    case 9:
                        this.setState(function (prevState) { return ({
                            imageUploads: prevState.imageUploads
                                .setIn([id, 'state'], 'finished')
                                .setIn([id, 'url'], response.file),
                        }); });
                        return [2 /*return*/];
                }
            });
        }); };
        _this._uploadFile = function (id) { return __awaiter(_this, void 0, void 0, function () {
            var upload, file, response, e_2, alreadyRemoved_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upload = this.state.fileUploads[id];
                        if (!upload) {
                            return [2 /*return*/];
                        }
                        file = upload.file;
                        return [4 /*yield*/, this.setState(function (prevState) { return ({
                                imageUploads: prevState.imageUploads.setIn([id, 'state'], 'uploading'),
                            }); })];
                    case 1:
                        _a.sent();
                        response = {};
                        response = {};
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        if (!this.props.doFileUploadRequest) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.props.doFileUploadRequest(file, this.props.channel)];
                    case 3:
                        response = _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.props.channel.sendFile(file)];
                    case 5:
                        response = _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_2 = _a.sent();
                        console.warn(e_2);
                        alreadyRemoved_2 = false;
                        return [4 /*yield*/, this.setState(function (prevState) {
                                var image = prevState.imageUploads[id];
                                if (!image) {
                                    alreadyRemoved_2 = true;
                                    return {
                                        numberOfUploads: prevState.numberOfUploads - 1,
                                    };
                                }
                                return {
                                    numberOfUploads: prevState.numberOfUploads - 1,
                                    fileUploads: prevState.fileUploads.setIn([id, 'state'], 'failed'),
                                };
                            })];
                    case 8:
                        _a.sent();
                        if (!alreadyRemoved_2) {
                            this.props.errorHandler(e_2, 'upload-file', {
                                feedGroup: this.props.feedGroup,
                                userId: this.props.userId,
                            });
                        }
                        return [3 /*break*/, 9];
                    case 9:
                        this.setState(function (prevState) { return ({
                            fileUploads: prevState.fileUploads
                                .setIn([id, 'state'], 'finished')
                                .setIn([id, 'url'], response.file),
                        }); });
                        return [2 /*return*/];
                }
            });
        }); };
        _this._removeImage = function (id) {
            // TODO: cancel upload if still uploading
            _this.setState(function (prevState) {
                var img = prevState.imageUploads[id];
                if (!img) {
                    return {};
                }
                return {
                    numberOfUploads: prevState.numberOfUploads - 1,
                    imageUploads: prevState.imageUploads.set(id, undefined),
                    imageOrder: prevState.imageOrder.filter(function (_id) { return id !== _id; }),
                };
            });
        };
        _this._removeFile = function (id) {
            // TODO: cancel upload if still uploading
            _this.setState(function (prevState) {
                var upload = prevState.fileUploads[id];
                if (!upload) {
                    return {};
                }
                return {
                    numberOfUploads: prevState.numberOfUploads - 1,
                    fileUploads: prevState.fileUploads.set(id, undefined),
                    fileOrder: prevState.fileOrder.filter(function (_id) { return id !== _id; }),
                };
            });
        };
        _this._onPaste = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var items, plainTextPromise, _loop_3, _i, items_1, item, state_3, fileLikes, s;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        items = event.clipboardData.items;
                        if (!react_file_utils_1.dataTransferItemsHaveFiles(items)) {
                            return [2 /*return*/];
                        }
                        event.preventDefault();
                        _loop_3 = function (item) {
                            if (item.kind === 'string' && item.type === 'text/plain') {
                                plainTextPromise = new Promise(function (resolve) {
                                    item.getAsString(function (s) {
                                        resolve(s);
                                    });
                                });
                                return "break";
                            }
                        };
                        for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                            item = items_1[_i];
                            state_3 = _loop_3(item);
                            if (state_3 === "break")
                                break;
                        }
                        return [4 /*yield*/, react_file_utils_1.dataTransferItemsToFiles(items)];
                    case 1:
                        fileLikes = _a.sent();
                        if (fileLikes.length) {
                            this._uploadNewFiles(fileLikes);
                            return [2 /*return*/];
                        }
                        if (!plainTextPromise) return [3 /*break*/, 3];
                        return [4 /*yield*/, plainTextPromise];
                    case 2:
                        s = _a.sent();
                        this.insertText(s);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        _this._onSelectItem = function (item) {
            _this.setState(function (prevState) { return ({
                mentioned_users: __spreadArrays(prevState.mentioned_users, [item.id]),
            }); });
        };
        var imageOrder = [];
        var imageUploads = {};
        var fileOrder = [];
        var fileUploads = {};
        var attachments = [];
        var mentioned_users = [];
        var text = '';
        if (props.message) {
            text = props.message.text;
            for (var _i = 0, _a = props.message.attachments; _i < _a.length; _i++) {
                var attach = _a[_i];
                if (attach.type === 'image') {
                    var id = utils_1.generateRandomId();
                    imageOrder.push(id);
                    imageUploads[id] = {
                        id: id,
                        url: attach.image_url,
                        state: 'finished',
                        file: { name: attach.fallback },
                    };
                }
                else if (attach.type === 'file') {
                    var id = utils_1.generateRandomId();
                    fileOrder.push(id);
                    fileUploads[id] = {
                        id: id,
                        url: attach.asset_url,
                        state: 'finished',
                        file: {
                            name: attach.title,
                            type: attach.mime_type,
                            size: attach.file_size,
                        },
                    };
                }
                else {
                    attachments.push(attach);
                }
            }
            for (var _b = 0, _c = props.message.mentioned_users; _b < _c.length; _b++) {
                var mention = _c[_b];
                mentioned_users.push(mention.id);
            }
        }
        _this.state = {
            text: text,
            attachments: attachments,
            imageOrder: imageOrder,
            imageUploads: seamless_immutable_1.default(imageUploads),
            fileOrder: fileOrder,
            fileUploads: seamless_immutable_1.default(fileUploads),
            emojiPickerIsOpen: false,
            filePanelIsOpen: false,
            mentioned_users: mentioned_users,
            numberOfUploads: 0,
        };
        _this.textareaRef = react_1.default.createRef();
        _this.emojiPickerRef = react_1.default.createRef();
        _this.panelRef = react_1.default.createRef();
        return _this;
    }
    MessageInput.prototype.componentDidMount = function () {
        if (this.props.focus) {
            this.textareaRef.current.focus();
        }
    };
    MessageInput.prototype.componentWillUnmount = function () {
        document.removeEventListener('click', this.closeEmojiPicker, false);
        document.removeEventListener('click', this.hideFilePanel, false);
    };
    MessageInput.prototype.render = function () {
        var Input = this.props.Input;
        var handlers = {
            uploadNewFiles: this._uploadNewFiles,
            removeImage: this._removeImage,
            uploadImage: this._uploadImage,
            removeFile: this._removeFile,
            uploadFile: this._uploadFile,
            emojiPickerRef: this.emojiPickerRef,
            panelRef: this.panelRef,
            textareaRef: this.textareaRef,
            onSelectEmoji: this.onSelectEmoji,
            getUsers: this.getUsers,
            getCommands: this.getCommands,
            handleSubmit: this.handleSubmit,
            handleChange: this.handleChange,
            onPaste: this._onPaste,
            onSelectItem: this._onSelectItem,
            openEmojiPicker: this.openEmojiPicker,
        };
        return react_1.default.createElement(Input, __assign({}, this.props, this.state, handlers));
    };
    MessageInput.propTypes = {
        /** Set focus to the text input if this is enabled */
        focus: prop_types_1.default.bool.isRequired,
        /** Disable input */
        disabled: prop_types_1.default.bool.isRequired,
        /** Grow the textarea while you're typing */
        grow: prop_types_1.default.bool.isRequired,
        /** Set the maximum number of rows */
        maxRows: prop_types_1.default.number.isRequired,
        /** Via Context: the channel that we're sending the message to */
        channel: prop_types_1.default.object.isRequired,
        /** Via Context: the users currently typing, passed from the Channel component */
        typing: prop_types_1.default.object.isRequired,
        // /** Set textarea to be disabled */
        // disabled: PropTypes.bool,
        /** The parent message object when replying on a thread */
        parent: prop_types_1.default.object,
        /**
         * The component handling how the input is rendered
         *
         * Available built-in components (also accepts the same props as):
         *
         * 1. [MessageInputSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInputSmall.js)
         * 2. [MessageInputLarge](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInputLarge.js) (default)
         * 3. [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInputFlat.js)
         *
         * */
        Input: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /** Override image upload request */
        doImageUploadRequest: prop_types_1.default.func,
        /** Override file upload request */
        doFileUploadRequest: prop_types_1.default.func,
        /**
         * Custom UI component for send button.
         *
         * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
         * */
        SendButton: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         * Any additional attrubutes that you may want to add for underlying HTML textarea element.
         * e.g.
         * <MessageInput
         *  additionalTextareaProps={{
         *    maxLength: 10,
         *  }}
         * />
         */
        additionalTextareaProps: prop_types_1.default.object,
    };
    MessageInput.defaultProps = {
        focus: false,
        disabled: false,
        grow: true,
        maxRows: 10,
        Input: MessageInputLarge_1.MessageInputLarge,
        SendButton: SendButton_1.SendButton,
        additionalTextareaProps: {},
    };
    return MessageInput;
}(react_1.PureComponent));
exports.MessageInput = MessageInput;
exports.MessageInput = MessageInput = context_1.withChannelContext(MessageInput);
