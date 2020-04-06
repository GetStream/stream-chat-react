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
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var Audio = /** @class */ (function (_super) {
    __extends(Audio, _super);
    function Audio(props) {
        var _this = _super.call(this, props) || this;
        _this.playAudio = function () {
            if (_this.audioRef.current !== null) {
                _this.audioRef.current.pause();
                _this.updateProgress();
                _this.setState({
                    playing: true,
                    updateProgress: setInterval(_this.updateProgress, 500),
                });
                //$FlowFixMe
                _this.audioRef.current.play();
            }
        };
        _this.pauseAudio = function () {
            if (_this.audioRef.current !== null) {
                _this.audioRef.current.pause();
            }
            _this.setState({ playing: false });
            window.clearInterval(_this.state.updateProgress);
        };
        _this.updateProgress = function () {
            if (_this.audioRef.current !== null) {
                var position = _this.audioRef.current.currentTime;
                var duration = _this.audioRef.current.duration;
                var progress = (100 / duration) * position;
                _this.setState({
                    progress: progress,
                });
                if (position === duration) {
                    _this.pauseAudio();
                }
            }
        };
        _this._handleClose = function (e) {
            if (_this.props.handleClose) {
                _this.props.handleClose(e);
            }
        };
        _this.state = {
            open: false,
            playing: false,
            progress: 0,
            updateProgress: null,
        };
        _this.audioRef = React.createRef();
        return _this;
    }
    Audio.prototype.componentWillUnmount = function () {
        window.clearInterval(this.state.updateProgress);
    };
    Audio.prototype.render = function () {
        var _this = this;
        var og = this.props.og;
        var audio = og;
        var url = og.asset_url;
        var image = og.image_url;
        return (React.createElement("div", { className: "str-chat__audio" },
            React.createElement("div", { className: "str-chat__audio__wrapper" },
                React.createElement("audio", { ref: this.audioRef },
                    React.createElement("source", { src: url, type: "audio/mp3" })),
                React.createElement("div", { className: "str-chat__audio__image" },
                    React.createElement("div", { className: "str-chat__audio__image--overlay" }, !this.state.playing ? (React.createElement("div", { onClick: function () { return _this.playAudio(); }, className: "str-chat__audio__image--button" },
                        React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 64 64", xmlns: "http://www.w3.org/2000/svg" },
                            React.createElement("path", { d: "M32 58c14.36 0 26-11.64 26-26S46.36 6 32 6 6 17.64 6 32s11.64 26 26 26zm0 6C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm13.237-28.412L26.135 45.625a3.27 3.27 0 0 1-4.426-1.4 3.319 3.319 0 0 1-.372-1.47L21 23.36c-.032-1.823 1.41-3.327 3.222-3.358a3.263 3.263 0 0 1 1.473.322l19.438 9.36a3.311 3.311 0 0 1 .103 5.905z", fillRule: "nonzero" })))) : (React.createElement("div", { onClick: function () { return _this.pauseAudio(); }, className: "str-chat__audio__image--button" },
                        React.createElement("svg", { width: "40", height: "40", viewBox: "0 0 64 64", xmlns: "http://www.w3.org/2000/svg" },
                            React.createElement("path", { d: "M32 58.215c14.478 0 26.215-11.737 26.215-26.215S46.478 5.785 32 5.785 5.785 17.522 5.785 32 17.522 58.215 32 58.215zM32 64C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm-7.412-45.56h2.892a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.892a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17zm12.293 0h2.893a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.893a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17z", fillRule: "nonzero" }))))),
                    React.createElement("img", { src: image, alt: "" + og.description })),
                React.createElement("div", { className: "str-chat__audio__content" },
                    React.createElement("span", { className: "str-chat__audio__content--title" },
                        React.createElement("strong", null, og.title)),
                    React.createElement("span", { className: "str-chat__audio__content--subtitle" }, og.text),
                    React.createElement("div", { className: "str-chat__audio__content--progress" },
                        React.createElement("div", { style: { width: this.state.progress + "%" } }))))));
    };
    return Audio;
}(React.Component));
exports.Audio = Audio;
