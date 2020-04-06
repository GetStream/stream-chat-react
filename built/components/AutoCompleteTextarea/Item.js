"use strict";
//
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
var Item = /** @class */ (function (_super) {
    __extends(Item, _super);
    function Item() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.selectItem = function () {
            var _a = _this.props, item = _a.item, onSelectHandler = _a.onSelectHandler;
            onSelectHandler(item);
        };
        return _this;
    }
    Item.prototype.render = function () {
        var _a = this.props, Component = _a.component, style = _a.style, onClickHandler = _a.onClickHandler, item = _a.item, selected = _a.selected, className = _a.className, innerRef = _a.innerRef;
        return (react_1.default.createElement("li", { className: "rta__item " + (className || ''), style: style },
            react_1.default.createElement("div", { className: "rta__entity " + (selected === true ? 'rta__entity--selected' : ''), role: "button", tabIndex: 0, onClick: onClickHandler, onFocus: this.selectItem, onMouseEnter: this.selectItem, 
                /* $FlowFixMe */
                ref: innerRef },
                react_1.default.createElement(Component, { selected: selected, entity: item }))));
    };
    return Item;
}(react_1.default.Component));
exports.Item = Item;
exports.default = Item;
