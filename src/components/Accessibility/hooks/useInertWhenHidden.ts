import React, { useMemo } from 'react';

/**
 * Props returned by {@link useInertWhenHidden}, to spread onto the element that stays mounted.
 *
 * `inert` is typed `boolean | undefined` so the object spreads onto a host element on every React
 * version, although its runtime value is the string `'true'` on React 17/18.
 */
export type InertWhenHiddenProps = {
  'aria-hidden': true | undefined;
  hidden: boolean | undefined;
  inert: boolean | undefined;
  tabIndex: number | undefined;
};

const REACT_MAJOR = parseInt(React.version, 10);
// React 19 takes `inert` as a boolean; React 17/18 only forward it as a string and warn or drop the
// attribute for a boolean. The cast keeps the public type `boolean`.
const INERT_PRESENT = (REACT_MAJOR >= 19 ? true : 'true') as unknown as boolean;

const SHOWN_PROPS: InertWhenHiddenProps = {
  'aria-hidden': undefined,
  hidden: undefined,
  inert: undefined,
  tabIndex: undefined,
};

const HIDDEN_PROPS: InertWhenHiddenProps = {
  'aria-hidden': true,
  hidden: true,
  inert: INERT_PRESENT,
  tabIndex: -1,
};

const HIDDEN_PROPS_WITHOUT_HIDDEN_ATTRIBUTE: InertWhenHiddenProps = {
  'aria-hidden': true,
  hidden: undefined,
  inert: INERT_PRESENT,
  tabIndex: -1,
};

/** Options for {@link useInertWhenHidden}. */
export type UseInertWhenHiddenOptions = {
  /**
   * Whether to set the `hidden` attribute (`display: none`) while hidden. Set `false` for elements
   * hidden by CSS, such as a transition that `display: none` would cancel: `aria-hidden`, `inert`
   * and `tabIndex={-1}` still apply and the element stays laid out. Defaults to `true`.
   */
  setHiddenAttribute?: boolean;
};

/**
 * Hides a control from assistive technology and the tab order while it stays mounted.
 *
 * @remarks
 * Prefer not rendering the control at all; use this only when it must stay mounted, e.g. to keep
 * state, layout measurements or enter/exit transitions. While `hidden` is `true` the returned
 * props set `aria-hidden`, `tabIndex={-1}`, `inert` and, unless `setHiddenAttribute` is `false`,
 * `hidden`; `aria-hidden` and `tabIndex` cover engines without `inert` support. Otherwise every
 * prop is `undefined`, so spreading them is a no-op and `aria-hidden` is never set to `"false"`.
 *
 * @example
 * ```tsx
 * const Toolbar = ({ collapsed }: { collapsed: boolean }) => {
 *   const inertProps = useInertWhenHidden(collapsed);
 *   return <button {...inertProps}>Add attachment</button>;
 * };
 * ```
 *
 * @param hidden - Whether the control is currently hidden.
 * @param options - Behavior options, see {@link UseInertWhenHiddenOptions}.
 * @returns A memoized props object to spread onto the element.
 */
export const useInertWhenHidden = (
  hidden: boolean,
  options?: UseInertWhenHiddenOptions,
): InertWhenHiddenProps => {
  const setHiddenAttribute = options?.setHiddenAttribute ?? true;
  return useMemo(() => {
    if (!hidden) return SHOWN_PROPS;
    return setHiddenAttribute ? HIDDEN_PROPS : HIDDEN_PROPS_WITHOUT_HIDDEN_ATTRIBUTE;
  }, [hidden, setHiddenAttribute]);
};
