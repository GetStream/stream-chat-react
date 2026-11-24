import type { Checkpoint } from './trace';
import { readGeometry, readRenderedItems, readVisibleItems } from './harness';
import { probe } from './virtuosoProbe';

/**
 * Properties that must hold after every settled step, whatever the runtime: they need no
 * reference trace, so they also catch a bug both runtimes share.
 */

const threshold = (clientHeight: number) =>
  Math.min(Math.max(clientHeight * 0.1, 4), 100);

/** The scroller sits at its true bottom. */
export const expectAtBottom = (frame: HTMLElement, tolerance = 1) => {
  const geometry = readGeometry(frame);
  expect(geometry, 'scroller').not.toBeNull();
  expect(geometry?.distanceFromBottom, 'distance from the bottom').toBeLessThanOrEqual(
    tolerance,
  );
};

/** Rendered items are consecutive Virtuoso indexes, in DOM order. */
export const expectContiguousItems = (frame: HTMLElement) => {
  const indexes = readRenderedItems(frame).map((item) => item.index);
  indexes.forEach((index, position) => {
    if (position === 0) return;
    expect(index, `item after ${indexes[position - 1]}`).toBe(indexes[position - 1] + 1);
  });
};

/** Items fill the viewport whenever the content is taller than it. */
export const expectViewportCovered = (frame: HTMLElement) => {
  const geometry = readGeometry(frame);
  if (!geometry || geometry.scrollHeight <= geometry.clientHeight + 1) return;
  const visible = readVisibleItems(frame);
  expect(visible.length, 'items in the viewport').toBeGreaterThan(0);
  const first = visible[0];
  const last = visible[visible.length - 1];
  // The header (thread head, loading indicator) may sit above the first item at the very top.
  if (geometry.scrollTop > 1)
    expect(first.top, 'first item top').toBeLessThanOrEqual(0.5);
  if (geometry.distanceFromBottom > 1) {
    expect(last.top + last.height, 'last item bottom').toBeGreaterThanOrEqual(
      geometry.clientHeight - 0.5,
    );
  }
};

/** Messages that stayed rendered kept their DOM nodes: keys are stable. */
export const expectNoRemounts = (point: Checkpoint) => {
  expect(point.remounted, 'remounted items').toEqual([]);
};

/** The last at-bottom state Virtuoso reported agrees with the measured geometry. */
export const expectAtBottomStateAgrees = (frame: HTMLElement) => {
  const geometry = readGeometry(frame);
  if (!geometry) return;
  const reports = probe.events.filter((event) => event.name === 'atBottomStateChange');
  const last = reports[reports.length - 1]?.value;
  if (last === undefined) return;
  if (geometry.distanceFromBottom <= 1) expect(last, 'reported at bottom').toBe(true);
  if (geometry.distanceFromBottom > threshold(geometry.clientHeight) + 2) {
    expect(last, 'reported at bottom').toBe(false);
  }
};

/** Every settled-state invariant at once. */
export const expectSettledInvariants = (frame: HTMLElement, point: Checkpoint) => {
  expect(point.visible, 'list visible').toBe(true);
  expectContiguousItems(frame);
  expectViewportCovered(frame);
  expectAtBottomStateAgrees(frame);
};
