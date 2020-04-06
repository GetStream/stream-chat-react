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
/**
 * Avatar - A round avatar image with fallback to username's first letter
 *
 * @example ./docs/Avatar.md
 * @extends PureComponent
 */
var Avatar = /** @class */ (function (_super) {
    __extends(Avatar, _super);
    function Avatar() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            errored: false,
            loaded: false,
        };
        _this.getInitials = function (name) {
            return name
                ? name
                    .split(' ')
                    .slice(0, 1)
                    .map(function (name) { return name.charAt(0); })
                    .join(' ')
                : null;
        };
        _this.onLoad = function () {
            _this.setState({ loaded: true });
        };
        _this.onError = function () {
            _this.setState({ errored: true });
        };
        return _this;
    }
    Avatar.prototype.componentDidUpdate = function (prevProps) {
        if (prevProps.image !== this.props.image) {
            this.setState({ loaded: false, errored: false });
        }
    };
    Avatar.prototype.render = function () {
        var _a = this.props, size = _a.size, name = _a.name, shape = _a.shape, image = _a.image;
        var initials = this.getInitials(name);
        return (react_1.default.createElement("div", { className: "str-chat__avatar str-chat__avatar--" + shape, title: name, style: {
                width: size,
                height: size,
                flexBasis: size,
                lineHeight: size + 'px',
                fontSize: size / 2,
            } }, image && !this.state.errored ? (react_1.default.createElement("img", { src: image, alt: initials ? initials : '', className: 'str-chat__avatar-image' +
                (this.state.loaded ? ' str-chat__avatar-image--loaded' : ''), style: {
                width: size,
                height: size,
                flexBasis: size,
                objectFit: 'cover',
            }, onLoad: this.onLoad, onError: this.onError })) : (react_1.default.createElement("div", { className: "str-chat__avatar-fallback" }, initials))));
    };
    Avatar.propTypes = {
        /** image url */
        image: prop_types_1.default.string,
        /** name of the picture, used for title tag fallback */
        name: prop_types_1.default.string,
        /** shape of the avatar, circle, rounded or square */
        shape: prop_types_1.default.oneOf(['circle', 'rounded', 'square']),
        /** size in pixels */
        size: prop_types_1.default.number,
    };
    Avatar.defaultProps = {
        size: 32,
        shape: 'circle',
    };
    return Avatar;
}(react_1.default.PureComponent));
exports.Avatar = Avatar;
