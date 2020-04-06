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
var react_file_utils_1 = require("react-file-utils");
var LoadMoreButton = /** @class */ (function (_super) {
    __extends(LoadMoreButton, _super);
    function LoadMoreButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LoadMoreButton.prototype.render = function () {
        return (react_1.default.createElement("div", { className: "str-chat__load-more-button" },
            react_1.default.createElement("button", { className: "str-chat__load-more-button__button", onClick: this.props.onClick, disabled: this.props.refreshing }, this.props.refreshing ? react_1.default.createElement(react_file_utils_1.LoadingIndicator, null) : this.props.children)));
    };
    LoadMoreButton.propTypes = {
        /** onClick handler load more button. Pagination logic should be executed in this handler. */
        onClick: prop_types_1.default.func,
        /** If true, LoadingIndicator is displayed instead of button */
        refreshing: prop_types_1.default.bool,
    };
    LoadMoreButton.defaultProps = {
        children: 'Load more',
    };
    return LoadMoreButton;
}(react_1.default.PureComponent));
exports.LoadMoreButton = LoadMoreButton;
