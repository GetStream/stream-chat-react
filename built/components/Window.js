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
/**
 * Window - A UI component for conditionally displaying thread or channel.
 *
 * @example ./docs/Window.md
 * @extends PureComponent
 */
var Window = /** @class */ (function (_super) {
    __extends(Window, _super);
    function Window() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Window.prototype.render = function () {
        var _a = this.props, thread = _a.thread, hideOnThread = _a.hideOnThread, children = _a.children;
        // If thread is active and window should hide on thread. Return null
        if (thread && hideOnThread) {
            return null;
        }
        return react_1.default.createElement("div", { className: "str-chat__main-panel" }, children);
    };
    Window.propTypes = {
        /** show or hide the window when a thread is active */
        hideOnThread: prop_types_1.default.bool,
        /** Flag if thread is open or not */
        thread: prop_types_1.default.oneOfType([prop_types_1.default.bool, prop_types_1.default.object]),
    };
    Window.defaultProps = {
        hideOnThread: false,
    };
    return Window;
}(react_1.default.PureComponent));
exports.Window = Window;
exports.Window = Window = context_1.withChannelContext(Window);
