import type { ComponentProps } from 'react';
import React, { useEffect, useState } from 'react';
import type { PopperLikePlacement } from '../Dialog';
import { usePopoverPosition } from '../Dialog/hooks/usePopoverPosition';
import clsx from 'clsx';

export const Tooltip = ({ children, className, ...rest }: ComponentProps<'div'>) => (
  <div className={clsx('str-chat__tooltip', className)} {...rest}>
    {children}
  </div>
);

export type PopperTooltipProps<T extends HTMLElement> = React.PropsWithChildren<{
  /** Element the tooltip attaches to. */
  referenceElement: T | null;
  /** Class merged with the default. */
  className?: string;
  /** Offset in pixels as `[crossAxis, mainAxis]`. Defaults to `[0, 10]`. */
  offset?: [number, number];
  /** Placement of the tooltip relative to the reference element. Defaults to `'top'`. */
  placement?: PopperLikePlacement;
  /** Whether to render the contents. Defaults to `false`. */
  visible?: boolean;
}>;

export const PopperTooltip = <T extends HTMLElement>({
  children,
  className,
  offset = [0, 10],
  placement = 'top',
  referenceElement,
  visible = false,
}: PopperTooltipProps<T>) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const {
    placement: resolvedPlacement,
    refs,
    strategy,
    x,
    y,
  } = usePopoverPosition({
    offset,
    placement,
  });

  useEffect(() => {
    refs.setReference(referenceElement);
  }, [referenceElement, refs]);

  useEffect(() => {
    refs.setFloating(popperElement);
  }, [popperElement, refs]);

  if (!visible) return null;

  return (
    <div
      className={clsx('str-chat__tooltip', className)}
      data-placement={resolvedPlacement}
      ref={setPopperElement}
      style={{ left: x ?? 0, position: strategy, top: y ?? 0 }}
    >
      {children}
    </div>
  );
};
