import React, { ComponentProps, useState } from 'react';
import { PopperProps, usePopper } from 'react-popper';

export const Tooltip = ({ children, ...rest }: ComponentProps<'div'>) => (
  <div className='str-chat__tooltip' {...rest}>
    {children}
  </div>
);

export const PopperTooltip = <T extends HTMLElement>({
  children,
  offset = [0, 10],
  referenceElement,
  placement = 'top',
  visible: visible = false,
}: React.PropsWithChildren<{
  referenceElement: T | null;
  offset?: [number, number];
  placement?: PopperProps<unknown>['placement'];
  visible?: boolean;
}>) => {
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
      className='str-chat__tooltip str-chat__button-tooltip'
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
    >
      {children}
    </div>
  );
};
