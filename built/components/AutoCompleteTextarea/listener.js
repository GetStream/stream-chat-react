"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_CODES = {
    ESC: 27,
    UP: 38,
    DOWN: 40,
    ENTER: 13,
    TAB: 9,
    SPACE: 32,
};
// This is self-made key shortcuts manager, used for caching key strokes
var Listener = /** @class */ (function () {
    function Listener() {
        var _this = this;
        this.startListen = function () {
            if (!_this.refCount) {
                // prevent multiple listeners in case of multiple TextareaAutocomplete components on page
                document.addEventListener('keydown', _this.f);
            }
            _this.refCount++;
        };
        this.stopListen = function () {
            _this.refCount--;
            if (!_this.refCount) {
                // prevent disable listening in case of multiple TextareaAutocomplete components on page
                document.removeEventListener('keydown', _this.f);
            }
        };
        this.add = function (keyCodes, fn) {
            var keyCode = keyCodes;
            if (typeof keyCode !== 'object')
                keyCode = [keyCode];
            _this.listeners[_this.index] = {
                keyCode: keyCode,
                fn: fn,
            };
            _this.index += 1;
            return _this.index;
        };
        this.remove = function (id) {
            delete _this.listeners[id];
        };
        this.removeAll = function () {
            _this.listeners = {};
            _this.index = 0;
        };
        this.index = 0;
        this.listeners = {};
        this.refCount = 0;
        this.f = function (e) {
            var code = e.keyCode || e.which;
            Object.values(_this.listeners).forEach(function (_a) {
                var keyCode = _a.keyCode, fn = _a.fn;
                if (keyCode.includes(code))
                    fn(e);
            });
        };
    }
    return Listener;
}());
exports.default = new Listener();
