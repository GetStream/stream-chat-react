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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var prop_types_1 = __importDefault(require("prop-types"));
var emoji_mart_1 = require("emoji-mart");
var Avatar_1 = require("./Avatar");
var utils_1 = require("../utils");
/**
 * ReactionSelector - A component for selecting a reaction. Examples are love, wow, like etc.
 *
 * @example ./docs/ReactionSelector.md
 * @extends PureComponent
 */
var ReactionSelector = /** @class */ (function (_super) {
    __extends(ReactionSelector, _super);
    function ReactionSelector(props) {
        var _this = _super.call(this, props) || this;
        _this.showTooltip = function (e, users) { return __awaiter(_this, void 0, void 0, function () {
            var target;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        target = e.target.getBoundingClientRect();
                        return [4 /*yield*/, this.setState(function () { return ({
                                showTooltip: true,
                                users: users,
                            }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.setTooltipPosition(target)];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, this.setArrowPosition(target)];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.hideTooltip = function () {
            _this.setState(function () { return ({
                showTooltip: false,
                users: [],
                arrowPosition: 0,
                position: 0,
                positionCaculated: false,
            }); });
        };
        _this.getUsersPerReaction = function (reactions, type) {
            return reactions && reactions.filter(function (item) { return item.type === type; });
        };
        _this.getLatestUser = function (reactions, type) {
            var filtered = _this.getUsersPerReaction(reactions, type);
            if (filtered && filtered[0] && filtered[0].user) {
                return filtered[0].user;
            }
            else {
                return 'NotFound';
            }
        };
        _this.getUserNames = function (reactions, type) {
            var filtered = _this.getUsersPerReaction(reactions, type);
            return filtered && filtered.map(function (item) { return item.user || 'NotFound'; });
        };
        _this.getContainerDimensions = function () {
            return _this.reactionSelector.current.getBoundingClientRect();
        };
        _this.getToolTipDimensions = function () {
            return _this.reactionSelectorTooltip.current.getBoundingClientRect();
        };
        _this.setTooltipPosition = function (target) { return __awaiter(_this, void 0, void 0, function () {
            var container, tooltip, position;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getContainerDimensions()];
                    case 1:
                        container = _a.sent();
                        return [4 /*yield*/, this.getToolTipDimensions()];
                    case 2:
                        tooltip = _a.sent();
                        if (tooltip.width === container.width || tooltip.x < container.x) {
                            position = 0;
                        }
                        else {
                            position =
                                target.left + target.width / 2 - container.left - tooltip.width / 2;
                        }
                        return [4 /*yield*/, this.setState(function () { return ({
                                position: position,
                            }); })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.setArrowPosition = function (target) { return __awaiter(_this, void 0, void 0, function () {
            var tooltip, position;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tooltip = this.reactionSelectorTooltip.current.getBoundingClientRect();
                        position = target.x - tooltip.x + target.width / 2;
                        return [4 /*yield*/, this.setState(function () { return ({
                                arrowPosition: position,
                                positionCaculated: true,
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.renderReactionItems = function () {
            var _a = _this.props, reaction_counts = _a.reaction_counts, latest_reactions = _a.latest_reactions;
            return _this.props.reactionOptions.map(function (reaction) {
                var users = _this.getUserNames(latest_reactions, reaction.id);
                var latestUser = _this.getLatestUser(latest_reactions, reaction.id);
                var count = reaction_counts && reaction_counts[reaction.id];
                return (react_1.default.createElement("li", { key: "item-" + reaction.id, className: "str-chat__message-reactions-list-item", "data-text": reaction.id, onClick: _this.props.handleReaction.bind(_this, reaction.id) },
                    Boolean(count) && _this.props.detailedView && (react_1.default.createElement(react_1.default.Fragment, null,
                        react_1.default.createElement("div", { className: "latest-user", onMouseEnter: function (e) { return _this.showTooltip(e, users); }, onMouseLeave: _this.hideTooltip }, latestUser !== 'NotFound' ? (react_1.default.createElement(Avatar_1.Avatar, { image: latestUser.image, alt: latestUser.id, size: 20, name: latestUser.id })) : (react_1.default.createElement("div", { className: "latest-user-not-found" }))))),
                    react_1.default.createElement(emoji_mart_1.NimbleEmoji, __assign({ emoji: reaction }, utils_1.emojiSetDef, { data: utils_1.emojiData })),
                    Boolean(count) && _this.props.detailedView && (react_1.default.createElement("span", { className: "str-chat__message-reactions-list-item__count" }, count || ''))));
            });
        };
        _this.renderUsers = function (users) {
            return users.map(function (user, i) {
                var text = user.name || user.id;
                if (i + 1 < users.length) {
                    text += ', ';
                }
                return (react_1.default.createElement("span", { className: "latest-user-username", key: "key-" + i + "-" + user }, text));
            });
        };
        _this.state = {
            showTooltip: false,
            users: [],
            position: 0,
            arrowPosition: 0,
            positionCalculated: false,
        };
        _this.reactionSelector = react_1.default.createRef();
        _this.reactionSelectorInner = react_1.default.createRef();
        _this.reactionSelectorTooltip = react_1.default.createRef();
        return _this;
    }
    ReactionSelector.prototype.render = function () {
        return (react_1.default.createElement("div", { className: "str-chat__reaction-selector " + (this.props.reverse ? 'str-chat__reaction-selector--reverse' : ''), ref: this.reactionSelector },
            this.props.detailedView && (react_1.default.createElement("div", { className: "str-chat__reaction-selector-tooltip", ref: this.reactionSelectorTooltip, style: {
                    visibility: this.state.showTooltip ? 'visible' : 'hidden',
                    left: this.state.position,
                    opacity: this.state.showTooltip && this.state.positionCaculated
                        ? 1
                        : 0.01,
                } },
                react_1.default.createElement("div", { className: "arrow", style: { left: this.state.arrowPosition } }),
                this.renderUsers(this.state.users))),
            react_1.default.createElement("ul", { className: "str-chat__message-reactions-list" }, this.renderReactionItems())));
    };
    ReactionSelector.propTypes = {
        /**
         * Array of latest reactions.
         * Reaction object has following structure:
         *
         * ```json
         * {
         *  "type": "love",
         *  "user_id": "demo_user_id",
         *  "user": {
         *    ...userObject
         *  },
         *  "created_at": "datetime";
         * }
         * ```
         * */
        latest_reactions: prop_types_1.default.array,
        /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
        reaction_counts: prop_types_1.default.object,
        /**
         * Handler to set/unset reaction on message.
         *
         * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
         * */
        handleReaction: prop_types_1.default.func.isRequired,
        /** Enable the avatar display */
        detailedView: prop_types_1.default.bool,
        /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
        reactionOptions: prop_types_1.default.array,
        /** If true, reaction list will be shown at trailing end of message bubble. */
        reverse: prop_types_1.default.bool,
    };
    ReactionSelector.defaultProps = {
        detailedView: true,
        reactionOptions: utils_1.defaultMinimalEmojis,
        reverse: false,
        emojiSetDef: utils_1.emojiSetDef,
    };
    return ReactionSelector;
}(react_1.PureComponent));
exports.ReactionSelector = ReactionSelector;
