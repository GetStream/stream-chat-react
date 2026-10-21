import {
  autoPlacement,
  type AutoPlacementOptions,
  autoUpdate,
  flip as flipMw,
  offset as offsetMw,
  type Placement,
  shift as shiftMw,
  size as sizeMw,
  useFloating,
} from '@floating-ui/react';

const hasResizeObserver = typeof window !== 'undefined' && 'ResizeObserver' in window;

export type PopperLikePlacement = Placement | 'auto' | 'auto-start' | 'auto-end';

function autoMiddlewareFor(p: PopperLikePlacement) {
  if (!String(p).startsWith('auto')) return null;
  const alignment: AutoPlacementOptions['alignment'] =
    p === 'auto-start' ? 'start' : p === 'auto-end' ? 'end' : undefined;
  return autoPlacement({ alignment });
}

export type OffsetOpt =
  | number
  | { mainAxis?: number; crossAxis?: number; alignmentAxis?: number }
  | [crossAxis: number, mainAxis: number];

function toOffsetMw(opt?: OffsetOpt) {
  if (opt == null) return null;
  if (Array.isArray(opt)) {
    const [crossAxis, mainAxis] = opt;
    return offsetMw({ crossAxis, mainAxis });
  }
  if (typeof opt === 'number') return offsetMw(opt);
  return offsetMw(opt);
}

export type UsePopoverParams = {
  placement?: PopperLikePlacement;
  /** Flips on overflow, except for 'auto*', 'left*' and 'right*' placements. Defaults to true. */
  allowFlip?: boolean;
  /** Shifts the popover to stay inside the viewport. Defaults to true. */
  allowShift?: boolean;
  /** Options for the Floating UI `shift()` middleware, merged over the default `padding: 8`. */
  shiftOptions?: Parameters<typeof shiftMw>[0];
  /** Constrains the max size to the available space instead of overflowing. Defaults to false. */
  fitAvailableSpace?: boolean;
  /** Offset as a number, an object, or a `[crossAxis, mainAxis]` tuple. */
  offset?: OffsetOpt;
  /** Disables `autoUpdate`, so the position updates only through `update()`. Defaults to false. */
  freeze?: boolean;
  /**
   * Options of Floating UI's `autoUpdate`, merged over defaults that follow ancestor scroll and
   * resize (and element resize when `ResizeObserver` exists). Ignored when `freeze` is true.
   */
  autoUpdateOptions?: Partial<Parameters<typeof autoUpdate>[3]>;
};

export function usePopoverPosition({
  allowFlip = true,
  allowShift = true,
  autoUpdateOptions,
  fitAvailableSpace = false,
  freeze = false,
  offset,
  placement = 'bottom-start',
  shiftOptions,
}: UsePopoverParams) {
  const autoMw = autoMiddlewareFor(placement);
  const offsetMiddleware = toOffsetMw(offset);
  const isSidePlacement = placement.startsWith('left') || placement.startsWith('right');
  const mergedShiftOptions = shiftOptions
    ? { padding: 8, ...shiftOptions }
    : { padding: 8 };

  const middleware = [
    // Offset runs before the other middleware.
    ...(offsetMiddleware ? [offsetMiddleware] : []),

    // Either autoPlacement ('auto*') or flip(); flip() is skipped for 'left*' and 'right*'.
    ...(autoMw ? [autoMw] : allowFlip && !isSidePlacement ? [flipMw()] : []),

    ...(allowShift ? [shiftMw(mergedShiftOptions)] : []),

    // Caps the floating element to the space left in the viewport (after flip/shift) so a tall
    // popover scrolls inside it instead of overflowing.
    ...(fitAvailableSpace
      ? [
          sizeMw({
            apply({ availableHeight, availableWidth, elements }) {
              Object.assign(elements.floating.style, {
                maxHeight: `${Math.max(0, availableHeight)}px`,
                maxWidth: `${Math.max(0, availableWidth)}px`,
              });
            },
            padding: 8,
          }),
        ]
      : []),
  ];

  // 'auto*' seeds with 'bottom'; autoPlacement picks the final placement.
  const seedPlacement: Placement = String(placement).startsWith('auto')
    ? 'bottom'
    : (placement as Placement);

  return useFloating({
    middleware,
    placement: seedPlacement,
    strategy: 'fixed',
    whileElementsMounted: freeze
      ? undefined
      : (reference, floating, update) =>
          autoUpdate(reference, floating, update, {
            ancestorResize: true,
            ancestorScroll: true,
            animationFrame: false,
            elementResize: hasResizeObserver,
            ...autoUpdateOptions,
          }),
  });
}
