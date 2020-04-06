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
var Avatar_1 = require("./Avatar");
var prop_types_1 = __importDefault(require("prop-types"));
var UserItem = /** @class */ (function (_super) {
    __extends(UserItem, _super);
    function UserItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UserItem.prototype.render = function () {
        var u = this.props.entity;
        return (react_1.default.createElement("div", { className: "str-chat__user-item" },
            react_1.default.createElement(Avatar_1.Avatar, { size: 20, image: u.image }),
            react_1.default.createElement("div", null,
                react_1.default.createElement("strong", null, u.name),
                " ",
                !u.name ? u.id : '')));
    };
    UserItem.propTypes = {
        entity: prop_types_1.default.shape({
            /** Name of the user */
            name: prop_types_1.default.string,
            /** Id of the user */
            id: prop_types_1.default.string,
            /** Image of the user */
            image: prop_types_1.default.string,
        }),
    };
    return UserItem;
}(react_1.PureComponent));
exports.UserItem = UserItem;
