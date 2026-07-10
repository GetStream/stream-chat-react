import type { TranslationContextValue } from '../context/TranslationContext';

/** Produces one segment of a composed accessible name; return `undefined`/empty to omit it. */
export type AccessibleLabelPart<TData> = (data: TData) => string | undefined;

/** Customization for a part-composed accessible name (the channel/thread list-row labels). */
export type AccessibleLabelConfig<TData> = {
  /** Full override — return the entire label; ignores `order`/`parts`/`separator`. */
  build?: (data: TData) => string;
  /** Which parts to include, in what order. A part not listed here is never rendered. */
  order?: ReadonlyArray<string>;
  /** Override or add individual part generators; merged over the defaults. */
  parts?: Record<string, AccessibleLabelPart<TData>>;
  /** Joiner between non-empty parts. Defaults to ". ". */
  separator?: string;
};

/**
 * Composes a single accessible name from named parts: applies `config.build` if present, otherwise
 * merges `config.parts` over `defaultParts`, walks `config.order ?? defaultOrder`, and joins the
 * non-empty segments with `config.separator ?? '. '`. Shared by the channel and thread list-row
 * labels so the assembly logic lives in one place.
 */
export const composeAccessibleLabel = <TData>(
  data: TData,
  defaultParts: Record<string, AccessibleLabelPart<TData>>,
  defaultOrder: ReadonlyArray<string>,
  config: AccessibleLabelConfig<TData> = {},
): string => {
  if (config.build) return config.build(data);
  const parts: Record<string, AccessibleLabelPart<TData>> = {
    ...defaultParts,
    ...config.parts,
  };
  const order = config.order ?? defaultOrder;
  return order
    .map((key) => parts[key]?.(data))
    .filter((value): value is string => !!value)
    .join(config.separator ?? '. ');
};

// Parts shared verbatim across list-row labels. Typed over the minimal data each needs; function
// parameter contravariance makes them assignable to the wider channel/thread part types.
type WithT = { t: TranslationContextValue['t'] };

/**
 * Announces the active (currently open) row. The active state is announced here (not left to the
 * row's `aria-selected` alone, which is not reliably spoken across screen readers for an option with
 * a custom name); `aria-selected` is kept on the active row for listbox semantics.
 */
export const activeLabelPart: AccessibleLabelPart<WithT & { active?: boolean }> = ({
  active,
  t,
}) => (active ? t('aria/Active') : undefined);

/** Announces the unread count when there is one. */
export const unreadCountLabelPart: AccessibleLabelPart<
  WithT & { unreadCount?: number }
> = ({ t, unreadCount }) =>
  typeof unreadCount === 'number' && unreadCount > 0
    ? t('aria/{{ count }} unread message', { count: unreadCount })
    : undefined;
