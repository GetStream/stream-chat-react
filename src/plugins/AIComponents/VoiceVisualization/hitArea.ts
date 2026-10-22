/** How far from the centre a tap still lands on the globe, as a share of the shorter side. */
const GLOBE_REACH = 0.32;

/** Whether a point, centred and normalized to the shorter side with y up, lands on the globe. */
export const glowContains = (x: number, y: number) => Math.hypot(x, y) < GLOBE_REACH;

/**
 * A pointer event's position in the renderers' coordinates: centred on the element, normalized
 * to its shorter side, y up.
 */
export const toLocalPoint = (event: {
  clientX: number;
  clientY: number;
  currentTarget: Element;
}) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const side = Math.min(rect.width, rect.height) || 1;
  return {
    x: (event.clientX - rect.left - rect.width / 2) / side,
    y: (rect.height / 2 - (event.clientY - rect.top)) / side,
  };
};
