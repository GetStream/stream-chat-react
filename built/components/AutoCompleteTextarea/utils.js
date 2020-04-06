'use strict';
//
Object.defineProperty(exports, '__esModule', { value: true });
function defaultScrollToItem(container, item) {
  var itemHeight = parseInt(
    getComputedStyle(item).getPropertyValue('height'),
    10,
  );
  var containerHight =
    parseInt(getComputedStyle(container).getPropertyValue('height'), 10) -
    itemHeight;
  var itemOffsetTop = item.offsetTop;
  var actualScrollTop = container.scrollTop;
  if (
    itemOffsetTop < actualScrollTop + containerHight &&
    actualScrollTop < itemOffsetTop
  ) {
    return;
  }
  // eslint-disable-next-line
  container.scrollTop = itemOffsetTop;
}
exports.defaultScrollToItem = defaultScrollToItem;
