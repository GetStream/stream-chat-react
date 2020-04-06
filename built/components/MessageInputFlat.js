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
var react_file_utils_1 = require("react-file-utils");
var utils_1 = require("../utils");
var emoji_mart_1 = require("emoji-mart");
/**
 * MessageInputFlat - Large Message Input to be used for the MessageInput.
 * @example ./docs/MessageInputFlat.md
 */
var MessageInputFlat = /** @class */ (function (_super) {
    __extends(MessageInputFlat, _super);
    function MessageInputFlat() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.renderUploads = function () { return (react_1.default.createElement(react_1.default.Fragment, null,
            _this.props.imageOrder.length > 0 && (react_1.default.createElement(react_file_utils_1.ImagePreviewer, { imageUploads: _this.props.imageOrder.map(function (id) { return _this.props.imageUploads[id]; }), handleRemove: _this.props.removeImage, handleRetry: _this.props.uploadImage, handleFiles: _this.props.uploadNewFiles, multiple: _this.props.multipleUploads, disabled: _this.props.numberOfUploads >= _this.props.maxNumberOfFiles })),
            _this.props.fileOrder.length > 0 && (react_1.default.createElement("div", { className: "str-chat__file-uploads" },
                react_1.default.createElement(react_file_utils_1.FilePreviewer, { uploads: _this.props.fileOrder.map(function (id) { return _this.props.fileUploads[id]; }), handleRemove: _this.props.removeFile, handleRetry: _this.props.uploadFile, handleFiles: _this.props.uploadNewFiles }))))); };
        _this.renderEmojiPicker = function () {
            if (_this.props.emojiPickerIsOpen) {
                return (react_1.default.createElement("div", { className: "str-chat__input-flat--emojipicker", ref: _this.props.emojiPickerRef },
                    react_1.default.createElement(emoji_mart_1.Picker, { native: true, emoji: "point_up", title: "Pick your emoji\u2026", onSelect: _this.props.onSelectEmoji, color: "#006CFF", showPreview: false, emojisToShowFilter: utils_1.filterEmoji })));
            }
        };
        return _this;
    }
    MessageInputFlat.prototype.render = function () {
        var _this = this;
        var t = this.props.t;
        var SendButton = this.props.SendButton;
        return (react_1.default.createElement("div", { className: "str-chat__input-flat " + (SendButton ? 'str-chat__input-flat--send-button-active' : null) },
            react_1.default.createElement(react_file_utils_1.ImageDropzone, { accept: this.props.acceptedFiles, multiple: this.props.multipleUploads, disabled: this.props.numberOfUploads >= this.props.maxNumberOfFiles, handleFiles: this.props.uploadNewFiles },
                react_1.default.createElement("div", { className: "str-chat__input-flat-wrapper" },
                    this.renderUploads(),
                    this.renderEmojiPicker(),
                    react_1.default.createElement("div", { className: "str-chat__input-flat--textarea-wrapper" },
                        react_1.default.createElement(ChatAutoComplete_1.ChatAutoComplete, { users: this.props.getUsers(), commands: this.props.getCommands(), innerRef: this.props.textareaRef, handleSubmit: function (e) { return _this.props.handleSubmit(e); }, onSelectItem: this.props.onSelectItem, onChange: this.props.handleChange, value: this.props.text, rows: 1, maxRows: this.props.maxRows, placeholder: t('Type your message'), onPaste: this.props.onPaste, grow: this.props.grow, onFocus: this.props.onFocus, disabled: this.props.disabled, additionalTextareaProps: this.props.additionalTextareaProps }),
                        react_1.default.createElement("span", { className: "str-chat__input-flat-emojiselect", onClick: this.props.openEmojiPicker },
                            react_1.default.createElement("svg", { width: "28", height: "28", xmlns: "http://www.w3.org/2000/svg" },
                                react_1.default.createElement("path", { d: "M22.217 16.1c.483.25.674.849.423 1.334C21.163 20.294 17.771 22 14 22c-3.867 0-7.347-1.765-8.66-4.605a.994.994 0 0 1 .9-1.407c.385 0 .739.225.9.575C8.135 18.715 10.892 20 14 20c3.038 0 5.738-1.267 6.879-3.476a.99.99 0 0 1 1.338-.424zm1.583-3.652c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.338 0-.659-.132-.858-.389-.212-.276-.476-.611-1.076-.611-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.517-.349-.578-.947-.235-1.388.66-.847 1.483-1.445 2.789-1.445 1.305 0 2.136.6 2.79 1.448zm-14 0c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.339 0-.659-.132-.858-.389C7.873 13.335 7.61 13 7.01 13c-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.518-.349-.579-.947-.235-1.388C4.88 11.598 5.703 11 7.01 11c1.305 0 2.136.6 2.79 1.448zM14 0c7.732 0 14 6.268 14 14s-6.268 14-14 14S0 21.732 0 14 6.268 0 14 0zm8.485 22.485A11.922 11.922 0 0 0 26 14c0-3.205-1.248-6.219-3.515-8.485A11.922 11.922 0 0 0 14 2a11.922 11.922 0 0 0-8.485 3.515A11.922 11.922 0 0 0 2 14c0 3.205 1.248 6.219 3.515 8.485A11.922 11.922 0 0 0 14 26c3.205 0 6.219-1.248 8.485-3.515z", fillRule: "evenodd" }))),
                        react_1.default.createElement(react_file_utils_1.FileUploadButton, { multiple: this.props.multipleUploads, disabled: this.props.numberOfUploads >= this.props.maxNumberOfFiles, accepts: this.props.acceptedFiles, handleFiles: this.props.uploadNewFiles },
                            react_1.default.createElement("span", { className: "str-chat__input-flat-fileupload" },
                                react_1.default.createElement("svg", { width: "14", height: "14", xmlns: "http://www.w3.org/2000/svg" },
                                    react_1.default.createElement("path", { d: "M1.667.333h10.666c.737 0 1.334.597 1.334 1.334v10.666c0 .737-.597 1.334-1.334 1.334H1.667a1.333 1.333 0 0 1-1.334-1.334V1.667C.333.93.93.333 1.667.333zm2 1.334a1.667 1.667 0 1 0 0 3.333 1.667 1.667 0 0 0 0-3.333zm-2 9.333v1.333h10.666v-4l-2-2-4 4-2-2L1.667 11z", fillRule: "nonzero" })))),
                        SendButton && (react_1.default.createElement(SendButton, { sendMessage: this.props.handleSubmit })))))));
    };
    MessageInputFlat.propTypes = {
        /** Set focus to the text input if this is enabled */
        focus: prop_types_1.default.bool,
        /** Grow the textarea while you're typing */
        grow: prop_types_1.default.bool,
        /** Disable the textarea */
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
    MessageInputFlat.defaultProps = {
        grow: true,
        disabled: false,
    };
    return MessageInputFlat;
}(react_1.PureComponent));
var MessageInputFlatWithContext = context_1.withTranslationContext(MessageInputFlat);
exports.MessageInputFlat = MessageInputFlatWithContext;
