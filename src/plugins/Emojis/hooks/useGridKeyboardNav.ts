import { type KeyboardEvent, useCallback, useEffect, useRef } from 'react';

type GridRef = { readonly current: HTMLElement | null };

export type GridKeyboardNavOptions = {
  /**
   * Ordered categories (only `id` is read). Lets navigation cross into a category that
   * virtualization has not mounted — without it, navigation is limited to the cells
   * currently in the DOM.
   */
  categories?: readonly { id: string }[];
  /**
   * Scrolls a category into view so virtualization mounts it (e.g. Virtuoso's
   * `scrollToIndex`). Navigation focuses the target cell once that category appears.
   */
  scrollToCategory?: (categoryId: string) => void;
};

const EMOJI_SELECTOR = '.str-chat__emoji-picker__emoji';
const CATEGORY_SELECTOR = '[data-category-id]';
const NAV_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
// Stop waiting for an offscreen category to mount after this long (avoids a dangling
// observer if a scroll never mounts the target).
const MOUNT_TIMEOUT_MS = 1000;

const cellsIn = (root: Element | null) =>
  root ? Array.from(root.querySelectorAll<HTMLButtonElement>(EMOJI_SELECTOR)) : [];

// Half a cell tall — the tolerance for treating cells as sharing a row by their top edge.
const rowEpsilon = (cell: HTMLButtonElement) =>
  Math.max(2, cell.getBoundingClientRect().height / 2);

// The active cell's index within its own visual row (its "column").
const columnOf = (cell: HTMLButtonElement) => {
  const section = cell.closest(CATEGORY_SELECTOR);
  if (!section) return 0;
  const top = cell.getBoundingClientRect().top;
  const eps = rowEpsilon(cell);
  const row = cellsIn(section)
    .filter((c) => Math.abs(c.getBoundingClientRect().top - top) < eps)
    .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  const column = row.indexOf(cell);
  return column < 0 ? 0 : column;
};

// The cell at `column` of a category's first or last row — used to land in the same
// column when crossing a category boundary via Arrow Up/Down.
const edgeRowCell = (
  cells: HTMLButtonElement[],
  edge: 'first' | 'last',
  column: number,
) => {
  if (!cells.length) return undefined;
  const tops = cells.map((c) => c.getBoundingClientRect().top);
  const edgeTop = edge === 'first' ? Math.min(...tops) : Math.max(...tops);
  const eps = rowEpsilon(cells[0]);
  const row = cells
    .filter((c) => Math.abs(c.getBoundingClientRect().top - edgeTop) < eps)
    .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  const target = row.length ? row : cells;
  return target[Math.min(column, target.length - 1)];
};

// The geometrically nearest cell on the adjacent row (same column preferred), matched
// by center-x. Robust across category headers and variable column counts. `undefined`
// when there is no such cell among `cells` (i.e. we're at the mounted top/bottom edge).
const adjacentRowCell = (
  cells: HTMLButtonElement[],
  active: HTMLButtonElement,
  goingDown: boolean,
) => {
  const current = active.getBoundingClientRect();
  const centerX = current.left + current.width / 2;
  const centerY = current.top + current.height / 2;

  let best: HTMLButtonElement | undefined;
  let bestScore = Infinity;
  for (const cell of cells) {
    if (cell === active) continue;
    const rect = cell.getBoundingClientRect();
    const dy = rect.top + rect.height / 2 - centerY;
    // Skip cells on the same row or in the wrong direction.
    if (goingDown ? dy <= current.height / 2 : dy >= -current.height / 2) continue;
    const dx = Math.abs(rect.left + rect.width / 2 - centerX);
    const score = dx + Math.abs(dy) * 2; // prefer same column, then nearest row
    if (score < bestScore) {
      bestScore = score;
      best = cell;
    }
  }
  return best;
};

/**
 * Roving-tabindex keyboard navigation for the emoji grid. Left/Right move in reading
 * order; Up/Down pick the geometrically nearest cell on the adjacent row (robust across
 * category headers and virtualization, which a fixed column count is not).
 *
 * Because the grid is virtualized, a move can land in a category that is not currently
 * mounted. When that happens navigation asks `scrollToCategory` to mount it, then
 * focuses the target cell as soon as it appears in the DOM — so keyboard users can reach
 * the whole emoji set, not just the mounted window.
 */
export const useGridKeyboardNav = (
  gridRef: GridRef,
  { categories = [], scrollToCategory }: GridKeyboardNavOptions = {},
) => {
  const getButtons = useCallback(() => cellsIn(gridRef.current), [gridRef]);

  const setRoving = useCallback(
    (target: HTMLButtonElement) => {
      for (const button of getButtons()) {
        button.tabIndex = button === target ? 0 : -1;
      }
    },
    [getButtons],
  );

  // Keep exactly one cell tab-reachable across (virtualized) re-renders.
  useEffect(() => {
    const buttons = getButtons();
    if (buttons.length && !buttons.some((button) => button.tabIndex === 0)) {
      buttons[0].tabIndex = 0;
    }
  });

  const focusButton = useCallback(
    (button: HTMLButtonElement | undefined) => {
      if (!button) return;
      setRoving(button);
      button.focus();
      button.scrollIntoView({ block: 'nearest' });
    },
    [setRoving],
  );

  const focusFirst = useCallback(() => {
    focusButton(getButtons()[0]);
  }, [focusButton, getButtons]);

  // Teardown for a pending "focus once the category mounts" watch. Replaced whenever a
  // new cross starts; invoked on a superseding keypress and on unmount.
  const cancelPending = useRef<() => void>(() => undefined);
  useEffect(() => () => cancelPending.current(), []);

  // Ask virtualization to mount `categoryId`, then focus the cell `pick` chooses from
  // that category once its cells are in the DOM. Returns `false` (unhandled) only when
  // there is no such category or no way to scroll to it.
  const crossToCategory = useCallback(
    (
      categoryId: string | undefined,
      pick: (cells: HTMLButtonElement[]) => HTMLButtonElement | undefined,
    ) => {
      if (!categoryId || !scrollToCategory) return false;

      const resolve = () => {
        const section = gridRef.current?.querySelector(
          `${CATEGORY_SELECTOR}[data-category-id="${categoryId}"]`,
        );
        const cells = cellsIn(section ?? null);
        return cells.length ? pick(cells) : undefined;
      };

      scrollToCategory(categoryId);
      cancelPending.current();

      // Already mounted (adjacent category within the overscan window) — focus now.
      const immediate = resolve();
      if (immediate) {
        focusButton(immediate);
        return true;
      }

      const grid = gridRef.current;
      if (!grid) return true;

      // Otherwise wait for the scroll to mount it, then focus.
      const observer = new MutationObserver(() => {
        const target = resolve();
        if (target) {
          cancelPending.current();
          focusButton(target);
        }
      });
      observer.observe(grid, { childList: true, subtree: true });
      const timeout = setTimeout(() => cancelPending.current(), MOUNT_TIMEOUT_MS);
      cancelPending.current = () => {
        observer.disconnect();
        clearTimeout(timeout);
        cancelPending.current = () => undefined;
      };
      return true;
    },
    [focusButton, gridRef, scrollToCategory],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!NAV_KEYS.includes(event.key)) return;
      const buttons = getButtons();
      const index = buttons.findIndex((button) => button === document.activeElement);
      if (index === -1) return;
      event.preventDefault();
      // A fresh keypress supersedes any in-flight wait for an offscreen category.
      cancelPending.current();

      const active = buttons[index];
      // The category the focused cell belongs to; -1 in the (non-virtualized) search
      // view, where every result is already mounted so crossing is neither possible nor
      // needed. `inCategoryView` gates every scroll-to-mount branch on that.
      const activeCategoryId = active
        .closest(CATEGORY_SELECTOR)
        ?.getAttribute('data-category-id');
      const category = categories.findIndex((entry) => entry.id === activeCategoryId);
      const inCategoryView = category >= 0;

      if (event.key === 'Home') {
        if (inCategoryView && crossToCategory(categories[0]?.id, (cells) => cells[0])) {
          return;
        }
        focusButton(buttons[0]);
        return;
      }
      if (event.key === 'End') {
        const lastId = categories[categories.length - 1]?.id;
        if (
          inCategoryView &&
          crossToCategory(lastId, (cells) => cells[cells.length - 1])
        ) {
          return;
        }
        focusButton(buttons[buttons.length - 1]);
        return;
      }
      if (event.key === 'ArrowRight') {
        if (index < buttons.length - 1) {
          focusButton(buttons[index + 1]);
          return;
        }
        const next = inCategoryView ? categories[category + 1]?.id : undefined;
        if (crossToCategory(next, (cells) => cells[0])) return;
        focusButton(active); // truly the last cell — stay put
        return;
      }
      if (event.key === 'ArrowLeft') {
        if (index > 0) {
          focusButton(buttons[index - 1]);
          return;
        }
        const previous = category > 0 ? categories[category - 1]?.id : undefined;
        if (crossToCategory(previous, (cells) => cells[cells.length - 1])) return;
        focusButton(active);
        return;
      }

      // ArrowUp / ArrowDown.
      const goingDown = event.key === 'ArrowDown';
      const adjacent = adjacentRowCell(buttons, active, goingDown);
      if (adjacent) {
        focusButton(adjacent);
        return;
      }
      // No adjacent row in the mounted set — cross into the neighbouring category,
      // landing in the same column of its first (down) or last (up) row.
      const column = columnOf(active);
      if (goingDown) {
        const next = inCategoryView ? categories[category + 1]?.id : undefined;
        if (crossToCategory(next, (cells) => edgeRowCell(cells, 'first', column))) return;
      } else if (category > 0) {
        const previous = categories[category - 1]?.id;
        if (crossToCategory(previous, (cells) => edgeRowCell(cells, 'last', column))) {
          return;
        }
      }
      focusButton(active);
    },
    [categories, crossToCategory, focusButton, getButtons],
  );

  return { focusFirst, onKeyDown };
};
