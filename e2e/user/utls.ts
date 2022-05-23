type BoundingBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export function isVisible(child: BoundingBox | null, container: BoundingBox | null) {
  console.log('container', container);
  console.log('child', child);
  if (child && container) {
    const { height: containerHeight, y: containerBottomY } = container;
    const { height: childHeight, y: childBottomY } = child;

    const childTopY = childBottomY - childHeight;
    const containerTopY = containerBottomY + containerHeight;
    const r = containerTopY >= childTopY && childBottomY >= containerBottomY;
    console.log(
      `containerTopY(${containerTopY}) > childTopY(${childTopY}) || childBottomY(${childBottomY}) > containerBottomY(${containerBottomY}) | ${r}`,
    );
    return containerTopY >= childTopY && childBottomY >= containerBottomY;
  }
  return false;
}
