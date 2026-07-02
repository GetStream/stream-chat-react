import { type KeyboardEvent, useCallback, useEffect } from 'react';

type GridRef = { readonly current: HTMLElement | null };

const EMOJI_SELECTOR = '.str-chat__emoji-picker__emoji';
const NAV_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];

/**
 * Roving-tabindex keyboard navigation for the emoji grid. Left/Right move in reading
 * order; Up/Down pick the geometrically nearest cell on the adjacent row (robust
 * across category headers and virtualization, which a fixed column count is not).
 * Operates on the currently rendered cells; focusing scrolls the next ones in.
 */
export const useGridKeyboardNav = (gridRef: GridRef) => {
  const getButtons = useCallback(
    () =>
      Array.from(
        gridRef.current?.querySelectorAll<HTMLButtonElement>(EMOJI_SELECTOR) ?? [],
      ),
    [gridRef],
  );

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

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (!NAV_KEYS.includes(event.key)) return;
      const buttons = getButtons();
      const index = buttons.findIndex((button) => button === document.activeElement);
      if (index === -1) return;
      event.preventDefault();

      if (event.key === 'Home') {
        focusButton(buttons[0]);
        return;
      }
      if (event.key === 'End') {
        focusButton(buttons[buttons.length - 1]);
        return;
      }
      if (event.key === 'ArrowRight') {
        focusButton(buttons[Math.min(index + 1, buttons.length - 1)]);
        return;
      }
      if (event.key === 'ArrowLeft') {
        focusButton(buttons[Math.max(index - 1, 0)]);
        return;
      }

      // ArrowUp / ArrowDown — nearest cell on the adjacent row, matched by center-x.
      const current = buttons[index].getBoundingClientRect();
      const centerX = current.left + current.width / 2;
      const centerY = current.top + current.height / 2;
      const goingDown = event.key === 'ArrowDown';

      let best: HTMLButtonElement | undefined;
      let bestScore = Infinity;
      for (const button of buttons) {
        if (button === buttons[index]) continue;
        const rect = button.getBoundingClientRect();
        const dy = rect.top + rect.height / 2 - centerY;
        // Skip cells on the same row or the wrong direction.
        if (goingDown ? dy <= current.height / 2 : dy >= -current.height / 2) continue;
        const dx = Math.abs(rect.left + rect.width / 2 - centerX);
        const score = dx + Math.abs(dy) * 2; // prefer same column, then nearest row
        if (score < bestScore) {
          bestScore = score;
          best = button;
        }
      }
      focusButton(best ?? buttons[index]);
    },
    [focusButton, getButtons],
  );

  return { focusFirst, onKeyDown };
};
