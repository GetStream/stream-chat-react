import {
  autoPlacement,
  autoUpdate,
  flip as flipMw,
  offset as offsetMw,
  type Placement,
  shift as shiftMw,
  size as sizeMw,
  useFloating,
} from '@floating-ui/react';
import type { AutoPlacementOptions } from '@floating-ui/core';

const hasResizeObserver = typeof window !== 'undefined' && 'ResizeObserver' in window;

export type PopperLikePlacement = Placement | 'auto' | 'auto-start' | 'auto-end';

function autoMiddlewareFor(p: PopperLikePlacement) {
  if (!String(p).startsWith('auto')) return null;
  const alignment: AutoPlacementOptions['alignment'] =
    p === 'auto-start' ? 'start' : p === 'auto-end' ? 'end' : undefined;
  return autoPlacement({ alignment });
}

type OffsetOpt =
  | number
  | { mainAxis?: number; crossAxis?: number; alignmentAxis?: number }
  | [crossAxis: number, mainAxis: number]; // keep your tuple compat

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
  /** Add flip() when placement is not 'auto*' */
  allowFlip?: boolean;
  /** Keep in viewport; default true to match common popper setups */
  allowShift?: boolean;
  /** The floating UI is fitted to the available space (by constraining its max size) instead of letting it overflow; default false */
  fitAvailableSpace?: boolean;
  /** Offset (number, object, or [crossAxis, mainAxis] tuple) */
  offset?: OffsetOpt;
  /**
   * Freeze behavior like Popper's eventListeners: { scroll:false, resize:false }.
   * If true → no autoUpdate (you can call `update()` manually).
   */
  freeze?: boolean;
  /**
   * Fine-grained control of autoUpdate triggers (only if freeze=false).
   * Defaults match Popper's "disabled" example when all set to false.
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
}: UsePopoverParams) {
  const autoMw = autoMiddlewareFor(placement);
  const offsetMiddleware = toOffsetMw(offset);
  const isSidePlacement = placement.startsWith('left') || placement.startsWith('right');

  const middleware = [
    // offset first (mirrors common Popper setups)
    ...(offsetMiddleware ? [offsetMiddleware] : []),

    // choose between autoPlacement (Popper's "auto*") OR flip()
    // only allow flip when not explicitly 'left*' or 'right*'
    ...(autoMw ? [autoMw] : allowFlip && !isSidePlacement ? [flipMw()] : []),

    // viewport collision adjustments
    ...(allowShift ? [shiftMw({ padding: 8 })] : []),

    // optional size constraining
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    ...(fitAvailableSpace ? [sizeMw({ apply: () => {} })] : []),
  ];

  // if placement is 'auto*', seed with any static placement; autoPlacement will pick the final one
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
