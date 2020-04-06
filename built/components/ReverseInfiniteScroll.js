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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
/* eslint-disable */
var react_1 = __importStar(require("react"));
var prop_types_1 = __importDefault(require("prop-types"));
var ReverseInfiniteScroll = /** @class */ (function (_super) {
    __extends(ReverseInfiniteScroll, _super);
    function ReverseInfiniteScroll(props) {
        var _this = _super.call(this, props) || this;
        _this.scrollListener = _this.scrollListener.bind(_this);
        _this.scrollEventCount = 0;
        return _this;
    }
    ReverseInfiniteScroll.prototype.componentDidMount = function () {
        this.attachScrollListener();
    };
    ReverseInfiniteScroll.prototype.componentWillUnmount = function () {
        this.detachScrollListener();
        this.detachMousewheelListener();
    };
    // Set a defaut loader for all your `InfiniteScroll` components
    ReverseInfiniteScroll.prototype.setDefaultLoader = function (loader) {
        this.defaultLoader = loader;
    };
    ReverseInfiniteScroll.prototype.detachMousewheelListener = function () {
        var scrollEl = window;
        if (this.props.useWindow === false) {
            scrollEl = this.scrollComponent.parentNode;
        }
        scrollEl.removeEventListener('mousewheel', this.mousewheelListener, this.props.useCapture);
    };
    ReverseInfiniteScroll.prototype.detachScrollListener = function () {
        var scrollEl = window;
        if (this.props.useWindow === false) {
            scrollEl = this.getParentElement(this.scrollComponent);
        }
        scrollEl.removeEventListener('scroll', this.scrollListener, this.props.useCapture);
        scrollEl.removeEventListener('resize', this.scrollListener, this.props.useCapture);
    };
    ReverseInfiniteScroll.prototype.getParentElement = function (el) {
        return el && el.parentNode;
    };
    ReverseInfiniteScroll.prototype.filterProps = function (props) {
        return props;
    };
    ReverseInfiniteScroll.prototype.attachScrollListener = function () {
        if (!this.props.hasMore ||
            this.props.isLoading ||
            !this.getParentElement(this.scrollComponent)) {
            return;
        }
        var scrollEl = window;
        if (this.props.useWindow === false) {
            scrollEl = this.getParentElement(this.scrollComponent);
        }
        scrollEl.addEventListener('mousewheel', this.mousewheelListener, this.props.useCapture);
        scrollEl.addEventListener('scroll', this.scrollListener, this.props.useCapture);
        scrollEl.addEventListener('resize', this.scrollListener, this.props.useCapture);
        if (this.props.initialLoad) {
            this.scrollListener();
        }
    };
    ReverseInfiniteScroll.prototype.mousewheelListener = function (e) {
        // Prevents Chrome hangups
        // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
        if (e.deltaY === 1) {
            e.preventDefault();
        }
    };
    ReverseInfiniteScroll.prototype.scrollListener = function () {
        var el = this.scrollComponent;
        var scrollEl = window;
        var parentNode = this.getParentElement(el);
        this.scrollEventCount += 1;
        var offset;
        var reverseOffset = parentNode.scrollTop;
        var standardOffset = el.scrollHeight - parentNode.scrollTop - parentNode.clientHeight;
        if (this.props.isReverse) {
            offset = reverseOffset;
        }
        else {
            offset = standardOffset;
        }
        if (this.props.listenToScroll) {
            this.props.listenToScroll(standardOffset, reverseOffset);
        }
        // a reverse infinite scroll element always starts out at position 0
        // this counter prevent you from loading content before the user even scrolled
        if (this.scrollEventCount < 2) {
            return;
        }
        // prevent crazy repeat requests in case you don't have more
        if (!this.props.hasMore || this.props.isLoading) {
            return;
        }
        // Here we make sure the element is visible as well as checking the offset
        if (offset < Number(this.props.threshold) &&
            el &&
            el.offsetParent !== null) {
            //this.detachScrollListener();
            // Call loadMore after detachScrollListener to allow for non-async loadMore functions
            if (typeof this.props.loadMore === 'function') {
                this.props.loadMore();
            }
        }
    };
    ReverseInfiniteScroll.prototype.calculateOffset = function (el, scrollTop) {
        if (!el) {
            return 0;
        }
        return (this.calculateTopPosition(el) +
            (el.offsetHeight - scrollTop - window.innerHeight));
    };
    ReverseInfiniteScroll.prototype.calculateTopPosition = function (el) {
        if (!el) {
            return 0;
        }
        return el.offsetTop + this.calculateTopPosition(el.offsetParent);
    };
    ReverseInfiniteScroll.prototype.render = function () {
        var _this = this;
        var renderProps = this.filterProps(this.props);
        var children = renderProps.children, element = renderProps.element, hasMore = renderProps.hasMore, initialLoad = renderProps.initialLoad, isReverse = renderProps.isReverse, loader = renderProps.loader, loadMore = renderProps.loadMore, pageStart = renderProps.pageStart, ref = renderProps.ref, threshold = renderProps.threshold, useCapture = renderProps.useCapture, useWindow = renderProps.useWindow, listenToScroll = renderProps.listenToScroll, isLoading = renderProps.isLoading, props = __rest(renderProps, ["children", "element", "hasMore", "initialLoad", "isReverse", "loader", "loadMore", "pageStart", "ref", "threshold", "useCapture", "useWindow", "listenToScroll", "isLoading"]);
        props.ref = function (node) {
            _this.scrollComponent = node;
        };
        var childrenArray = [children];
        if (isLoading) {
            if (loader) {
                isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader);
            }
            else if (this.defaultLoader) {
                isReverse
                    ? childrenArray.unshift(this.defaultLoader)
                    : childrenArray.push(this.defaultLoader);
            }
        }
        return react_1.default.createElement(element, props, childrenArray);
    };
    ReverseInfiniteScroll.propTypes = {
        children: prop_types_1.default.node.isRequired,
        element: prop_types_1.default.node,
        /** Weather there are more elements to be loaded or not */
        hasMore: prop_types_1.default.bool,
        initialLoad: prop_types_1.default.bool,
        isReverse: prop_types_1.default.bool,
        loader: prop_types_1.default.node,
        loadMore: prop_types_1.default.func.isRequired,
        pageStart: prop_types_1.default.number,
        threshold: prop_types_1.default.number,
        useCapture: prop_types_1.default.bool,
        useWindow: prop_types_1.default.bool,
        className: prop_types_1.default.string,
        /** The function is called when the list scrolls */
        listenToScroll: prop_types_1.default.func,
    };
    ReverseInfiniteScroll.defaultProps = {
        element: 'div',
        hasMore: false,
        initialLoad: true,
        pageStart: 0,
        ref: null,
        threshold: 250,
        useWindow: true,
        isReverse: true,
        useCapture: false,
        loader: null,
        className: 'str-chat__reverse-infinite-scroll',
    };
    return ReverseInfiniteScroll;
}(react_1.Component));
exports.ReverseInfiniteScroll = ReverseInfiniteScroll;
