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
var InfiniteScroll = /** @class */ (function (_super) {
    __extends(InfiniteScroll, _super);
    function InfiniteScroll(props) {
        var _this = _super.call(this, props) || this;
        _this.scrollListener = _this.scrollListener.bind(_this);
        return _this;
    }
    InfiniteScroll.prototype.componentDidMount = function () {
        this.attachScrollListener();
    };
    InfiniteScroll.prototype.componentDidUpdate = function () {
        this.attachScrollListener();
    };
    InfiniteScroll.prototype.componentWillUnmount = function () {
        this.detachScrollListener();
        this.detachMousewheelListener();
    };
    // Set a defaut loader for all your `InfiniteScroll` components
    InfiniteScroll.prototype.setDefaultLoader = function (loader) {
        this.defaultLoader = loader;
    };
    InfiniteScroll.prototype.detachMousewheelListener = function () {
        var scrollEl = window;
        if (this.props.useWindow === false) {
            scrollEl = this.scrollComponent.parentNode;
        }
        scrollEl.removeEventListener('mousewheel', this.mousewheelListener, this.props.useCapture);
    };
    InfiniteScroll.prototype.detachScrollListener = function () {
        var scrollEl = window;
        if (this.props.useWindow === false) {
            scrollEl = this.getParentElement(this.scrollComponent);
        }
        scrollEl.removeEventListener('scroll', this.scrollListener, this.props.useCapture);
        scrollEl.removeEventListener('resize', this.scrollListener, this.props.useCapture);
    };
    InfiniteScroll.prototype.getParentElement = function (el) {
        return el && el.parentNode;
    };
    InfiniteScroll.prototype.filterProps = function (props) {
        return props;
    };
    InfiniteScroll.prototype.attachScrollListener = function () {
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
    InfiniteScroll.prototype.mousewheelListener = function (e) {
        // Prevents Chrome hangups
        // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
        if (e.deltaY === 1) {
            e.preventDefault();
        }
    };
    InfiniteScroll.prototype.scrollListener = function () {
        var el = this.scrollComponent;
        var scrollEl = window;
        var parentNode = this.getParentElement(el);
        var offset;
        if (this.props.useWindow) {
            var doc = document.documentElement || document.body.parentNode || document.body;
            var scrollTop = scrollEl.pageYOffset !== undefined
                ? scrollEl.pageYOffset
                : doc.scrollTop;
            if (this.props.isReverse) {
                offset = scrollTop;
            }
            else {
                offset = this.calculateOffset(el, scrollTop);
            }
        }
        else if (this.props.isReverse) {
            offset = parentNode.scrollTop;
        }
        else {
            offset = el.scrollHeight - parentNode.scrollTop - parentNode.clientHeight;
        }
        // Here we make sure the element is visible as well as checking the offset
        if (offset < Number(this.props.threshold) &&
            el &&
            el.offsetParent !== null) {
            this.detachScrollListener();
            // Call loadMore after detachScrollListener to allow for non-async loadMore functions
            if (typeof this.props.loadMore === 'function') {
                this.props.loadMore();
            }
        }
    };
    InfiniteScroll.prototype.calculateOffset = function (el, scrollTop) {
        if (!el) {
            return 0;
        }
        return (this.calculateTopPosition(el) +
            (el.offsetHeight - scrollTop - window.innerHeight));
    };
    InfiniteScroll.prototype.calculateTopPosition = function (el) {
        if (!el) {
            return 0;
        }
        return el.offsetTop + this.calculateTopPosition(el.offsetParent);
    };
    InfiniteScroll.prototype.render = function () {
        var _this = this;
        var renderProps = this.filterProps(this.props);
        var children = renderProps.children, element = renderProps.element, hasMore = renderProps.hasMore, initialLoad = renderProps.initialLoad, isReverse = renderProps.isReverse, loader = renderProps.loader, loadMore = renderProps.loadMore, pageStart = renderProps.pageStart, threshold = renderProps.threshold, useCapture = renderProps.useCapture, useWindow = renderProps.useWindow, isLoading = renderProps.isLoading, props = __rest(renderProps, ["children", "element", "hasMore", "initialLoad", "isReverse", "loader", "loadMore", "pageStart", "threshold", "useCapture", "useWindow", "isLoading"]);
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
    InfiniteScroll.propTypes = {
        element: prop_types_1.default.node,
        hasMore: prop_types_1.default.bool,
        initialLoad: prop_types_1.default.bool,
        isReverse: prop_types_1.default.bool,
        loader: prop_types_1.default.node,
        loadMore: prop_types_1.default.func.isRequired,
        pageStart: prop_types_1.default.number,
        isLoading: prop_types_1.default.bool,
        threshold: prop_types_1.default.number,
        useCapture: prop_types_1.default.bool,
        useWindow: prop_types_1.default.bool,
    };
    InfiniteScroll.defaultProps = {
        element: 'div',
        hasMore: false,
        initialLoad: true,
        isLoading: false,
        pageStart: 0,
        ref: null,
        threshold: 250,
        useWindow: true,
        isReverse: false,
        useCapture: false,
        loader: null,
    };
    return InfiniteScroll;
}(react_1.Component));
exports.InfiniteScroll = InfiniteScroll;
exports.default = InfiniteScroll;
