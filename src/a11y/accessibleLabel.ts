import type { TranslationContextValue } from '../context/TranslationContext';

/** Produces one segment of a composed accessible name; return `undefined`/empty to omit it. */
export type AccessibleLabelPart<TData> = (data: TData) => string | undefined;

/** Customization for a part-composed accessible name. */
export type AccessibleLabelConfig<TData> = {
  /** Returns the entire label; `order`, `parts` and `separator` are then ignored. */
  build?: (data: TData) => string;
  /** Which parts to include, in what order. A part not listed here is never rendered. */
  order?: ReadonlyArray<string>;
  /** Override or add individual part generators; merged over the defaults. */
  parts?: Record<string, AccessibleLabelPart<TData>>;
  /** Joiner between non-empty parts. Defaults to ". ". */
  separator?: string;
};

/**
 * Composes an accessible name from named parts, joining the non-empty segments with
 * `config.separator`. `config.build` replaces the whole label; `config.parts` merge over
 * `defaultParts`.
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

// Label parts shared by several list rows. Each is typed over only the data it reads, so parameter
// contravariance makes it assignable to the wider per-row part types.
type WithT = { t: TranslationContextValue['t'] };

/**
 * Announces the active (currently open) row in its name, because `aria-selected` alone is not
 * reliably spoken for an option with a custom name.
 */
export const activeLabelPart: AccessibleLabelPart<WithT & { active?: boolean }> = ({
  active,
  t,
}) => (active ? t('a11y.accessibleLabel.active.ariaLabel', 'Active') : undefined);

/** Announces the unread count when there is one. */
export const unreadCountLabelPart: AccessibleLabelPart<
  WithT & { unreadCount?: number }
> = ({ t, unreadCount }) =>
  typeof unreadCount === 'number' && unreadCount > 0
    ? t('a11y.accessibleLabel.unreadMessage.ariaLabel', {
        count: unreadCount,
        defaultValue_one: '{{ count }} unread message',
        defaultValue_other: '{{ count }} unread messages',
      })
    : undefined;
