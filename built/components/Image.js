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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var prop_types_1 = __importDefault(require("prop-types"));
var react_images_1 = __importStar(require("react-images"));
/**
 * Image - Small wrapper around an image tag, supports thumbnails
 *
 * @example ./docs/Image.md
 * @extends PureComponent
 */
var Image = /** @class */ (function (_super) {
    __extends(Image, _super);
    function Image() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            modalIsOpen: false,
            currentIndex: 0,
        };
        _this.toggleModal = function () {
            _this.setState(function (state) { return ({
                modalIsOpen: !state.modalIsOpen,
            }); });
        };
        return _this;
    }
    Image.prototype.render = function () {
        var _a = this.props, image_url = _a.image_url, thumb_url = _a.thumb_url, fallback = _a.fallback;
        var formattedArray = [{ src: image_url || thumb_url }];
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("img", { className: "str-chat__message-attachment--img", onClick: this.toggleModal, src: thumb_url || image_url, alt: fallback }),
            react_1.default.createElement(react_images_1.ModalGateway, null, this.state.modalIsOpen ? (react_1.default.createElement(react_images_1.Modal, { onClose: this.toggleModal },
                react_1.default.createElement(react_images_1.default, { views: formattedArray }))) : null)));
    };
    Image.propTypes = {
        /** The full size image url */
        image_url: prop_types_1.default.string,
        /** The thumb url */
        thumb_url: prop_types_1.default.string,
        /** The text fallback for the image */
        fallback: prop_types_1.default.string,
    };
    return Image;
}(react_1.default.PureComponent));
exports.Image = Image;
