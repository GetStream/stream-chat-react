import React, { ComponentProps, useState } from 'react';
import { PopperProps, usePopper } from 'react-popper';

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
  placement?: PopperProps<unknown>['placement'];
  /** Tells component whether to render its contents */
  visible?: boolean;
}>;

export const PopperTooltip = <T extends HTMLElement>({
  children,
  offset = [0, 10],
  referenceElement,
  placement = 'top',
  visible = false,
}: PopperTooltipProps<T>) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { attributes, styles } = usePopper(referenceElement, popperElement, {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset,
        },
      },
    ],
    placement,
  });

  if (!visible) return null;

  return (
    <div
      className='str-chat__tooltip'
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      {children}
    </div>
  );
};
