type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isVisible(child: BoundingBox | null, container: BoundingBox | null) {
  console.log('container', container)
  console.log('child', child)
  if (child && container) {
    const { y: containerBottomY, height: containerHeight } = container;
    const { y: childBottomY, height: childHeight } = child;

    const childTopY = childBottomY - childHeight;
    const containerTopY = containerBottomY + containerHeight;
    const r = containerTopY >= childTopY && childBottomY >= containerBottomY;
    console.log(`containerTopY(${containerTopY}) > childTopY(${childTopY}) || childBottomY(${childBottomY}) > containerBottomY(${containerBottomY}) | ${r}`)
    return containerTopY >= childTopY && childBottomY >= containerBottomY;
  }
  return false;
}
