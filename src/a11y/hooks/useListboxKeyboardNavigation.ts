import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';

import { getNextRovingFocusIndex } from '../a11yUtils';

const DEFAULT_OPTION_SELECTOR = '[role="option"]';
const VERTICAL_KEYS = ['ArrowUp', 'ArrowDown', 'Home', 'End'];

/** State handed to a {@link ListboxKeyHandler} when its key is pressed inside the container. */
export type ListboxNavigationContext = {
  /** The focused element — guaranteed to be inside the container. */
  active: HTMLElement;
  /** The listbox container element. */
  container: HTMLElement;
  /** The current option elements (live). */
  getOptions: () => HTMLElement[];
  /** Whether {@link ListboxNavigationContext.active} is itself an option. */
  onOption: boolean;
};

/**
 * Handler for a non-roving key. Return `true` if it handled the key — the hook then
 * `preventDefault()`s and `stopPropagation()`s so nothing else acts on it. Return nothing to let the
 * key fall through (default behaviour preserved).
 */
export type ListboxKeyHandler = (context: ListboxNavigationContext) => boolean | void;

export type ListboxKeyboardNavigationConfig = {
  /**
   * Where the roving (vertical) keys are active:
   * - `'option'` (default): only when focus is already on an option — a plain listbox.
   * - `'container'`: anywhere inside the container, so focus can enter the list from a preceding
   *   control (e.g. a filter tag); when not on an option, Down/Home land on the first, Up/End on the
   *   last.
   */
  enterScope?: 'container' | 'option';
  /**
   * Extra keys to handle, beyond the built-in roving. Mapped by `event.key` to a handler that
   * receives the current {@link ListboxNavigationContext} and decides what to do. The hook does not
   * prescribe any particular keys (e.g. ArrowRight to reach a row's actions) — compose what you need,
   * optionally with {@link createRowActionKeyHandlers}. Roving keys (Up/Down/Home/End) are reserved.
   */
  keyHandlers?: Record<string, ListboxKeyHandler>;
  /** Selector for the navigable options. Default `[role="option"]`. */
  optionSelector?: string;
  /**
   * Maps the focused element to the option that vertical roving (Up/Down/Home/End) should move
   * relative to. Use with `enterScope: 'container'` so those keys work while focus is on something
   * inside an option's row (e.g. its action buttons) and step to the next/previous option from that
   * row, rather than jumping to the first/last. Return `null` to fall back to that default.
   */
  resolveActiveOption?: (active: HTMLElement) => HTMLElement | null;
};

/**
 * Keyboard navigation for a list of options (the channel list, the search results, …). Returns an
 * `onKeyDown` to spread onto the container plus `getOptions` for callers that need the current
 * options (e.g. load-more focus management):
 * - **ArrowUp/ArrowDown/Home/End** rove the options (scope set by `enterScope`).
 * - any other key listed in `keyHandlers` is delegated to its handler.
 *
 * For keys, it handles it `stopPropagation()`s, so it stays authoritative — nothing downstream (a
 * parent handler, or the browser/AT "jump to first/last focusable" fallback) can move focus to a
 * non-option. Stateless — safe to call on every render; the handlers read the DOM live.
 */
export const useListboxKeyboardNavigation = (
  containerRef: RefObject<HTMLElement | null>,
  {
    enterScope = 'option',
    keyHandlers,
    optionSelector = DEFAULT_OPTION_SELECTOR,
    resolveActiveOption,
  }: ListboxKeyboardNavigationConfig = {},
) => {
  const getOptions = () =>
    Array.from(containerRef.current?.querySelectorAll<HTMLElement>(optionSelector) ?? []);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const container = containerRef.current;
    const active = document.activeElement;
    if (!container || !(active instanceof HTMLElement) || !container.contains(active)) {
      return;
    }

    const onOption = active.matches(optionSelector);

    if (VERTICAL_KEYS.includes(event.key)) {
      if (enterScope === 'option' && !onOption) return;
      const options = getOptions();
      // The option the move is relative to: the focused option itself, or — when focus is on
      // something inside an option's row (e.g. an action button) — the option that row maps to.
      const current = onOption ? active : (resolveActiveOption?.(active) ?? null);
      const nextIndex = getNextRovingFocusIndex({
        activeIndex: current ? options.indexOf(current) : -1,
        itemCount: options.length,
        key: event.key,
      });
      if (nextIndex === null) return;
      event.preventDefault();
      event.stopPropagation();
      options[nextIndex]?.focus();
      return;
    }

    const handled = keyHandlers?.[event.key]?.({
      active,
      container,
      getOptions,
      onOption,
    });
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return { getOptions, onKeyDown };
};

/**
 * Composable {@link ListboxKeyHandler}s for the "each option sits in a row alongside one or more
 * action targets" pattern (e.g. a channel row + its actions/menu buttons). The option and its
 * actions form one **horizontal cyclic group** in DOM order: from the option **ArrowRight** enters
 * the actions; **ArrowLeft/ArrowRight** move between the actions; stepping off either end returns to
 * the option (so the actions need not be in the Tab order). Rows with no actions (a lone option)
 * leave the keys unhandled. Pass the result as (part of) `keyHandlers`.
 */
export const createRowActionKeyHandlers = ({
  actionSelector,
  optionSelector = DEFAULT_OPTION_SELECTOR,
  rowSelector,
}: {
  actionSelector: string;
  optionSelector?: string;
  rowSelector: string;
}): Record<string, ListboxKeyHandler> => {
  const rove =
    (step: -1 | 1): ListboxKeyHandler =>
    ({ active }) => {
      const row = active.closest(rowSelector);
      if (!row) return;
      // The option + its action targets, in document order, as one cyclic group.
      const items = Array.from(
        row.querySelectorAll<HTMLElement>(`${optionSelector}, ${actionSelector}`),
      );
      if (items.length < 2) return; // a lone option — nothing to move between
      const index = items.indexOf(active);
      if (index === -1) return;
      items[(index + step + items.length) % items.length].focus();
      return true;
    };

  return { ArrowLeft: rove(-1), ArrowRight: rove(1) };
};
