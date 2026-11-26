import {
  autoPlacement,
  type AutoPlacementOptions,
  autoUpdate,
  type Boundary,
  flip as flipMw,
  type Middleware,
  type MiddlewareState,
  offset as offsetMw,
  type Placement,
  shift as shiftMw,
  size as sizeMw,
  useFloating,
} from '@floating-ui/react';

const hasResizeObserver = typeof window !== 'undefined' && 'ResizeObserver' in window;

export type PopperLikePlacement = Placement | 'auto' | 'auto-start' | 'auto-end';

/** Resolves the area a popover stays inside, each time its position is computed. */
export type GetPopoverBoundary = (floating: HTMLElement) => Boundary;

/** Returns the smallest height, in px, the size cap may shrink the popover to. */
export type GetPopoverMinHeight = (floating: HTMLElement) => number;

/** The element's layout offset from the container's top, unaffected by transforms. */
const offsetTopWithin = (element: HTMLElement, container: HTMLElement) => {
  let top = 0;
  for (let el: Element | null = element; el && el !== container; ) {
    if (!(el instanceof HTMLElement)) break;
    top += el.offsetTop;
    el = el.offsetParent;
  }
  return top;
};

/**
 * Room for the popover's first visible item and a half, so a capped popover shows that it scrolls.
 * Measured from layout, not boxes, which an opening animation can still be moving.
 */
export const getItemsMinHeight: GetPopoverMinHeight = (floating) => {
  const items = floating.querySelectorAll<HTMLElement>(
    'button, [role^="menuitem"], [role="option"]',
  );
  for (const item of items) {
    if (!item.offsetHeight) continue; // hidden
    return offsetTopWithin(item, floating) + 1.5 * item.offsetHeight;
  }
  return 0;
};

/** Sets the middleware's `boundary` from `getBoundary` when the position is computed. */
const withBoundary = <T extends object>(options: T, getBoundary?: GetPopoverBoundary) =>
  getBoundary
    ? (state: MiddlewareState) => ({
        ...options,
        boundary: getBoundary(state.elements.floating),
      })
    : options;

/** Floating UI compares function options by source text, so these deps let it see new options. */
const boundaryDeps = (options: object, getBoundary?: GetPopoverBoundary) => [
  options,
  getBoundary,
];

function autoMiddlewareFor(p: PopperLikePlacement, getBoundary?: GetPopoverBoundary) {
  if (!String(p).startsWith('auto')) return null;
  const alignment: AutoPlacementOptions['alignment'] =
    p === 'auto-start' ? 'start' : p === 'auto-end' ? 'end' : undefined;
  const options = { alignment };
  return autoPlacement(
    withBoundary(options, getBoundary),
    boundaryDeps(options, getBoundary),
  );
}

/** Lifts the previous size cap once per update, so flip measures the whole content. */
const measureUncappedSize: Middleware = {
  fn({ elements, middlewareData }) {
    if (middlewareData.measureUncappedSize) return {};
    elements.floating.style.maxHeight = '';
    elements.floating.style.maxWidth = '';
    return { data: { measured: true }, reset: { rects: true } };
  },
  name: 'measureUncappedSize',
};

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
  /** Shifts the popover to stay inside its boundary (see `getBoundary`). Defaults to true. */
  allowShift?: boolean;
  /** Options for the Floating UI `flip()` middleware. Must be stable. */
  flipOptions?: Parameters<typeof flipMw>[0];
  /** Options for the Floating UI `shift()` middleware, merged over the default `padding: 8`. */
  shiftOptions?: Parameters<typeof shiftMw>[0];
  /**
   * The area flip, autoPlacement, shift and `fitAvailableSpace` keep the popover inside. Defaults
   * to the clipping ancestors. Must be a stable function.
   */
  getBoundary?: GetPopoverBoundary;
  /** Caps the popover's max height and width to the space left in its boundary. Default false. */
  fitAvailableSpace?: boolean;
  /**
   * With `fitAvailableSpace`, the cap never goes below this height (or the content's, if
   * smaller), even if the popover then leaves its boundary. Must be a stable function.
   */
  getMinHeight?: GetPopoverMinHeight;
  /**
   * With `fitAvailableSpace`, flip measures the uncapped content, so a popover that grew can flip.
   * May reset a descendant's scroll position on update. Defaults to false.
   */
  measureUncappedSize?: boolean;
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
  flipOptions,
  freeze = false,
  getBoundary,
  getMinHeight,
  measureUncappedSize: measureUncappedSizeOption = false,
  offset,
  placement = 'bottom-start',
  shiftOptions,
}: UsePopoverParams) {
  const autoMw = autoMiddlewareFor(placement, getBoundary);
  const offsetMiddleware = toOffsetMw(offset);
  const isSidePlacement = placement.startsWith('left') || placement.startsWith('right');
  const mergedShiftOptions = shiftOptions
    ? { padding: 8, ...shiftOptions }
    : { padding: 8 };

  const middleware = [
    ...(fitAvailableSpace && measureUncappedSizeOption ? [measureUncappedSize] : []),

    // Offset runs before the other middleware.
    ...(offsetMiddleware ? [offsetMiddleware] : []),

    // Either autoPlacement ('auto*') or flip(); flip() is skipped for 'left*' and 'right*'.
    ...(autoMw
      ? [autoMw]
      : allowFlip && !isSidePlacement
        ? [
            flipMw(
              withBoundary(flipOptions ?? {}, getBoundary),
              boundaryDeps(flipOptions ?? {}, getBoundary),
            ),
          ]
        : []),

    ...(allowShift
      ? [
          shiftMw(
            withBoundary(mergedShiftOptions, getBoundary),
            boundaryDeps(mergedShiftOptions, getBoundary),
          ),
        ]
      : []),

    // Caps the floating element to the space left in the boundary (after flip/shift) so a tall
    // popover scrolls inside it instead of overflowing.
    ...(fitAvailableSpace
      ? [
          sizeMw(
            withBoundary(
              {
                apply({
                  availableHeight,
                  availableWidth,
                  elements,
                  rects,
                }: MiddlewareState & {
                  availableHeight: number;
                  availableWidth: number;
                }) {
                  const minHeight = Math.min(
                    getMinHeight?.(elements.floating) ?? 0,
                    rects.floating.height,
                  );
                  Object.assign(elements.floating.style, {
                    maxHeight: `${Math.max(0, availableHeight, minHeight)}px`,
                    maxWidth: `${Math.max(0, availableWidth)}px`,
                  });
                },
                padding: 8,
              },
              getBoundary,
            ),
            [getBoundary, getMinHeight],
          ),
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
