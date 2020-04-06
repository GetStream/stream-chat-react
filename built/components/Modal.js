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
var Modal = /** @class */ (function (_super) {
    __extends(Modal, _super);
    function Modal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.innerRef = react_1.default.createRef();
        _this.handleClick = function (e) {
            if (!_this.innerRef.current.contains(e.target)) {
                _this.props.onClose();
                document.removeEventListener('keyPress', _this.handleEscKey, false);
            }
        };
        return _this;
    }
    Modal.prototype.componentDidMount = function () {
        document.addEventListener('keyPress', this.handleEscKey, false);
    };
    Modal.prototype.componentWillUnmount = function () {
        document.removeEventListener('keyPress', this.handleEscKey, false);
    };
    Modal.prototype.handleEscKey = function (e) {
        if (e.keyCode === 27) {
            this.props.onClose();
            document.removeEventListener('keyPress', this.handleEscKey, false);
        }
    };
    Modal.prototype.render = function () {
        var openClasses = this.props.open
            ? 'str-chat__modal--open'
            : 'str-chat__modal--closed';
        return (react_1.default.createElement("div", { className: "str-chat__modal " + openClasses, onClick: this.handleClick },
            react_1.default.createElement("div", { className: "str-chat__modal__close-button" },
                "Close",
                react_1.default.createElement("svg", { width: "10", height: "10", xmlns: "http://www.w3.org/2000/svg" },
                    react_1.default.createElement("path", { d: "M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z", fillRule: "evenodd" }))),
            react_1.default.createElement("div", { className: "str-chat__modal__inner", ref: this.innerRef }, this.props.children)));
    };
    Modal.propTypes = {
        /** Callback handler for closing of modal. */
        onClose: prop_types_1.default.func,
        /** If true, modal is opened or visible. */
        open: prop_types_1.default.bool,
    };
    return Modal;
}(react_1.default.PureComponent));
exports.Modal = Modal;
