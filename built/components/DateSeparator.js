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
 * DateSeparator - A simple date separator
 *
 * @example ./docs/DateSeparator.md
 * @extends PureComponent
 */
var DateSeparator = /** @class */ (function (_super) {
    __extends(DateSeparator, _super);
    function DateSeparator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DateSeparator.prototype.render = function () {
        var _a = this.props, position = _a.position, tDateTimeParser = _a.tDateTimeParser;
        if (!Date.parse(this.props.date)) {
            return null;
        }
        return (react_1.default.createElement("div", { className: "str-chat__date-separator" },
            (position === 'right' || position === 'center') && (react_1.default.createElement("hr", { className: "str-chat__date-separator-line" })),
            react_1.default.createElement("div", { className: "str-chat__date-separator-date" }, this.props.formatDate
                ? this.props.formatDate(this.props.date)
                : tDateTimeParser(this.props.date.toISOString()).calendar()),
            (position === 'left' || position === 'center') && (react_1.default.createElement("hr", { className: "str-chat__date-separator-line" }))));
    };
    DateSeparator.propTypes = {
        /** The date to format */
        date: prop_types_1.default.instanceOf(Date),
        /** Set the position of the date in the separator */
        position: prop_types_1.default.oneOf(['left', 'center', 'right']),
        /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
        formatDate: prop_types_1.default.func,
    };
    DateSeparator.defaultProps = {
        position: 'right',
    };
    return DateSeparator;
}(react_1.default.PureComponent));
exports.DateSeparator = DateSeparator;
exports.DateSeparator = DateSeparator = context_1.withTranslationContext(DateSeparator);
