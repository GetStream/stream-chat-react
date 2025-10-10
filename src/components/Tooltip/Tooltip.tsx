import type { ComponentProps } from 'react';
import React, { useEffect, useState } from 'react';
import type { PopperLikePlacement } from '../Dialog';
import { usePopoverPosition } from '../Dialog/hooks/usePopoverPosition';

export const Tooltip = ({ children, ...rest }: ComponentProps<'div'>) => (
  <div className='str-chat__tooltip' {...rest}>
    {children}
  </div>
);

export type PopperTooltipProps<T extends HTMLElement> = React.PropsWithChildren<{
  /** Reference element to which the tooltip should attach to */
  referenceElement: T | null;
  /** Popper's modifier (offset) property - [xAxis offset, yAxis offset], default [0, 10] */
  offset?: [number, number];
  /** Popper's placement property defining default position of the tooltip, default 'top' */
  placement?: PopperLikePlacement;
  /** Tells component whether to render its contents */
  visible?: boolean;
}>;

export const PopperTooltip = <T extends HTMLElement>({
  children,
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
      className='str-chat__tooltip'
      data-placement={resolvedPlacement}
      ref={setPopperElement}
      style={{ left: x ?? 0, position: strategy, top: y ?? 0 }}
    >
      {children}
    </div>
  );
};
