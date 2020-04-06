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
var context_1 = require("../context");
var ChatAutoComplete_1 = require("./ChatAutoComplete");
var emoji_mart_1 = require("emoji-mart");
var react_file_utils_1 = require("react-file-utils");
var utils_1 = require("../utils");
/**
 * MessageInputSmall - compact design to be used for the MessageInput. It has all the features of MessageInput minus the typing indicator.
 * @example ./docs/MessageInputSmall.md
 */
var MessageInputSmall = /** @class */ (function (_super) {
    __extends(MessageInputSmall, _super);
    function MessageInputSmall() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.renderUploads = function () { return (react_1.default.createElement(react_1.default.Fragment, null,
            _this.props.imageOrder.length > 0 && (react_1.default.createElement(react_file_utils_1.ImagePreviewer, { imageUploads: _this.props.imageOrder.map(function (id) { return _this.props.imageUploads[id]; }), handleRemove: _this.props.removeImage, handleRetry: _this.props.uploadImage, handleFiles: _this.props.uploadNewFiles, multiple: _this.props.multipleUploads, disabled: _this.props.numberOfUploads >= _this.props.maxNumberOfFiles
                    ? true
                    : false })),
            _this.props.fileOrder.length > 0 && (react_1.default.createElement(react_file_utils_1.FilePreviewer, { uploads: _this.props.fileOrder.map(function (id) { return _this.props.fileUploads[id]; }), handleRemove: _this.props.removeFile, handleRetry: _this.props.uploadFile, handleFiles: _this.props.uploadNewFiles })))); };
        _this.renderEmojiPicker = function () {
            if (_this.props.emojiPickerIsOpen) {
                return (react_1.default.createElement("div", { className: "str-chat__small-message-input-emojipicker", ref: _this.props.emojiPickerRef },
                    react_1.default.createElement(emoji_mart_1.Picker, { native: true, emoji: "point_up", title: "Pick your emoji\u2026", onSelect: _this.props.onSelectEmoji, color: "#006CFF", showPreview: false, emojisToShowFilter: utils_1.filterEmoji })));
            }
        };
        return _this;
    }
    MessageInputSmall.prototype.render = function () {
        var t = this.props.t;
        var SendButton = this.props.SendButton;
        return (react_1.default.createElement("div", { className: "str-chat__small-message-input__wrapper" },
            react_1.default.createElement(react_file_utils_1.ImageDropzone, { accept: this.props.acceptedFiles, multiple: this.props.multipleUploads, disabled: this.props.numberOfUploads >= this.props.maxNumberOfFiles
                    ? true
                    : false, handleFiles: this.props.uploadNewFiles },
                react_1.default.createElement("div", { className: "str-chat__small-message-input " + (SendButton
                        ? 'str-chat__small-message-input--send-button-active'
                        : null) },
                    this.renderUploads(),
                    this.renderEmojiPicker(),
                    react_1.default.createElement("div", { className: "str-chat__small-message-input--textarea-wrapper" },
                        react_1.default.createElement(ChatAutoComplete_1.ChatAutoComplete, { users: this.props.getUsers(), commands: this.props.getCommands(), innerRef: this.props.textareaRef, handleSubmit: this.props.handleSubmit, onChange: this.props.handleChange, value: this.props.text, rows: 1, maxRows: this.props.maxRows, onSelectItem: this.props.onSelectItem, placeholder: t('Type your message'), onPaste: this.props.onPaste, grow: this.props.grow, disabled: this.props.disabled, additionalTextareaProps: this.props.additionalTextareaProps }),
                        react_1.default.createElement("span", { className: "str-chat__small-message-input-emojiselect", onClick: this.props.openEmojiPicker },
                            react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                                react_1.default.createElement("path", { d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z", fillRule: "evenodd" }))),
                        react_1.default.createElement(react_file_utils_1.FileUploadButton, { multiple: this.props.multipleUploads, disabled: this.props.numberOfUploads >= this.props.maxNumberOfFiles
                                ? true
                                : false, accepts: this.props.acceptedFiles, handleFiles: this.props.uploadNewFiles },
                            react_1.default.createElement("span", { className: "str-chat__small-message-input-fileupload", onClick: this.props.openFilePanel },
                                react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                                    react_1.default.createElement("path", { d: "M7 .5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5S.5 10.59.5 7 3.41.5 7 .5zm0 12c3.031 0 5.5-2.469 5.5-5.5S10.031 1.5 7 1.5A5.506 5.506 0 0 0 1.5 7c0 3.034 2.469 5.5 5.5 5.5zM7.506 3v3.494H11v1.05H7.506V11h-1.05V7.544H3v-1.05h3.456V3h1.05z", fillRule: "nonzero" })))),
                        SendButton && (react_1.default.createElement(SendButton, { sendMessage: this.props.handleSubmit })))))));
    };
    MessageInputSmall.propTypes = {
        /** Set focus to the text input if this is enabled */
        focus: prop_types_1.default.bool.isRequired,
        /** Grow the textarea while you're typing */
        grow: prop_types_1.default.bool.isRequired,
        /** Specify the max amount of rows the textarea is able to grow */
        maxRows: prop_types_1.default.number.isRequired,
        /** Make the textarea disabled */
        disabled: prop_types_1.default.bool,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        imageOrder: prop_types_1.default.array,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        imageUploads: prop_types_1.default.object,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        removeImage: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        uploadImage: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        uploadNewFiles: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        numberOfUploads: prop_types_1.default.number,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        fileOrder: prop_types_1.default.array,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        fileUploads: prop_types_1.default.object,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        removeFile: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        uploadFile: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        emojiPickerIsOpen: prop_types_1.default.bool,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        emojiPickerRef: prop_types_1.default.object,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        onSelectEmoji: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        getUsers: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        getCommands: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        textareaRef: prop_types_1.default.object,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        handleSubmit: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        handleChange: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        onSelectItem: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        text: prop_types_1.default.string,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        onPaste: prop_types_1.default.func,
        /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
        openEmojiPicker: prop_types_1.default.func,
        /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
        watcher_count: prop_types_1.default.number,
        /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
        typing: prop_types_1.default.object,
        /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
        multipleUploads: prop_types_1.default.object,
        /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
        maxNumberOfFiles: prop_types_1.default.number,
        /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
        acceptedFiles: prop_types_1.default.object,
        /**
         * Custom UI component for send button.
         *
         * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
         * */
        SendButton: prop_types_1.default.oneOfType([prop_types_1.default.node, prop_types_1.default.func]),
        /**
         * Any additional attrubutes that you may want to add for underlying HTML textarea element.
         */
        additionalTextareaProps: prop_types_1.default.object,
    };
    return MessageInputSmall;
}(react_1.PureComponent));
var MessageInputSmallWithContext = context_1.withTranslationContext(MessageInputSmall);
exports.MessageInputSmall = MessageInputSmallWithContext;
