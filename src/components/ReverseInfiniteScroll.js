/* eslint-disable */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class ReverseInfiniteScroll extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    element: PropTypes.node,
    /** Weather there are more elements to be loaded or not */
    hasMore: PropTypes.bool,
    initialLoad: PropTypes.bool,
    isReverse: PropTypes.bool,
    loader: PropTypes.node,
    loadMore: PropTypes.func.isRequired,
    pageStart: PropTypes.number,
    ref: PropTypes.func,
    threshold: PropTypes.number,
    useCapture: PropTypes.bool,
    useWindow: PropTypes.bool,
    className: PropTypes.string,
    /** The function is called when the list scrolls */
    listenToScroll: PropTypes.func,
  };

  static defaultProps = {
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

  constructor(props) {
    super(props);

    this.scrollListener = this.scrollListener.bind(this);
    this.scrollEventCount = 0;
  }

  componentDidMount() {
    this.pageLoaded = this.props.pageStart;
    this.attachScrollListener();
  }

  componentWillUnmount() {
    this.detachScrollListener();
    this.detachMousewheelListener();
  }

  // Set a defaut loader for all your `InfiniteScroll` components
  setDefaultLoader(loader) {
    this.defaultLoader = loader;
  }

  detachMousewheelListener() {
    let scrollEl = window;
    if (this.props.useWindow === false) {
      scrollEl = this.scrollComponent.parentNode;
    }

    scrollEl.removeEventListener(
      'mousewheel',
      this.mousewheelListener,
      this.props.useCapture,
    );
  }

  detachScrollListener() {
    let scrollEl = window;
    if (this.props.useWindow === false) {
      scrollEl = this.getParentElement(this.scrollComponent);
    }

    scrollEl.removeEventListener(
      'scroll',
      this.scrollListener,
      this.props.useCapture,
    );
    scrollEl.removeEventListener(
      'resize',
      this.scrollListener,
      this.props.useCapture,
    );
  }

  getParentElement(el) {
    return el && el.parentNode;
  }

  filterProps(props) {
    return props;
  }

  attachScrollListener() {
    if (
      !this.props.hasMore ||
      this.props.isLoading ||
      !this.getParentElement(this.scrollComponent)
    ) {
      return;
    }

    let scrollEl = window;
    if (this.props.useWindow === false) {
      scrollEl = this.getParentElement(this.scrollComponent);
    }

    scrollEl.addEventListener(
      'mousewheel',
      this.mousewheelListener,
      this.props.useCapture,
    );
    scrollEl.addEventListener(
      'scroll',
      this.scrollListener,
      this.props.useCapture,
    );
    scrollEl.addEventListener(
      'resize',
      this.scrollListener,
      this.props.useCapture,
    );

    if (this.props.initialLoad) {
      this.scrollListener();
    }
  }

  mousewheelListener(e) {
    // Prevents Chrome hangups
    // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
    if (e.deltaY === 1) {
      e.preventDefault();
    }
  }

  scrollListener() {
    const el = this.scrollComponent;
    const scrollEl = window;
    const parentNode = this.getParentElement(el);
    this.scrollEventCount += 1;

    let offset;
    const reverseOffset = parentNode.scrollTop;
    const standardOffset =
      el.scrollHeight - parentNode.scrollTop - parentNode.clientHeight;
    if (this.props.isReverse) {
      offset = reverseOffset;
    } else {
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
    if (
      offset < Number(this.props.threshold) &&
      el &&
      el.offsetParent !== null
    ) {
      //this.detachScrollListener();
      // Call loadMore after detachScrollListener to allow for non-async loadMore functions
      if (typeof this.props.loadMore === 'function') {
        this.props.loadMore((this.pageLoaded += 1));
      }
    }
  }

  calculateOffset(el, scrollTop) {
    if (!el) {
      return 0;
    }

    return (
      this.calculateTopPosition(el) +
      (el.offsetHeight - scrollTop - window.innerHeight)
    );
  }

  calculateTopPosition(el) {
    if (!el) {
      return 0;
    }
    return el.offsetTop + this.calculateTopPosition(el.offsetParent);
  }

  render() {
    const renderProps = this.filterProps(this.props);
    const {
      children,
      element,
      hasMore,
      initialLoad,
      isReverse,
      loader,
      loadMore,
      pageStart,
      ref,
      threshold,
      useCapture,
      useWindow,
      listenToScroll,
      isLoading,
      ...props
    } = renderProps;

    props.ref = (node) => {
      this.scrollComponent = node;
      if (ref) {
        ref(node);
      }
    };

    const childrenArray = [children];
    if (isLoading) {
      if (loader) {
        isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader);
      } else if (this.defaultLoader) {
        isReverse
          ? childrenArray.unshift(this.defaultLoader)
          : childrenArray.push(this.defaultLoader);
      }
    }
    return React.createElement(element, props, childrenArray);
  }
}
