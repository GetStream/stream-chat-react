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
 * Gallery - displays up to 6 images in a simple responsive grid with a lightbox to view the images.
 * @example ./docs/Gallery.md
 * @extends PureComponent
 */
var Gallery = /** @class */ (function (_super) {
    __extends(Gallery, _super);
    function Gallery() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            modalIsOpen: false,
            currentIndex: 0,
        };
        _this.toggleModal = function (index) {
            _this.setState(function (state) { return ({
                modalIsOpen: !state.modalIsOpen,
                currentIndex: index,
            }); });
        };
        return _this;
    }
    Gallery.prototype.render = function () {
        var _this = this;
        var images = this.props.images;
        var formattedArray = images.map(function (image) { return ({
            src: image.image_url || image.thumb_url,
        }); });
        return (react_1.default.createElement("div", { className: "str-chat__gallery" },
            images.slice(0, 3).map(function (image, i) { return (react_1.default.createElement("div", { className: "str-chat__gallery-image", key: "gallery-image-" + i, onClick: function () { return _this.toggleModal(i); } },
                react_1.default.createElement("img", { src: image.image_url || image.thumb_url }))); }),
            images.length > 3 && (react_1.default.createElement("div", { className: "str-chat__gallery-placeholder", style: {
                    backgroundImage: "url(" + images[3].image_url + ")",
                }, onClick: function () { return _this.toggleModal(3); } },
                react_1.default.createElement("p", null,
                    images.length - 3,
                    " more"))),
            react_1.default.createElement(react_images_1.ModalGateway, null, this.state.modalIsOpen ? (react_1.default.createElement(react_images_1.Modal, { onClose: this.toggleModal, closeOnBackdropClick: true },
                react_1.default.createElement(react_images_1.default, { views: formattedArray, currentIndex: this.state.currentIndex }))) : null)));
    };
    Gallery.propTypes = {
        images: prop_types_1.default.arrayOf(prop_types_1.default.shape({
            /** Url of the image */
            image_url: prop_types_1.default.string,
            /** Url of thumbnail of image */
            thumb_url: prop_types_1.default.string,
        })),
    };
    return Gallery;
}(react_1.default.PureComponent));
exports.Gallery = Gallery;
