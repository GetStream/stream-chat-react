"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
/**
 * LoadingChannels - Fancy loading indicator for the channel list
 *
 * @example ./docs/LoadingChannels.md
 */
exports.LoadingChannels = function () { return (react_1.default.createElement("div", { className: "str-chat__loading-channels" },
    react_1.default.createElement("div", { className: "str-chat__loading-channels-item" },
        react_1.default.createElement("div", { className: "str-chat__loading-channels-avatar" }),
        react_1.default.createElement("div", { className: "str-chat__loading-channels-meta" },
            react_1.default.createElement("div", { className: "str-chat__loading-channels-username" }),
            react_1.default.createElement("div", { className: "str-chat__loading-channels-status" }))),
    react_1.default.createElement("div", { className: "str-chat__loading-channels-item" },
        react_1.default.createElement("div", { className: "str-chat__loading-channels-avatar" }),
        react_1.default.createElement("div", { className: "str-chat__loading-channels-meta" },
            react_1.default.createElement("div", { className: "str-chat__loading-channels-username" }),
            react_1.default.createElement("div", { className: "str-chat__loading-channels-status" }))),
    react_1.default.createElement("div", { className: "str-chat__loading-channels-item" },
        react_1.default.createElement("div", { className: "str-chat__loading-channels-avatar" }),
        react_1.default.createElement("div", { className: "str-chat__loading-channels-meta" },
            react_1.default.createElement("div", { className: "str-chat__loading-channels-username" }),
            react_1.default.createElement("div", { className: "str-chat__loading-channels-status" }))))); };
