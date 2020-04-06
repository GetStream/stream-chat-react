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
var anchorme_1 = __importDefault(require("anchorme"));
var emoji_regex_1 = __importDefault(require("emoji-regex"));
var with_html_1 = __importDefault(require("react-markdown/with-html"));
var truncate_1 = __importDefault(require("lodash/truncate"));
var all_json_1 = __importDefault(require("emoji-mart/data/all.json"));
var react_1 = __importDefault(require("react"));
exports.emojiSetDef = {
    spriteUrl: 'https://getstream.imgix.net/images/emoji-sprite.png',
    size: 20,
    sheetColumns: 2,
    sheetRows: 3,
    sheetSize: 64,
};
exports.commonEmoji = {
    emoticons: [],
    short_names: [],
    custom: true,
};
exports.defaultMinimalEmojis = [
    __assign(__assign({ id: 'like', name: 'like', colons: ':+1:', sheet_x: 0, sheet_y: 0 }, exports.commonEmoji), exports.emojiSetDef),
    __assign(__assign({ id: 'love', name: 'love', colons: ':heart:', sheet_x: 1, sheet_y: 2 }, exports.commonEmoji), exports.emojiSetDef),
    __assign(__assign({ id: 'haha', name: 'haha', colons: ':joy:', sheet_x: 1, sheet_y: 0 }, exports.commonEmoji), exports.emojiSetDef),
    __assign(__assign({ id: 'wow', name: 'wow', colons: ':astonished:', sheet_x: 0, sheet_y: 2 }, exports.commonEmoji), exports.emojiSetDef),
    __assign(__assign({ id: 'sad', name: 'sad', colons: ':pensive:', sheet_x: 0, sheet_y: 1 }, exports.commonEmoji), exports.emojiSetDef),
    __assign(__assign({ id: 'angry', name: 'angry', colons: ':angry:', sheet_x: 1, sheet_y: 1 }, exports.commonEmoji), exports.emojiSetDef),
];
var d = Object.assign({}, all_json_1.default);
d.emojis = {};
// use this only for small lists like in ReactionSelector
exports.emojiData = d;
exports.isOnlyEmojis = function (text) {
    if (!text)
        return false;
    var noEmojis = text.replace(emoji_regex_1.default(), '');
    var noSpace = noEmojis.replace(/[\s\n]/gm, '');
    return !noSpace;
};
exports.isPromise = function (thing) { return thing && typeof thing.then === 'function'; };
exports.byDate = function (a, b) { return a.created_at - b.created_at; };
// https://stackoverflow.com/a/29234240/7625485
/**
 * @deprecated This function is deprecated and will be removed in future major release.
 * @param {*} dict
 * @param {*} currentUserId
 */
exports.formatArray = function (dict, currentUserId) {
    var arr2 = Object.keys(dict);
    var arr3 = [];
    arr2.forEach(function (item, i) {
        if (currentUserId === dict[arr2[i]].user.id) {
            return;
        }
        arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id);
    });
    var outStr = '';
    if (arr3.length === 1) {
        outStr = arr3[0] + ' is typing...';
        dict;
    }
    else if (arr3.length === 2) {
        //joins all with "and" but =no commas
        //example: "bob and sam"
        outStr = arr3.join(' and ') + ' are typing...';
    }
    else if (arr3.length > 2) {
        //joins all with commas, but last one gets ", and" (oxford comma!)
        //example: "bob, joe, and sam"
        outStr =
            arr3.slice(0, -1).join(', ') +
                ', and ' +
                arr3.slice(-1) +
                ' are typing...';
    }
    return outStr;
};
exports.renderText = function (message) {
    // take the @ mentions and turn them into markdown?
    // translate links
    var text = message.text;
    var mentioned_users = message.mentioned_users;
    if (!text) {
        return;
    }
    var allowed = [
        'html',
        'root',
        'text',
        'break',
        'paragraph',
        'emphasis',
        'strong',
        'link',
        'list',
        'listItem',
        'code',
        'inlineCode',
        'blockquote',
        'delete',
    ];
    var urls = anchorme_1.default(text, {
        list: true,
    });
    for (var _i = 0, urls_1 = urls; _i < urls_1.length; _i++) {
        var urlInfo = urls_1[_i];
        var displayLink = truncate_1.default(urlInfo.encoded.replace(/^(www\.)/, ''), {
            length: 20,
            omission: '...',
        });
        var mkdown = "[" + displayLink + "](" + urlInfo.protocol + urlInfo.encoded + ")";
        text = text.replace(urlInfo.raw, mkdown);
    }
    var newText = text;
    if (mentioned_users && mentioned_users.length) {
        for (var i = 0; i < mentioned_users.length; i++) {
            var username = mentioned_users[i].name || mentioned_users[i].id;
            var mkdown = "**@" + username + "**";
            var re = new RegExp("@" + username, 'g');
            newText = newText.replace(re, mkdown);
        }
    }
    return (react_1.default.createElement(with_html_1.default, { allowedTypes: allowed, source: newText, linkTarget: "_blank", plugins: [], escapeHtml: true, skipHtml: false, unwrapDisallowed: true }));
};
// https://stackoverflow.com/a/6860916/2570866
function generateRandomId() {
    // prettier-ignore
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
exports.generateRandomId = generateRandomId;
function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
exports.smartRender = function (ElementOrComponentOrLiteral, props, fallback) {
    if (ElementOrComponentOrLiteral === undefined) {
        ElementOrComponentOrLiteral = fallback;
    }
    if (react_1.default.isValidElement(ElementOrComponentOrLiteral)) {
        // Flow cast through any, to make flow believe it's a React.Element
        var element = ElementOrComponentOrLiteral; // eslint-disable-line
        return element;
    }
    // Flow cast through any to remove React.Element after previous check
    var ComponentOrLiteral = ElementOrComponentOrLiteral;
    if (typeof ComponentOrLiteral === 'string' ||
        typeof ComponentOrLiteral === 'number' ||
        typeof ComponentOrLiteral === 'boolean' ||
        ComponentOrLiteral == null) {
        return ComponentOrLiteral;
    }
    return react_1.default.createElement(ComponentOrLiteral, __assign({}, props));
};
exports.MESSAGE_ACTIONS = {
    edit: 'edit',
    delete: 'delete',
    flag: 'flag',
    mute: 'mute',
};
exports.filterEmoji = function (emoji) {
    if (emoji.name === 'White Smiling Face' ||
        emoji.name === 'White Frowning Face') {
        return false;
    }
    return true;
};
