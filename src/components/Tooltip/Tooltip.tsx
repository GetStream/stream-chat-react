import React, { ComponentProps } from 'react';

export const Tooltip = (props: ComponentProps<'div'>) => {
  const { children, ...rest } = props;
  return (
    <div className='str-chat__tooltip' {...rest}>
      {children}
    </div>
  );
};
