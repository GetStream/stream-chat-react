"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var prop_types_1 = __importDefault(require("prop-types"));
exports.EmptyStateIndicator = function (listType, t) {
    var Indicator;
    switch (listType) {
        case 'channel':
            Indicator = react_1.default.createElement("p", null, t('You have no channels currently'));
            break;
        case 'message':
            Indicator = null;
            break;
        default:
            Indicator = react_1.default.createElement("p", null, "No items exist");
            break;
    }
    return Indicator;
};
exports.EmptyStateIndicator.propTypes = {
    /** channel | message */
    listType: prop_types_1.default.string,
};
