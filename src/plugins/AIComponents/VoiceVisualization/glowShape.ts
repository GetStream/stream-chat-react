/** How far from the centre a tap still lands on the globe, as a share of the shorter side. */
const GLOBE_REACH = 0.32;

/** Whether a point, centred and normalized to the shorter side with y up, lands on the globe. */
export const glowContains = (x: number, y: number) => Math.hypot(x, y) < GLOBE_REACH;
