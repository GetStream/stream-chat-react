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
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ./docs/LoadingErrorIndicator.md
 * @extends PureComponent
 */
var LoadingErrorIndicator = /** @class */ (function (_super) {
    __extends(LoadingErrorIndicator, _super);
    function LoadingErrorIndicator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LoadingErrorIndicator.prototype.render = function () {
        if (!this.props.error)
            return null;
        var t = this.props.t;
        return (react_1.default.createElement("div", null, t('Error: {{ errorMessage }}', {
            errorMessage: this.props.error.message,
        })));
    };
    LoadingErrorIndicator.propTypes = {
        /** Error object */
        error: prop_types_1.default.oneOfType([
            prop_types_1.default.shape({
                message: prop_types_1.default.string,
            }),
            prop_types_1.default.bool,
        ]),
    };
    LoadingErrorIndicator.defaultProps = {
        error: false,
    };
    return LoadingErrorIndicator;
}(react_1.default.PureComponent));
exports.LoadingErrorIndicator = LoadingErrorIndicator;
exports.LoadingErrorIndicator = LoadingErrorIndicator = context_1.withTranslationContext(LoadingErrorIndicator);
