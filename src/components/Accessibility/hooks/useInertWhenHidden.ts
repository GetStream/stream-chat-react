import React, { useMemo } from 'react';

/**
 * The set of props returned by {@link useInertWhenHidden}, to be spread onto the
 * element that must remain mounted while visually hidden.
 *
 * `inert` is typed as `boolean | undefined` so the object spreads cleanly onto a
 * JSX host element (React 19 types `inert?: boolean`; React 17/18 don't declare
 * it at all, so an extra prop via spread is accepted). The RUNTIME value differs
 * by React major version (string `'true'` on 17/18) — see the implementation
 * note on {@link useInertWhenHidden} — and is cast to `boolean` at the source so
 * the public type stays spread-safe. Consumers spread it; they never read it.
 */
export type InertWhenHiddenProps = {
  'aria-hidden': true | undefined;
  hidden: boolean | undefined;
  inert: boolean | undefined;
  tabIndex: number | undefined;
};

/**
 * React 19 recognizes `inert` as a native boolean prop and renders
 * `inert={true}` to the DOM attribute `inert=""` (no warning). React 17/18 do
 * NOT know `inert`; they forward it only as a string, rendering `inert="true"`
 * (a valid present boolean attribute) with no warning. Passing a boolean to
 * React 17/18, or an empty string to React 19, produces a console warning and/or
 * drops the attribute — so we select the warning-free form per major version.
 */
const REACT_MAJOR = parseInt(React.version, 10);
// Runtime value differs by React major (boolean on 19, the string 'true' on 17/18), but the
// public type is `boolean | undefined` so the props spread cleanly onto JSX. The string form
// is cast here — it is the only place the type/runtime divergence is reconciled.
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

/**
 * Options for {@link useInertWhenHidden}.
 */
export type UseInertWhenHiddenOptions = {
  /**
   * Whether to set the HTML `hidden` attribute (which applies `display: none`)
   * when `hidden` is `true`. Defaults to `true`.
   *
   * Set to `false` for elements whose visual hiding is already handled by CSS
   * (e.g. an opacity/scale/`max-width` transition) — the `hidden` attribute
   * would force `display: none` and kill the transition. With `false`, the hook
   * still applies `aria-hidden`, `inert`, and `tabIndex={-1}` so the element is
   * removed from the accessibility tree and tab order while staying laid out.
   */
  setHiddenAttribute?: boolean;
};

/**
 * Canonical way to fully hide a control from assistive technology AND the tab
 * order while it must stay mounted.
 *
 * @remarks
 * **Prefer not rendering.** The simplest and most robust fix for a control that
 * should be unavailable is to *not render it at all* when it is hidden. Reach
 * for this hook only when the element MUST stay mounted — e.g. to preserve
 * internal state, layout measurements, or enter/exit transitions.
 *
 * @example
 * ```tsx
 * const Toolbar = ({ collapsed }: { collapsed: boolean }) => {
 *   const inertProps = useInertWhenHidden(collapsed);
 *   return <button {...inertProps}>Add attachment</button>;
 * };
 * ```
 *
 * When `hidden === true`, the returned props make the element:
 * - absent from the accessibility tree (`aria-hidden`, `hidden`),
 * - unreachable via Tab (`tabIndex={-1}`, `inert`),
 * - non-interactive (`inert`).
 *
 * When `hidden === false`, every returned attribute is `undefined`, so spreading
 * the object is a no-op and the element behaves exactly as normal. In
 * particular, `aria-hidden` is omitted entirely (never emitted as
 * `aria-hidden="false"`).
 *
 * Exact attribute values rendered to the DOM:
 * - hidden: `aria-hidden=""(true)`, `hidden`, `tabindex="-1"`, `inert`
 * - shown:  none of the above attributes present
 *
 * **Cross-React-version handling of `inert`:** React 19 supports `inert` as a
 * native boolean prop (`inert={true}` → DOM `inert=""`). React 17/18 do not
 * recognize it and only forward it as a string (`inert="true"` → DOM
 * `inert="true"`). Either of the *other* forms (a boolean on React 17/18, or an
 * empty string on React 19) emits a console warning and/or drops the attribute.
 * We therefore pick the correct form per major version via `React.version`. The
 * resulting DOM attribute is present and falls back to `tabIndex={-1}` +
 * `aria-hidden` on the rare engines lacking `inert` support.
 *
 * **Styling is out of scope.** The HTML `hidden` attribute applies
 * `display: none`. If a consumer needs the element to remain *visible in the
 * layout* (e.g. hidden purely via CSS or kept for transitions), pass
 * `{ setHiddenAttribute: false }` so the `hidden` attribute is omitted while the
 * a11y/focus semantics (`aria-hidden`, `inert`, `tabIndex={-1}`) still apply.
 * The remaining styling is then the consumer's concern.
 *
 * @param hidden Whether the control is currently hidden.
 * @param options Behavior options — see {@link UseInertWhenHiddenOptions}. Use
 *   `{ setHiddenAttribute: false }` for elements hidden via CSS/transition.
 * @returns A stable, memoized props object to spread onto the element.
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
