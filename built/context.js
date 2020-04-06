"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var dayjs_1 = __importDefault(require("dayjs"));
exports.ChatContext = react_1.default.createContext({ client: null });
function withChatContext(OriginalComponent) {
    var ContextAwareComponent = function ContextComponent(props) {
        return (react_1.default.createElement(exports.ChatContext.Consumer, null, function (context) {
            var mergedProps = __assign(__assign({}, context), props);
            return react_1.default.createElement(OriginalComponent, __assign({}, mergedProps));
        }));
    };
    ContextAwareComponent.displayName =
        OriginalComponent.displayName || OriginalComponent.name || 'Component';
    ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace('Base', '');
    return ContextAwareComponent;
}
exports.withChatContext = withChatContext;
exports.ChannelContext = react_1.default.createContext({});
function withChannelContext(OriginalComponent) {
    var ContextAwareComponent = function ContextComponent(props) {
        return (react_1.default.createElement(exports.ChannelContext.Consumer, null, function (channelContext) { return (react_1.default.createElement(OriginalComponent, __assign({}, channelContext, props))); }));
    };
    ContextAwareComponent.displayName =
        OriginalComponent.displayName || OriginalComponent.name || 'Component';
    ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace('Base', '');
    return ContextAwareComponent;
}
exports.withChannelContext = withChannelContext;
exports.TranslationContext = react_1.default.createContext({
    t: function (msg) { return msg; },
    tDateTimeParser: function (input) { return dayjs_1.default(input); },
});
function withTranslationContext(OriginalComponent) {
    var ContextAwareComponent = function ContextComponent(props) {
        return (react_1.default.createElement(exports.TranslationContext.Consumer, null, function (translationContext) { return (react_1.default.createElement(OriginalComponent, __assign({}, translationContext, props))); }));
    };
    ContextAwareComponent.displayName =
        OriginalComponent.displayName || OriginalComponent.name || 'Component';
    ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace('Base', '');
    return ContextAwareComponent;
}
exports.withTranslationContext = withTranslationContext;
