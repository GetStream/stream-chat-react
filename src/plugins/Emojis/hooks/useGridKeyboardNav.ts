import { type KeyboardEvent, useCallback, useEffect, useRef } from 'react';
import { navigateGrid } from './gridNavigation';

type GridRef = { readonly current: HTMLElement | null };

export type GridKeyboardNavOptions = {
  /**
   * Ordered categories with their emoji ids. Navigation runs over this model (not live
   * DOM geometry), so it can target a cell in a category that virtualization has not
   * mounted yet — and stays correct regardless of layout.
   */
  categories?: readonly { emojis: readonly { id: string }[]; id: string }[];
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

// Cells are laid out row-major, so the first row is every cell sharing the first cell's
// offsetTop — its size is the current column count. Uses offsetTop (no forced reflow)
// and is read once per keypress.
const measureColumns = (cells: HTMLButtonElement[]) => {
  if (cells.length <= 1) return Math.max(1, cells.length);
  const top = cells[0].offsetTop;
  return Math.max(1, cells.filter((cell) => cell.offsetTop === top).length);
};

/**
 * Roving-tabindex keyboard navigation for the emoji grid. Navigation is computed by the
 * pure `navigateGrid` over the known category model (see gridNavigation.ts) — only the
 * current column count is read from layout — then the resolved cell is focused by id.
 *
 * Because the grid is virtualized, a move can target a category that is not currently
 * mounted; navigation then asks `scrollToCategory` to mount it and focuses the cell as
 * soon as it appears, so keyboard users can traverse the whole set. In the search view
 * (no categories) it navigates the flat, fully-mounted result list the same way.
 */
export const useGridKeyboardNav = (
  gridRef: GridRef,
  { categories = [], scrollToCategory }: GridKeyboardNavOptions = {},
) => {
  const getButtons = useCallback(() => cellsIn(gridRef.current), [gridRef]);

  // The single tab-reachable ("roving") cell. Tracked in a ref so moving focus only
  // flips two cells' tabIndex instead of sweeping every mounted cell.
  const rovingRef = useRef<HTMLButtonElement | null>(null);

  const focusCell = useCallback((cell: HTMLButtonElement | null | undefined) => {
    if (!cell) return;
    if (rovingRef.current && rovingRef.current !== cell) {
      rovingRef.current.tabIndex = -1;
    }
    cell.tabIndex = 0;
    rovingRef.current = cell;
    cell.focus();
    cell.scrollIntoView({ block: 'nearest' });
  }, []);

  // Keep one tab-reachable cell as virtualization mounts/unmounts. Cheap: only touches
  // the DOM when the roving cell has detached (e.g. scrolled out and unmounted).
  useEffect(() => {
    if (rovingRef.current && gridRef.current?.contains(rovingRef.current)) return;
    const first = getButtons()[0];
    if (first) {
      first.tabIndex = 0;
      rovingRef.current = first;
    }
  });

  const focusFirst = useCallback(
    () => focusCell(getButtons()[0]),
    [focusCell, getButtons],
  );

  // Teardown for a pending "focus once the category mounts" watch. Replaced whenever a
  // new focus-by-id starts; invoked on a superseding keypress and on unmount.
  const cancelPending = useRef<() => void>(() => undefined);
  useEffect(() => () => cancelPending.current(), []);

  // Focus an emoji by id within a specific category (ids repeat across the "frequent"
  // section and their home category, so the lookup must be category-scoped). If that
  // category isn't mounted, scroll it into view and focus once it appears.
  const focusEmojiInCategory = useCallback(
    (categoryId: string, emojiId: string) => {
      const find = () => {
        const section = gridRef.current?.querySelector(
          `${CATEGORY_SELECTOR}[data-category-id="${categoryId}"]`,
        );
        return (
          section?.querySelector<HTMLButtonElement>(
            `${EMOJI_SELECTOR}[data-emoji-id="${emojiId}"]`,
          ) ?? null
        );
      };

      cancelPending.current();

      const mounted = find();
      if (mounted) {
        focusCell(mounted);
        return;
      }

      scrollToCategory?.(categoryId);
      const grid = gridRef.current;
      if (!grid) return;

      const observer = new MutationObserver(() => {
        const cell = find();
        if (cell) {
          cancelPending.current();
          focusCell(cell);
        }
      });
      observer.observe(grid, { childList: true, subtree: true });
      const timeout = setTimeout(() => cancelPending.current(), MOUNT_TIMEOUT_MS);
      cancelPending.current = () => {
        observer.disconnect();
        clearTimeout(timeout);
        cancelPending.current = () => undefined;
      };
    },
    [focusCell, gridRef, scrollToCategory],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!NAV_KEYS.includes(event.key)) return;
      const buttons = getButtons();
      const activeIndex = buttons.findIndex(
        (button) => button === document.activeElement,
      );
      if (activeIndex === -1) return;
      event.preventDefault();
      // A fresh keypress supersedes any in-flight wait for an offscreen category.
      cancelPending.current();

      const active = buttons[activeIndex];
      const sectionEl = active.closest(CATEGORY_SELECTOR);
      const categoryId = sectionEl?.getAttribute('data-category-id');
      const sectionIndex = categories.findIndex((entry) => entry.id === categoryId);

      if (sectionIndex >= 0) {
        // Category (virtualized) view — navigate the known model.
        const emojiId = active.getAttribute('data-emoji-id');
        const indexInSection = categories[sectionIndex].emojis.findIndex(
          (emoji) => emoji.id === emojiId,
        );
        if (indexInSection === -1) return;

        const target = navigateGrid(
          categories.map((category) => category.emojis.length),
          { index: indexInSection, section: sectionIndex },
          event.key,
          measureColumns(cellsIn(sectionEl)),
        );
        if (!target) return; // grid edge — stay put

        const targetCategory = categories[target.section];
        const targetEmoji = targetCategory.emojis[target.index];
        if (targetEmoji) focusEmojiInCategory(targetCategory.id, targetEmoji.id);
        return;
      }

      // Search (non-virtualized) view — navigate the flat, fully-mounted result list.
      const target = navigateGrid(
        [buttons.length],
        { index: activeIndex, section: 0 },
        event.key,
        measureColumns(buttons),
      );
      if (target) focusCell(buttons[target.index]);
    },
    [categories, focusCell, focusEmojiInCategory, getButtons],
  );

  return { focusFirst, onKeyDown };
};
