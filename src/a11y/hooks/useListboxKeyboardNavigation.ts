import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';

import { getNextRovingFocusIndex } from '../a11yUtils';

const DEFAULT_OPTION_SELECTOR = '[role="option"]';
const VERTICAL_KEYS = ['ArrowUp', 'ArrowDown', 'Home', 'End'];

/** State handed to a {@link ListboxKeyHandler} when its key is pressed inside the container. */
export type ListboxNavigationContext = {
  /** The focused element, always inside the container. */
  active: HTMLElement;
  /** The listbox container element. */
  container: HTMLElement;
  /** Queries the current option elements on each call. */
  getOptions: () => HTMLElement[];
  /** Whether {@link ListboxNavigationContext.active} is itself an option. */
  onOption: boolean;
};

/**
 * Handler for a non-roving key. Returning `true` marks the key as handled and the hook calls
 * `preventDefault()` and `stopPropagation()`; any other return lets the key fall through.
 */
export type ListboxKeyHandler = (context: ListboxNavigationContext) => boolean | void;

export type ListboxKeyboardNavigationConfig = {
  /**
   * Where the roving (Up/Down/Home/End) keys are active. Defaults to `'option'`.
   * - `'option'`: only while focus is on an option.
   * - `'container'`: anywhere inside the container, so focus can enter the list from a preceding
   *   control. Off an option, Down and Home focus the first option, Up and End the last.
   */
  enterScope?: 'container' | 'option';
  /**
   * Extra handlers by `event.key`; {@link createRowActionKeyHandlers} builds a ready-made set.
   * Up, Down, Home and End are reserved for roving and never reach a handler.
   */
  keyHandlers?: Record<string, ListboxKeyHandler>;
  /** Selector for the navigable options. Defaults to `[role="option"]`. */
  optionSelector?: string;
  /**
   * Maps the focused element to the option that roving moves relative to, for focus on something
   * inside an option's row. Use with `enterScope: 'container'`. Returning `null` treats no option
   * as active, so Down lands on the first option and Up on the last.
   */
  resolveActiveOption?: (active: HTMLElement) => HTMLElement | null;
};

/**
 * Keyboard navigation for a listbox. Returns `onKeyDown` to spread onto the container and
 * `getOptions` to query the current options.
 *
 * ArrowUp/ArrowDown/Home/End rove the options (see `enterScope`); other keys go to `keyHandlers`.
 * Handled keys call `preventDefault()` and `stopPropagation()`, so neither an ancestor handler nor
 * a browser default can move focus to a non-option. Options are read from the DOM on each key.
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
      // Move relative to the focused option, or to the one `resolveActiveOption` maps the focus to.
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
 * ArrowLeft/ArrowRight {@link ListboxKeyHandler}s for an option that sits in a row next to action
 * targets. The option and its actions form one cyclic group in DOM order, so the actions need not
 * be in the Tab order. A row with a lone option leaves the keys unhandled. Pass the result as (part
 * of) `keyHandlers`.
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
      // The option and its action targets in DOM order, as one cyclic group.
      const items = Array.from(
        row.querySelectorAll<HTMLElement>(`${optionSelector}, ${actionSelector}`),
      );
      if (items.length < 2) return; // A lone option has nothing to move between.
      const index = items.indexOf(active);
      if (index === -1) return;
      items[(index + step + items.length) % items.length].focus();
      return true;
    };

  return { ArrowLeft: rove(-1), ArrowRight: rove(1) };
};
