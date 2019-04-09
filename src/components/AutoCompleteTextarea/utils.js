//

export function defaultScrollToItem(container, item) {
  const itemHeight = parseInt(
    getComputedStyle(item).getPropertyValue('height'),
    10,
  );

  const containerHight =
    parseInt(getComputedStyle(container).getPropertyValue('height'), 10) -
    itemHeight;

  const itemOffsetTop = item.offsetTop;
  const actualScrollTop = container.scrollTop;

  if (
    itemOffsetTop < actualScrollTop + containerHight &&
    actualScrollTop < itemOffsetTop
  ) {
    return;
  }

  // eslint-disable-next-line
  container.scrollTop = itemOffsetTop;
}
